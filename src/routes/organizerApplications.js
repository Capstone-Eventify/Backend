const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createApplication,
  getMyApplication,
  getAllApplications,
  approveApplication,
  rejectApplication
} = require('../controllers/organizerApplicationController');

// User routes
router.post('/', protect, createApplication);
router.get('/my-application', protect, getMyApplication);

// Admin routes
router.get('/', protect, authorize('admin'), getAllApplications);
router.put('/:id/approve', protect, authorize('admin'), approveApplication);
router.put('/:id/reject', protect, authorize('admin'), rejectApplication);

module.exports = router;

