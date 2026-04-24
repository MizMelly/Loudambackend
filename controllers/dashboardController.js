const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved
      FROM complaints
      WHERE user_id = $1
      `,
      [userId]
    );

    const raw = result.rows[0];

    // 🔥 normalize to numbers
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