const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved
      FROM complaints
      WHERE user_id = ?
      `,
      [userId]
    );

    const raw = rows[0];

    const stats = {
      total: Number(raw.total),
      pending: Number(raw.pending),
      in_progress: Number(raw.in_progress),
      resolved: Number(raw.resolved),
    };

    res.status(200).json({
      success: true,
      stats,
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};