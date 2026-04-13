const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 DEBUG: Environment variables loaded');
console.log('🔍 DEBUG: JWT_SECRET =', process.env.JWT_SECRET);
console.log('🔍 DEBUG: DATABASE_URL =', process.env.DATABASE_URL);

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboard');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');


const app = express();

// MiddlewareA
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes); 
app.use('/api/complaints', complaintRoutes);
app.use('/uploads', express.static('uploads'));

//admin routes
app.use('/api/admin', adminRoutes);

// PostgreSQL setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(client => {
    console.log('✅ Database connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.stack);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Loudam Backend running on http://localhost:${PORT}`);
});