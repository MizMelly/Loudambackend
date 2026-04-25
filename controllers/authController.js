const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// REGISTER
exports.register = async (req, res) => {
  const { full_name, phone_number, email, password } = req.body;

  if (!full_name || !phone_number || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR phone_number = ?',
      [email, phone_number]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email or phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // INSERT (no RETURNING in MySQL)
    const [result] = await pool.query(
      `INSERT INTO users (full_name, phone_number, email, password)
       VALUES (?, ?, ?, ?)`,
      [full_name, phone_number, email, hashedPassword]
    );

    // fetch inserted user manually
    const [rows] = await pool.query(
      `SELECT id, full_name, phone_number, email, role
       FROM users WHERE id = ?`,
      [result.insertId]
    );

   const newUser = rows[0];

// 🔥 attach previous complaints
await pool.query(
  "UPDATE complaints SET user_id = ? WHERE email = ? AND user_id IS NULL",
  [newUser.id, newUser.email]
);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: newUser,
      token
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GOOGLE LOGIN
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google token missing",
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: "Google email not verified",
      });
    }

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    let user;

    // 🔥 CREATE USER IF NOT EXIST
    if (rows.length === 0) {
      const [result] = await pool.query(
        `INSERT INTO users (full_name, email, password, role)
         VALUES (?, ?, ?, ?)`,
        [name, email, null, "user"]
      );

      const [newUserRows] = await pool.query(
        "SELECT id, full_name, email, role FROM users WHERE id = ?",
        [result.insertId]
      );

      user = newUserRows[0];
    } else {
      user = rows[0];
    }

    // 🔥 NOW LINK COMPLAINTS (CORRECT PLACE)
    await pool.query(
      "UPDATE complaints SET user_id = ? WHERE email = ? AND user_id IS NULL",
      [user.id, user.email]
    );

    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      message: "Google login successful",
      user,
      token: jwtToken,
    });

  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};

//LOGiN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, phone_number, email, password, role
       FROM users WHERE email = ?`,
      [email]
    );

    const user = rows[0];

if (!user) {
  return res.status(401).json({
    success: false,
    message: 'Invalid email or password'
  });
}

// 🔥 NOW safe to link complaints
await pool.query(
  "UPDATE complaints SET user_id = ? WHERE email = ? AND user_id IS NULL",
  [user.id, user.email]
);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number
      },
      token
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Forgot Password (placeholder)
exports.forgotpassword = async (req, res) => {
  const { email } = req.body;
  res.status(200).json({
    success: true,
    message: `Password reset link sent to ${email} (not implemented yet)`
  });
};

module.exports = {
  register: exports.register,
  login: exports.login,
  forgotpassword: exports.forgotpassword,
  googleLogin: exports.googleLogin,
};