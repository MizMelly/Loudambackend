const express = require('express');
const router = express.Router();

const adminAuth = require('../middleware/adminAuth');
const complaintController = require('../controllers/complaintController');

router.get(
  '/complaints',
  adminAuth,
  complaintController.getAllComplaints
);

router.put(
  '/complaints/:id/status',
  adminAuth,
  complaintController.updateComplaintStatus
);

module.exports = router;