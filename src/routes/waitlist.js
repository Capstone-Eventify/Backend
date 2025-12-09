const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  joinWaitlist,
  getWaitlistEntries,
  getUserWaitlistEntries,
  updateWaitlistEntry,
  removeFromWaitlist
} = require('../controllers/waitlistController');

// User routes
router.post('/events/:eventId/waitlist', protect, joinWaitlist);
router.get('/', protect, getUserWaitlistEntries);
router.delete('/:entryId', protect, removeFromWaitlist);

// Organizer routes
router.get('/events/:eventId/waitlist', protect, authorize('ORGANIZER', 'ADMIN'), getWaitlistEntries);
router.put('/:entryId', protect, authorize('ORGANIZER', 'ADMIN'), updateWaitlistEntry);

module.exports = router;

