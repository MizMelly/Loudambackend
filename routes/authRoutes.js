const express = require('express');
const router = express.Router();
const { register, login, forgotpassword } = require('../controllers/authController');
const usersController = require('../controllers/users');
const { createComplaint, getUserComplaints } = require('../controllers/complaintController');

const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotpassword);
router.get('/dashboard', auth, usersController.getDashboard);
router.post('/complaints', auth, createComplaint);
router.get('/complaints', auth, getUserComplaints);


module.exports = router;