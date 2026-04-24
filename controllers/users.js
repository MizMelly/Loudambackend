const pool = require('../config/db');

// GET USER DASHBOARD DATA
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('📊 Fetching dashboard for user ID:', userId);

    const [rows] = await pool.query(
      `SELECT full_name, phone_number, email
       FROM users
       WHERE id = ?`,
      [userId]
    );

    const user = rows[0];

    if (!user) {
      console.log('❌ User not found with ID:', userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log('✅ Dashboard data fetched:', user);

    res.status(200).json({
      success: true,
      data: user,
    });

  } catch (err) {
    console.error('❌ Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};