const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getEventsByOrganizer
} = require('../controllers/eventController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// Public routes (with optional auth to check user permissions for DRAFT events)
router.get('/', optionalAuth, getEvents);

// Protected routes - SPECIFIC ROUTE MUST COME BEFORE PARAMETERIZED ROUTE
router.get('/organizer/my-events', protect, authorize('organizer', 'admin'), getMyEvents);

// Public routes (continued) - parameterized routes after specific routes
router.get('/organizer/:organizerId', optionalAuth, getEventsByOrganizer);
router.get('/:id', optionalAuth, getEvent);
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);

module.exports = router;

