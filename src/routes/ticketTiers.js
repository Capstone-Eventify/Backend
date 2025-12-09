const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTicketTiers,
  createTicketTier,
  updateTicketTier,
  deleteTicketTier
} = require('../controllers/ticketTierController');

// Public route - get ticket tiers for an event
router.get('/events/:eventId/ticket-tiers', getTicketTiers);

// Protected routes - organizer/admin only
router.post('/events/:eventId/ticket-tiers', protect, authorize('ORGANIZER', 'ADMIN'), createTicketTier);
router.put('/:tierId', protect, authorize('ORGANIZER', 'ADMIN'), updateTicketTier);
router.delete('/:tierId', protect, authorize('ORGANIZER', 'ADMIN'), deleteTicketTier);

module.exports = router;

