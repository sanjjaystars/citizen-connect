const { query } = require('../db/db');

async function getHierarchy(req, res) {
  try {
    const muniRes = await query('SELECT * FROM municipalities ORDER BY state, district, name');
    const wardsRes = await query('SELECT * FROM wards ORDER BY name');
    const deptsRes = await query('SELECT * FROM departments ORDER BY name');

    // Build hierarchical tree: State -> District -> Municipality -> Wards & Departments
    const tree = {};

    for (const m of muniRes.rows) {
      if (!tree[m.state]) tree[m.state] = {};
      if (!tree[m.state][m.district]) tree[m.state][m.district] = [];

      const mWards = wardsRes.rows.filter((w) => w.municipality_id === m.id);
      const mDepts = deptsRes.rows.filter((d) => d.municipality_id === m.id);

      tree[m.state][m.district].push({
        id: m.id,
        name: m.name,
        wards: mWards,
        departments: mDepts
      });
    }

    return res.json({
      success: true,
      hierarchy: tree,
      municipalities: muniRes.rows,
      wards: wardsRes.rows,
      departments: deptsRes.rows
    });
  } catch (err) {
    console.error('getHierarchy error:', err);
    return res.status(500).json({ error: 'Failed to fetch location hierarchy' });
  }
}

async function getWards(req, res) {
  try {
    const { municipality_id } = req.query;
    let sql = 'SELECT * FROM wards';
    let params = [];

    if (municipality_id) {
      sql += ' WHERE municipality_id = $1';
      params.push(municipality_id);
    }
    sql += ' ORDER BY name';

    const result = await query(sql, params);
    return res.json({ success: true, wards: result.rows });
  } catch (err) {
    console.error('getWards error:', err);
    return res.status(500).json({ error: 'Failed to fetch wards' });
  }
}

async function getDepartments(req, res) {
  try {
    const { municipality_id } = req.query;
    let sql = 'SELECT * FROM departments';
    let params = [];

    if (municipality_id) {
      sql += ' WHERE municipality_id = $1';
      params.push(municipality_id);
    }
    sql += ' ORDER BY name';

    const result = await query(sql, params);
    return res.json({ success: true, departments: result.rows });
  } catch (err) {
    console.error('getDepartments error:', err);
    return res.status(500).json({ error: 'Failed to fetch departments' });
  }
}

module.exports = {
  getHierarchy,
  getWards,
  getDepartments,
};
