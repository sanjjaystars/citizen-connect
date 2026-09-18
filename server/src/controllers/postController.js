const { query, getDatabaseEngine } = require('../db/db');
const { classifyIssue, findDuplicates } = require('../services/aiService');

/**
 * Get feed posts:
 * - Scoped to citizen's ward (or explicit ward_id query parameter)
 * - Sort by 'newest' (default) or 'upvotes'
 * - Filter by category or status
 * - Returns upvote count and whether current user upvoted
 */
async function getPosts(req, res) {
  try {
    const currentUserId = req.user?.id || 0;
    const { ward_id, sort = 'newest', category, status, limit = 50, offset = 0 } = req.query;

    let whereClauses = [];
    let params = [];

    if (ward_id) {
      params.push(ward_id);
      whereClauses.push(`p.ward_id = $${params.length}`);
    }

    if (category && category !== 'All') {
      params.push(category);
      whereClauses.push(`p.category = $${params.length}`);
    }

    if (status && status !== 'All') {
      params.push(status);
      whereClauses.push(`p.status = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderSql = 'ORDER BY p.created_at DESC';
    if (sort === 'upvotes') {
      orderSql = 'ORDER BY upvotes_count DESC, p.created_at DESC';
    } else if (sort === 'severity') {
      orderSql = `ORDER BY 
        CASE p.severity 
          WHEN 'High' THEN 1 
          WHEN 'Medium' THEN 2 
          WHEN 'Low' THEN 3 
          ELSE 4 
        END ASC, p.created_at DESC`;
    }

    const sql = `
      SELECT 
        p.id,
        p.user_id,
        p.ward_id,
        p.department_id,
        p.category,
        p.description,
        p.cleaned_description,
        p.photo_url,
        p.lat,
        p.lng,
        p.severity,
        p.status,
        p.official_notes,
        p.created_at,
        u.name as author_name,
        u.phone as author_phone,
        w.name as ward_name,
        m.name as municipality_name,
        d.name as department_name,
        (SELECT COUNT(*) FROM upvotes uv WHERE uv.post_id = p.id) as upvotes_count,
        EXISTS(SELECT 1 FROM upvotes uv WHERE uv.post_id = p.id AND uv.user_id = $${params.length + 1}) as has_upvoted
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN wards w ON p.ward_id = w.id
      JOIN municipalities m ON w.municipality_id = m.id
      LEFT JOIN departments d ON p.department_id = d.id
      ${whereSql}
      ${orderSql}
      LIMIT $${params.length + 2} OFFSET $${params.length + 3};
    `;

    params.push(currentUserId, limit, offset);

    const result = await query(sql, params);

    // Format boolean has_upvoted
    const posts = result.rows.map((row) => ({
      ...row,
      upvotes_count: parseInt(row.upvotes_count || 0, 10),
      has_upvoted: Boolean(row.has_upvoted === 1 || row.has_upvoted === true || row.has_upvoted === 't')
    }));

    return res.json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (err) {
    console.error('getPosts error:', err);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
}

/**
 * Check for duplicate issues within ~50m before posting
 */
async function checkDuplicatePost(req, res) {
  try {
    const { lat, lng, category, description, ward_id } = req.body;

    if (!lat || !lng || !description) {
      return res.status(400).json({ error: 'Coordinates (lat, lng) and description are required' });
    }

    const dupResult = await findDuplicates(lat, lng, category, description, ward_id);
    return res.json({
      success: true,
      ...dupResult
    });
  } catch (err) {
    console.error('checkDuplicatePost error:', err);
    return res.status(500).json({ error: 'Duplicate check failed' });
  }
}

/**
 * AI Pre-classify endpoint (triggers live in the form as citizen types)
 */
async function previewClassification(req, res) {
  try {
    const { description } = req.body;
    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const aiResult = await classifyIssue(description);
    return res.json({
      success: true,
      classification: aiResult
    });
  } catch (err) {
    console.error('previewClassification error:', err);
    return res.status(500).json({ error: 'Classification preview failed' });
  }
}

/**
 * Create a new civic issue report
 */
async function createPost(req, res) {
  try {
    const userId = req.user.id;
    let {
      ward_id,
      department_id,
      category,
      description,
      cleaned_description,
      photo_url,
      lat,
      lng,
      severity
    } = req.body;

    // Support photo uploaded via multer
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    if (!photo_url) {
      return res.status(400).json({ error: 'Photo is required for civic issue reporting' });
    }

    if (!lat || !lng) {
      return res.status(400).json({ error: 'GPS coordinates or manual map pin are required' });
    }

    if (!description || description.trim().length < 5) {
      return res.status(400).json({ error: 'Detailed description is required' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedWardId = parseInt(ward_id, 10);

    // AI Classification if not fully provided
    if (!category || !department_id || !severity) {
      const aiResult = await classifyIssue(description);
      category = category || aiResult.category;
      severity = severity || aiResult.severity;
      cleaned_description = cleaned_description || aiResult.cleaned_description;

      // Find matching department in ward's municipality
      if (!department_id) {
        const wardRes = await query('SELECT municipality_id FROM wards WHERE id = $1', [parsedWardId]);
        const muniId = wardRes.rows[0]?.municipality_id;
        if (muniId) {
          const deptRes = await query(
            `SELECT id FROM departments 
             WHERE municipality_id = $1 AND (name LIKE $2 OR name LIKE $3)
             LIMIT 1`,
            [muniId, `%${category}%`, `%${aiResult.department.split(' ')[0]}%`]
          );
          department_id = deptRes.rows[0]?.id || null;
        }
      }
    }

    let insertRes;
    if (getDatabaseEngine() === 'postgresql') {
      insertRes = await query(
        `INSERT INTO posts (
          user_id, ward_id, department_id, category, description,
          cleaned_description, photo_url, lat, lng, geom, severity, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          ST_SetSRID(ST_MakePoint($9, $8), 4326),
          $10, 'Received'
        ) RETURNING *;`,
        [
          userId,
          parsedWardId,
          department_id || null,
          category,
          description,
          cleaned_description || description,
          photo_url,
          parsedLat,
          parsedLng,
          severity || 'Medium'
        ]
      );
    } else {
      insertRes = await query(
        `INSERT INTO posts (
          user_id, ward_id, department_id, category, description,
          cleaned_description, photo_url, lat, lng, severity, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Received'
        );`,
        [
          userId,
          parsedWardId,
          department_id || null,
          category,
          description,
          cleaned_description || description,
          photo_url,
          parsedLat,
          parsedLng,
          severity || 'Medium'
        ]
      );
    }

    const newId = insertRes.lastInsertRowid || (insertRes.rows[0] && insertRes.rows[0].id);

    // Auto-upvote by author
    await query(
      `INSERT INTO upvotes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
      [newId, userId]
    ).catch(() => {});

    // Fetch complete post record
    const postRes = await query(
      `SELECT p.*, w.name as ward_name, d.name as department_name, 1 as upvotes_count, 1 as has_upvoted
       FROM posts p
       JOIN wards w ON p.ward_id = w.id
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE p.id = $1`,
      [newId]
    );

    return res.status(201).json({
      success: true,
      message: 'Issue reported successfully and routed to municipality',
      post: postRes.rows[0]
    });
  } catch (err) {
    console.error('createPost error:', err);
    return res.status(500).json({ error: 'Failed to create post' });
  }
}

/**
 * Upvote / "Me Too" button toggle
 */
async function toggleUpvote(req, res) {
  try {
    const userId = req.user.id;
    const postId = parseInt(req.params.id, 10);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Check if existing
    const existing = await query('SELECT id FROM upvotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

    let hasUpvoted = false;
    if (existing.rowCount > 0) {
      // Remove upvote
      await query('DELETE FROM upvotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      hasUpvoted = false;
    } else {
      // Add upvote
      await query('INSERT INTO upvotes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
      hasUpvoted = true;
    }

    // Return new total count
    const countRes = await query('SELECT COUNT(*) as count FROM upvotes WHERE post_id = $1', [postId]);
    const upvotesCount = parseInt(countRes.rows[0].count, 10);

    return res.json({
      success: true,
      has_upvoted: hasUpvoted,
      upvotes_count: upvotesCount
    });
  } catch (err) {
    console.error('toggleUpvote error:', err);
    return res.status(500).json({ error: 'Failed to toggle upvote' });
  }
}

/**
 * Get single post details
 */
async function getPostById(req, res) {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.user?.id || 0;

    const sql = `
      SELECT 
        p.*,
        u.name as author_name,
        u.phone as author_phone,
        w.name as ward_name,
        m.name as municipality_name,
        d.name as department_name,
        (SELECT COUNT(*) FROM upvotes uv WHERE uv.post_id = p.id) as upvotes_count,
        EXISTS(SELECT 1 FROM upvotes uv WHERE uv.post_id = p.id AND uv.user_id = $2) as has_upvoted
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN wards w ON p.ward_id = w.id
      JOIN municipalities m ON w.municipality_id = m.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.id = $1;
    `;

    const result = await query(sql, [postId, currentUserId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = {
      ...result.rows[0],
      upvotes_count: parseInt(result.rows[0].upvotes_count || 0, 10),
      has_upvoted: Boolean(result.rows[0].has_upvoted === 1 || result.rows[0].has_upvoted === true || result.rows[0].has_upvoted === 't')
    };

    return res.json({ success: true, post });
  } catch (err) {
    console.error('getPostById error:', err);
    return res.status(500).json({ error: 'Failed to fetch post details' });
  }
}

module.exports = {
  getPosts,
  checkDuplicatePost,
  previewClassification,
  createPost,
  toggleUpvote,
  getPostById,
};
