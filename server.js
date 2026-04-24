const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboard');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');

// MySQL pool
const pool = require('./config/db');

const app = express();

// Debug logs (safe ones)
console.log('🔍 ENV loaded');
console.log('🔍 JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded ✅' : 'Missing ❌');

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('🚀 Loudam API is running...');
});


// ✅ MySQL connection test
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');

    // optional test query
    const [rows] = await connection.query('SELECT 1');
    console.log('✅ Test query result:', rows);

    connection.release();
  } catch (err) {
    console.error('❌ MySQL connection error:', err.message);
  }
})();


// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});