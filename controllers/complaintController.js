const pool = require('../config/db');
// const nodemailer = require('nodemailer');   // Commented out for now

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

const generateTrackingId = () => {
  return 'LD-' + Math.floor(100000 + Math.random() * 900000);
};

// Create Complaint - Public (but saves user_id if logged in)
exports.createComplaint = async (req, res) => {
  try {
    const {
      full_name,
      phone_number,
      email,
      country = 'Nigeria',
      social_handle,
      business_name,
      category,
      subject,
      description,
      desiredResolution
    } = req.body;

    let proof_url = null;
    if (req.file) {
      proof_url = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    const trackingId = generateTrackingId();

    const userId = req.user ? req.user.id : null;

    const result = await pool.query(
      `INSERT INTO complaints 
       (tracking_id, full_name, phone_number, email, country, social_handle,
        business_name, category, subject, description, desired_resolution, proof_url, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        trackingId,
        full_name,
        phone_number,
        email,
        country,
        social_handle || null,
        business_name,
        category,
        subject,
        description,
        desiredResolution || null,
        proof_url,
        userId
      ]
    );

    console.log("🧾 Complaint created:", trackingId, "User:", userId || "Guest");

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      trackingId,
      complaint: result.rows[0]
    });

  } catch (err) {
    console.error("Create complaint error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to submit complaint"
    });
  }
};

// Get logged-in user's complaints (protected)
exports.getUserComplaints = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Login required'
      });
    }

    const userId = req.user.id;

    // Link old guest complaints to this user
    await pool.query(
      `UPDATE complaints
       SET user_id = $1
       WHERE email = $2 AND user_id IS NULL`,
      [userId, req.user.email]
    );
console.log("Logged in user email:", req.user.email);
    // Fetch user's complaints
    const result = await pool.query(
      `SELECT * FROM complaints
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      complaints: result.rows
    });

  } catch (err) {
    console.error('Get complaints error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Track complaints by email or phone (public)
exports.trackComplaints = async (req, res) => {
  try {
    const { email, phone } = req.query;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Provide email or phone'
      });
    }

    let query = `SELECT * FROM complaints WHERE 1=1`;
    const values = [];

    if (email) {
      values.push(email);
      query += ` AND email = $${values.length}`;
    }

    if (phone) {
      values.push(phone);
      query += ` AND phone_number = $${values.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      complaints: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// Get all complaints
exports.getAllComplaints = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM complaints ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      complaints: result.rows
    });
  } catch (err) {
    console.error('Get all complaints error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update complaint status
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE complaints
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );

    res.json({
      success: true,
      complaint: result.rows[0]
    });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Update failed' });
  }
};
exports.getUserComplaints = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Login required'
      });
    }

    const userId = req.user.id;

    // link guest complaints
    await pool.query(
      `UPDATE complaints
       SET user_id = $1
       WHERE email = $2 AND user_id IS NULL`,
      [userId, req.user.email]
    );

    const result = await pool.query(
      `SELECT * FROM complaints
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      complaints: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};