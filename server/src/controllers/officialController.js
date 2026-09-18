const { query } = require('../db/db');

/**
 * Get all posts in official's municipality jurisdiction
 */
async function getJurisdictionPosts(req, res) {
  try {
    const official = req.user;
    const {
      municipality_id = official.municipality_id || 1,
      ward_id,
      department_id,
      category,
      severity,
      status,
      sort = 'date',
      search
    } = req.query;

    let whereClauses = ['m.id = $1'];
    let params = [municipality_id];

    if (ward_id && ward_id !== 'All') {
      params.push(ward_id);
      whereClauses.push(`p.ward_id = $${params.length}`);
    }

    if (department_id && department_id !== 'All') {
      params.push(department_id);
      whereClauses.push(`p.department_id = $${params.length}`);
    }

    if (category && category !== 'All') {
      params.push(category);
      whereClauses.push(`p.category = $${params.length}`);
    }

    if (severity && severity !== 'All') {
      params.push(severity);
      whereClauses.push(`p.severity = $${params.length}`);
    }

    if (status && status !== 'All') {
      params.push(status);
      whereClauses.push(`p.status = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereClauses.push(`(p.description LIKE $${params.length} OR p.cleaned_description LIKE $${params.length} OR u.name LIKE $${params.length})`);
    }

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
    } else if (sort === 'oldest') {
      orderSql = 'ORDER BY p.created_at ASC';
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
        u.name as citizen_name,
        u.phone as citizen_phone,
        w.name as ward_name,
        m.name as municipality_name,
        d.name as department_name,
        (SELECT COUNT(*) FROM upvotes uv WHERE uv.post_id = p.id) as upvotes_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN wards w ON p.ward_id = w.id
      JOIN municipalities m ON w.municipality_id = m.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE ${whereClauses.join(' AND ')}
      ${orderSql};
    `;

    const result = await query(sql, params);

    return res.json({
      success: true,
      count: result.rows.length,
      posts: result.rows.map((r) => ({
        ...r,
        upvotes_count: parseInt(r.upvotes_count || 0, 10)
      }))
    });
  } catch (err) {
    console.error('getJurisdictionPosts error:', err);
    return res.status(500).json({ error: 'Failed to fetch jurisdiction issues' });
  }
}

/**
 * Update issue status (Received -> In Progress -> Resolved) and add official note
 */
async function updatePostStatus(req, res) {
  try {
    const postId = parseInt(req.params.id, 10);
    const { status, official_notes, department_id } = req.body;

    if (!['Received', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Received, In Progress, or Resolved' });
    }

    const updateFields = ['status = $1'];
    const params = [status];

    if (official_notes !== undefined) {
      params.push(official_notes);
      updateFields.push(`official_notes = $${params.length}`);
    }

    if (department_id) {
      params.push(department_id);
      updateFields.push(`department_id = $${params.length}`);
    }

    params.push(postId);
    const sql = `
      UPDATE posts
      SET ${updateFields.join(', ')}
      WHERE id = $${params.length}
    `;

    await query(sql, params);

    // Fetch updated post
    const fetchRes = await query(
      `SELECT p.*, w.name as ward_name, d.name as department_name,
              u.name as citizen_name, u.phone as citizen_phone,
              (SELECT COUNT(*) FROM upvotes uv WHERE uv.post_id = p.id) as upvotes_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN wards w ON p.ward_id = w.id
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE p.id = $1`,
      [postId]
    );

    return res.json({
      success: true,
      message: `Status updated to "${status}" successfully`,
      post: fetchRes.rows[0]
    });
  } catch (err) {
    console.error('updatePostStatus error:', err);
    return res.status(500).json({ error: 'Failed to update post status' });
  }
}

/**
 * Analytics: Open vs Resolved per category, severity breakdown, SLA stats
 */
async function getAnalytics(req, res) {
  try {
    const official = req.user;
    const municipality_id = req.query.municipality_id || official?.municipality_id || 1;

    // Total counts
    const totalStatsRes = await query(
      `SELECT 
        COUNT(*) as total_issues,
        SUM(CASE WHEN status = 'Received' THEN 1 ELSE 0 END) as count_received,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as count_in_progress,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as count_resolved,
        SUM(CASE WHEN severity = 'High' AND status != 'Resolved' THEN 1 ELSE 0 END) as count_high_priority
       FROM posts p
       JOIN wards w ON p.ward_id = w.id
       WHERE w.municipality_id = $1;`,
      [municipality_id]
    );

    // Category breakdown (open vs resolved)
    const categoryStatsRes = await query(
      `SELECT 
        category,
        COUNT(*) as total,
        SUM(CASE WHEN status != 'Resolved' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
       FROM posts p
       JOIN wards w ON p.ward_id = w.id
       WHERE w.municipality_id = $1
       GROUP BY category
       ORDER BY total DESC;`,
      [municipality_id]
    );

    // Ward breakdown
    const wardStatsRes = await query(
      `SELECT 
        w.name as ward_name,
        COUNT(p.id) as total,
        SUM(CASE WHEN p.status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN p.status != 'Resolved' THEN 1 ELSE 0 END) as open
       FROM wards w
       LEFT JOIN posts p ON w.id = p.ward_id
       WHERE w.municipality_id = $1
       GROUP BY w.id, w.name
       ORDER BY total DESC;`,
      [municipality_id]
    );

    return res.json({
      success: true,
      summary: totalStatsRes.rows[0],
      categories: categoryStatsRes.rows,
      wards: wardStatsRes.rows
    });
  } catch (err) {
    console.error('getAnalytics error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

module.exports = {
  getJurisdictionPosts,
  updatePostStatus,
  getAnalytics,
};
