const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
exports.register = async (req, res) => {
  const { full_name, phone_number, email, password } = req.body;

  if (!full_name || !phone_number || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR phone_number = $2',
      [email, phone_number]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email or phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, phone_number, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, phone_number, email`,
      [full_name, phone_number, email, hashedPassword]
    );

    const newUser = result.rows[0];

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

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

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT id, full_name, phone_number, email, password, role
       FROM users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

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
  forgotpassword: exports.forgotpassword
};