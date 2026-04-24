const pool = require('../config/db');

const generateTrackingId = () => {
  return 'LD-' + Math.floor(100000 + Math.random() * 900000);
};

// CREATE COMPLAINT
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
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  proof_url = `${baseUrl}/uploads/${req.file.filename}`;
}

    const trackingId = generateTrackingId();
    const userId = req.user ? req.user.id : null;

    const [result] = await pool.query(
      `INSERT INTO complaints 
       (tracking_id, full_name, phone_number, email, country, social_handle,
        business_name, category, subject, description, desired_resolution, proof_url, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    // fetch inserted complaint
    const [rows] = await pool.query(
      `SELECT * FROM complaints WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      trackingId,
      complaint: rows[0]
    });

  } catch (err) {
    console.error("Create complaint error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to submit complaint"
    });
  }
};



// GET USER COMPLAINTS
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
       SET user_id = ?
       WHERE email = ? AND user_id IS NULL`,
      [userId, req.user.email]
    );

    const [rows] = await pool.query(
      `SELECT * FROM complaints
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      complaints: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};



// TRACK COMPLAINTS (PUBLIC)
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
      query += ` AND email = ?`;
      values.push(email);
    }

    if (phone) {
      query += ` AND phone_number = ?`;
      values.push(phone);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, values);

    res.json({
      success: true,
      complaints: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};



// GET ALL COMPLAINTS
exports.getAllComplaints = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM complaints ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      complaints: rows
    });
  } catch (err) {
    console.error('Get all complaints error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// UPDATE STATUS
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    await pool.query(
      `UPDATE complaints
       SET status = ?
       WHERE id = ?`,
      [status, req.params.id]
    );

    // fetch updated row
    const [rows] = await pool.query(
      `SELECT * FROM complaints WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      complaint: rows[0]
    });

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Update failed' });
  }
};