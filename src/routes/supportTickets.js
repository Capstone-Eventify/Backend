const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicket,
  updateTicket,
  addReply,
  getReplies
} = require('../controllers/supportTicketController');

// User routes
router.post('/', protect, createTicket);
router.get('/', protect, getMyTickets);
router.get('/:id', protect, getTicket);
router.get('/:id/replies', protect, getReplies);
router.post('/:id/replies', protect, addReply);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllTickets);
router.put('/:id', protect, authorize('admin'), updateTicket);

module.exports = router;

