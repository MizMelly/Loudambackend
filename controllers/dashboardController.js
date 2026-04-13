const pool = require('../config/db');

// GET DASHBOARD STATS
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Submitted') AS submitted,
        COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved
      FROM complaints
      WHERE user_id = $1
      `,
      [userId]
    );

    res.status(200).json({
      success: true,
      stats: result.rows[0],
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};