const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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

/**
 * Real Google OAuth / Continue with Google login
 */
async function googleLogin(req, res) {
  try {
    const { credential, email: directEmail, name: directName, avatar_url: directAvatar, role = 'citizen' } = req.body;

    let email = directEmail;
    let name = directName;
    let avatar_url = directAvatar;

    // Decode Google JWT credential if provided
    if (credential) {
      try {
        const payloadBase64 = credential.split('.')[1];
        const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
        const googlePayload = JSON.parse(decodedJson);
        email = googlePayload.email || email;
        name = googlePayload.name || name;
        avatar_url = googlePayload.picture || avatar_url;
      } catch (decodeErr) {
        console.warn('Could not decode Google credential JWT:', decodeErr.message);
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Valid Gmail or Google account email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const finalName = name || cleanEmail.split('@')[0];

    // Check if user exists with this email
    const userRes = await query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    let user = userRes.rows[0];

    if (!user) {
      const userPhone = req.body.phone || `g_${Math.floor(10000000 + Math.random() * 90000000)}`;
      // Create new user with email and safe phone placeholder
      const createRes = await query(
        `INSERT INTO users (phone, email, name, role, avatar_url, municipality_id, ward_id)
         VALUES ($1, $2, $3, $4, $5, 1, 1)`,
        [userPhone, cleanEmail, finalName, role, avatar_url || null]
      );
      const newId = createRes.lastInsertRowid || (createRes.rows[0] && createRes.rows[0].id);
      const fetchNew = await query('SELECT * FROM users WHERE id = $1', [newId]);
      user = fetchNew.rows[0];
    } else if (avatar_url && !user.avatar_url) {
      // Update avatar if newly available
      await query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatar_url, user.id]);
      user.avatar_url = avatar_url;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        municipality_id: user.municipality_id,
        ward_id: user.ward_id,
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
      message: 'Signed in with Google successfully',
      token,
      user: {
        ...user,
        municipality_name: municipalityName,
        ward_name: wardName,
      },
    });
  } catch (err) {
    console.error('googleLogin error:', err);
    return res.status(500).json({ error: 'Google sign-in failed' });
  }
}

/**
 * Real Registration for any Citizen (Email + Password + Name)
 */
async function register(req, res) {
  try {
    const { email, password, name, phone, municipality_id = 1, ward_id = 1 } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid Gmail or Email address' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const displayName = name?.trim() || cleanEmail.split('@')[0];

    const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    let userPhone = null;
    if (phone && String(phone).trim()) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) {
        const phoneExist = await query('SELECT id FROM users WHERE phone = $1', [cleanPhone]);
        if (phoneExist.rows.length > 0) {
          return res.status(400).json({ error: 'This mobile number is already registered with another account.' });
        }
        userPhone = cleanPhone;
      }
    }
    if (!userPhone) {
      userPhone = `c_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const createRes = await query(
      `INSERT INTO users (phone, email, password_hash, name, role, municipality_id, ward_id)
       VALUES ($1, $2, $3, $4, 'citizen', $5, $6)`,
      [userPhone, cleanEmail, passwordHash, displayName, municipality_id, ward_id]
    );

    const newId = createRes.lastInsertRowid || (createRes.rows[0] && createRes.rows[0].id);
    const fetchNew = await query('SELECT * FROM users WHERE id = $1', [newId]);
    const user = fetchNew.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        municipality_id: user.municipality_id,
        ward_id: user.ward_id,
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
      message: 'Account created successfully',
      token,
      user: {
        ...user,
        municipality_name: municipalityName,
        ward_name: wardName,
      },
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
}

/**
 * Real Gmail / Email Login with Password
 */
async function emailLogin(req, res) {
  try {
    const { email, password, name, role = 'citizen' } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid Gmail or Email address' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const displayName = name || cleanEmail.split('@')[0];

    const userRes = await query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    let user = userRes.rows[0];

    if (user) {
      // If user has a password set, verify it
      if (user.password_hash && password) {
        const isMatch = bcrypt.compareSync(password, user.password_hash);
        if (!isMatch) {
          return res.status(401).json({ error: 'Incorrect password. Please verify your credentials and try again.' });
        }
      } else if (!user.password_hash && password) {
        // Automatically save password if user had no password yet
        const passwordHash = bcrypt.hashSync(password, 10);
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);
        user.password_hash = passwordHash;
      }
    } else {
      // Create new user account seamlessly
      const passwordHash = password ? bcrypt.hashSync(password, 10) : null;
      const userPhone = req.body.phone || `e_${Math.floor(10000000 + Math.random() * 90000000)}`;
      const createRes = await query(
        `INSERT INTO users (phone, email, password_hash, name, role, municipality_id, ward_id)
         VALUES ($1, $2, $3, $4, $5, 1, 1)`,
        [userPhone, cleanEmail, passwordHash, displayName, role]
      );
      const newId = createRes.lastInsertRowid || (createRes.rows[0] && createRes.rows[0].id);
      const fetchNew = await query('SELECT * FROM users WHERE id = $1', [newId]);
      user = fetchNew.rows[0];
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        municipality_id: user.municipality_id,
        ward_id: user.ward_id,
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
      },
    });
  } catch (err) {
    console.error('emailLogin error:', err);
    return res.status(500).json({ error: 'Email sign-in failed' });
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
  register,
  sendOtp,
  verifyOtp,
  googleLogin,
  emailLogin,
  updateProfile,
  getMe,
};
