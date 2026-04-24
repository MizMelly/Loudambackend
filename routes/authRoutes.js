const express = require('express');
const router = express.Router();

const { register, login, forgotpassword } =
  require('../controllers/authController');

const { getDashboardStats } = require('../controllers/dashboardController');


const {
  createComplaint,
  getUserComplaints
} = require('../controllers/complaintController');

const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotpassword);

router.get('/dashboard', auth, getDashboardStats);

router.post('/complaints', auth, createComplaint);
router.get('/complaints', auth, getUserComplaints);

module.exports = router;