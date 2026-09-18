const jwt = require('jsonwebtoken');
const { query } = require('../db/db');
const { JWT_SECRET } = require('../middleware/auth');

// Mock OTP service - static "123456" for demo
const DEMO_STATIC_OTP = '123456';

async function sendOtp(req, res) {
  try {
    const { phone } = req.body;
    if (!phone || phone.trim().length < 8) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);

    // Mock OTP dispatch
    console.log(`[MOCK OTP SERVICE] Generated OTP for ${cleanPhone}: ${DEMO_STATIC_OTP}`);

    return res.json({
      success: true,
      message: 'OTP sent successfully (Mock OTP: 123456)',
      phone: cleanPhone,
      mockOtp: DEMO_STATIC_OTP // Included for evaluator convenience
    });
  } catch (err) {
    console.error('sendOtp error:', err);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
}

async function verifyOtp(req, res) {
  try {
    const { phone, otp, role = 'citizen', name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);

    // Verify mock OTP
    if (otp.trim() !== DEMO_STATIC_OTP) {
      return res.status(400).json({ error: 'Invalid OTP. Please enter 123456 for demo.' });
    }

    // Check if user exists
    const userRes = await query('SELECT * FROM users WHERE phone = $1', [cleanPhone]);
    let user = userRes.rows[0];

    if (!user) {
      // Create new user
      const defaultName = name || (role === 'official' ? `Official (${cleanPhone.slice(-4)})` : `Citizen (${cleanPhone.slice(-4)})`);
      const defaultMuni = role === 'official' ? 1 : null;
      const defaultWard = null;

      const createRes = await query(
        `INSERT INTO users (phone, name, role, municipality_id, ward_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [cleanPhone, defaultName, role, defaultMuni, defaultWard]
      );

      const newId = createRes.lastInsertRowid || (createRes.rows[0] && createRes.rows[0].id);
      const fetchNew = await query('SELECT * FROM users WHERE id = $1', [newId]);
      user = fetchNew.rows[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        municipality_id: user.municipality_id,
        ward_id: user.ward_id
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Fetch associated municipality and ward name if set
    let municipalityName = null;
    let wardName = null;
    if (user.municipality_id) {
      const m = await query('SELECT name FROM municipalities WHERE id = $1', [user.municipality_id]);
      municipalityName = m.rows[0]?.name;
    }
    if (user.ward_id) {
      const w = await query('SELECT name FROM wards WHERE id = $1', [user.ward_id]);
      wardName = w.rows[0]?.name;
    }

    return res.json({
      success: true,
      token,
      user: {
        ...user,
        municipality_name: municipalityName,
        ward_name: wardName,
      }
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({ error: 'OTP verification failed' });
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, municipality_id, ward_id } = req.body;

    await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           municipality_id = COALESCE($2, municipality_id),
           ward_id = COALESCE($3, ward_id)
       WHERE id = $4`,
      [name || null, municipality_id || null, ward_id || null, userId]
    );

    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    // Re-issue token with updated ward
    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        municipality_id: user.municipality_id,
        ward_id: user.ward_id
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    let municipalityName = null;
    let wardName = null;
    if (user.municipality_id) {
      const m = await query('SELECT name FROM municipalities WHERE id = $1', [user.municipality_id]);
      municipalityName = m.rows[0]?.name;
    }
    if (user.ward_id) {
      const w = await query('SELECT name FROM wards WHERE id = $1', [user.ward_id]);
      wardName = w.rows[0]?.name;
    }

    return res.json({
      success: true,
      token,
      user: {
        ...user,
        municipality_name: municipalityName,
        ward_name: wardName,
      }
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let municipalityName = null;
    let wardName = null;
    if (user.municipality_id) {
      const m = await query('SELECT name FROM municipalities WHERE id = $1', [user.municipality_id]);
      municipalityName = m.rows[0]?.name;
    }
    if (user.ward_id) {
      const w = await query('SELECT name FROM wards WHERE id = $1', [user.ward_id]);
      wardName = w.rows[0]?.name;
    }

    return res.json({
      success: true,
      user: {
        ...user,
        municipality_name: municipalityName,
        ward_name: wardName,
      }
    });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Failed to get user profile' });
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
  updateProfile,
  getMe,
};
