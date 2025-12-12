const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const notificationService = require('../services/notificationService');
const socketService = require('../services/socketService');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { 
    unreadOnly, 
    type, 
    page = 1, 
    limit = 50,
    startDate,
    endDate 
  } = req.query;

  const where = { userId };
  
  // Filter by read status
  if (unreadOnly === 'true') {
    where.isRead = false;
  }
  
  // Filter by notification type
  if (type && type !== 'all') {
    where.type = type;
  }
  
  // Filter by date range
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = Math.min(parseInt(limit), 100); // Max 100 per request

  // Get total count for pagination
  const totalCount = await prisma.notification.count({ where });

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    skip,
    take
  });

  const totalPages = Math.ceil(totalCount / take);

  res.status(200).json({
    success: true,
    count: notifications.length,
    totalCount,
    currentPage: parseInt(page),
    totalPages,
    hasNextPage: parseInt(page) < totalPages,
    hasPrevPage: parseInt(page) > 1,
    data: notifications
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await prisma.notification.findUnique({
    where: { id }
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  if (notification.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this notification'
    });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  res.status(200).json({
    success: true,
    data: updated
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await prisma.notification.findUnique({
    where: { id }
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  if (notification.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this notification'
    });
  }

  await prisma.notification.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });

  res.status(200).json({
    success: true,
    count
  });
});

// @desc    Send event reminder notification
// @route   POST /api/notifications/reminder
// @access  Private/Organizer
exports.sendEventReminder = asyncHandler(async (req, res) => {
  const { eventId, message } = req.body;
  const organizerId = req.user.id;

  // Verify user is event organizer
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, title: true }
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  if (event.organizerId !== organizerId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to send reminders for this event'
    });
  }

  // Get all attendees for this event
  const tickets = await prisma.ticket.findMany({
    where: {
      eventId,
      status: 'CONFIRMED'
    },
    include: {
      attendee: {
        select: {
          id: true
        }
      }
    }
  });

  // Create notifications for all attendees
  const notifications = tickets.map(ticket => ({
    userId: ticket.attendeeId,
    type: 'event',
    title: `Reminder: ${event.title}`,
    message: message || `Don't forget about ${event.title}!`,
    link: `/events/${eventId}`
  }));

  await prisma.notification.createMany({
    data: notifications
  });

  // Send real-time notifications using the notification service
  try {
    await notificationService.notifyEventReminder(eventId, message);
  } catch (error) {
    console.error('Error sending real-time reminder notifications:', error);
  }

  res.status(200).json({
    success: true,
    message: `Reminder sent to ${notifications.length} attendees`,
    count: notifications.length
  });
});

// @desc    Send test notification (for development)
// @route   POST /api/notifications/test
// @access  Private/Admin
exports.sendTestNotification = asyncHandler(async (req, res) => {
  const { type = 'info', title, message, targetUserId } = req.body;
  
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  const notification = {
    type,
    title: title || 'Test Notification',
    message: message || 'This is a test notification from the admin panel.',
    link: '/dashboard'
  };

  if (targetUserId) {
    await socketService.sendToUser(targetUserId, notification);
  } else {
    await socketService.sendToUser(req.user.id, notification);
  }

  res.status(200).json({
    success: true,
    message: 'Test notification sent'
  });
});

// @desc    Get real-time connection status
// @route   GET /api/notifications/status
// @access  Private
exports.getConnectionStatus = asyncHandler(async (req, res) => {
  const connectedUsers = socketService.getConnectedUsersCount();
  const isUserConnected = socketService.isUserConnected(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      connectedUsers,
      isUserConnected,
      userId: req.user.id
    }
  });
});
