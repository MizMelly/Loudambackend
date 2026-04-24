const pool = require('../config/db');
const nodemailer = require('nodemailer');

const generateTrackingId = () => {
  return 'LD-' + Math.floor(100000 + Math.random() * 900000);
};

// EMAIL TRANSPORTER
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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

    // FETCH INSERTED COMPLAINT
    const [rows] = await pool.query(
      `SELECT * FROM complaints WHERE id = ?`,
      [result.insertId]
    );

    const complaint = rows[0];

    // SEND EMAIL (NON-BLOCKING SAFE)
    try {
      await transporter.sendMail({
        from: `"Loudam Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Complaint Received - ${trackingId}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height:1.6;">
            <h2>Complaint Submitted Successfully</h2>

            <p>Hi <b>${full_name}</b>,</p>

            <p>We have successfully received your complaint.</p>

            <p><b>Tracking ID:</b> ${trackingId}</p>
            <p><b>Business:</b> ${business_name}</p>
            <p><b>Subject:</b> ${subject}</p>

            <p>Use your tracking ID to follow up anytime.</p>

            <br/>

            <p>Regards,<br/><b>Loudam Team</b></p>
          </div>
        `
      });

      console.log("📩 Email sent to:", email);
    } catch (mailErr) {
      console.error("❌ Email failed:", mailErr.message);
      // IMPORTANT: do not fail request if email fails
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