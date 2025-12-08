const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getEventAnalytics,
  getOrganizerAnalytics
} = require('../controllers/analyticsController');

router.get('/event/:eventId', protect, authorize('ORGANIZER', 'ADMIN'), getEventAnalytics);
router.get('/organizer', protect, authorize('ORGANIZER', 'ADMIN'), getOrganizerAnalytics);

module.exports = router;

