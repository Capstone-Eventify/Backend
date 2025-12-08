const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { sendEventReminder } = require('../controllers/notificationController');

router.post('/reminder', protect, authorize('ORGANIZER', 'ADMIN'), sendEventReminder);

module.exports = router;

