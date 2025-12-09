const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTickets,
  getTicket,
  checkInTicket,
  getEventTickets,
  getTicketByQRCode
} = require('../controllers/ticketController');

router.get('/', protect, getTickets);
router.get('/qr/:qrCode', protect, authorize('ORGANIZER', 'ADMIN'), getTicketByQRCode);
router.get('/:id', protect, getTicket);
router.post('/:id/checkin', protect, authorize('ORGANIZER', 'ADMIN'), checkInTicket);
router.get('/event/:eventId', protect, authorize('ORGANIZER', 'ADMIN'), getEventTickets);

module.exports = router;

