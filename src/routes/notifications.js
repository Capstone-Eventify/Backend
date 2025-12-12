const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendEventReminder,
  sendTestNotification,
  getConnectionStatus
} = require('../controllers/notificationController');

// User routes
router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.get('/status', protect, getConnectionStatus);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

// Organizer routes
router.post('/reminder', protect, authorize('organizer', 'admin'), sendEventReminder);

// Admin routes
router.post('/test', protect, authorize('admin'), sendTestNotification);

module.exports = router;

