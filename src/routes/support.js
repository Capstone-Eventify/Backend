const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createSupportTicket,
  getSupportTickets,
  getSupportTicket
} = require('../controllers/supportController');

router.post('/tickets', protect, createSupportTicket);
router.get('/tickets', protect, getSupportTickets);
router.get('/tickets/:id', protect, getSupportTicket);

module.exports = router;

