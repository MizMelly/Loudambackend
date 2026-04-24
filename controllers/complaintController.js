const pool = require('../config/db');
const mailer = require("../utils/mailer");

const generateTrackingId = () => {
  return 'LD-' + Math.floor(100000 + Math.random() * 900000);
};


// VERIFY EMAIL SERVER ON STARTUP
mailer.verify((error) => {
  if (error) {
    console.log("❌ SMTP ERROR:", error);
  } else {
    console.log("📧 Email server is ready");
  }
});

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

    // ✅ validate email INSIDE function
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    let proof_url = null;

    if (req.file) {
      const baseUrl =
        process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

      proof_url = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const trackingId = generateTrackingId();
    const userId = req.user ? req.user.id : null;

    // INSERT INTO DB
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

    const [rows] = await pool.query(
      `SELECT * FROM complaints WHERE id = ?`,
      [result.insertId]
    );

    const complaint = rows[0];

    // EMAIL SEND (NON-BLOCKING)
    try {
  await mailer.sendMail({
    from: `"Loudam Support" <no-reply@loudam.com>`,
    to: email, // 👈 USER RECEIVES EMAIL HERE
    subject: `Complaint Received - ${trackingId}`,
    html: `
      <div style="font-family: Arial; padding:20px;">
        <h2 style="color:#ff6600;">Complaint Received</h2>

        <p>Hi <b>${full_name}</b>,</p>

        <p>We have successfully received your complaint.</p>

        <p>
          <b>Tracking ID:</b> ${trackingId}<br/>
          <b>Business:</b> ${business_name}<br/>
          <b>Category:</b> ${category}
        </p>

        <p>
          You can use your tracking ID to track progress anytime.
        </p>

        <p style="margin-top:20px;">
          Regards,<br/>
          <b>Loudam Support Team</b>
        </p>
      </div>
    `,
  });

  console.log("📩 Email sent successfully to user:", email);

} catch (err) {
  console.error("❌ Email sending failed:", err.message);
}
    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      trackingId,
      complaint
    });

  } catch (err) {
    console.error("Create complaint error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to submit complaint"
    });
  }
};
// GET ALL COMPLAINTS (ADMIN)
exports.getAllComplaints = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM complaints ORDER BY created_at DESC");
    res.json({ success: true, complaints: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch complaints" });
  }
};

// UPDATE COMPLAINT STATUS (ADMIN)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["Pending", "In Progress", "Resolved"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const [result] = await pool.query(
      "UPDATE complaints SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found"
      });
    }

    res.json({
      success: true,
      message: "Status updated"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to update status"
    });
  }
};

// GET USER COMPLAINTS (LOGGED-IN USER)
exports.getUserComplaints = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      "SELECT * FROM complaints WHERE user_id = ?",
      [userId]
    );

    res.json({ success: true, complaints: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch user complaints" });
  }
};

// TRACK COMPLAINT (PUBLIC)
exports.trackComplaints = async (req, res) => {
  try {
    const { trackingId } = req.query;

    const [rows] = await pool.query(
      "SELECT * FROM complaints WHERE tracking_id = ?",
      [trackingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found"
      });
    }

    res.json({ success: true, complaint: rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Tracking failed" });
  }
};