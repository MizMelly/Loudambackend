const express = require('express');
const router = express.Router();

const complaintController = require('../controllers/complaintController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Submit a new complaint → PUBLIC (No login required)
router.post('/', upload.single('proof'), complaintController.createComplaint);

// Track complaints by email or phone → PUBLIC
router.get('/track', complaintController.trackComplaints);

// Get logged-in user's complaints → PROTECTED
router.get('/my', auth, complaintController.getUserComplaints);

module.exports = router;