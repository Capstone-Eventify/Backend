const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { unreadOnly } = req.query;

  const where = { userId };
  if (unreadOnly === 'true') {
    where.isRead = false;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    take: 100 // Limit to 100 most recent
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
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

  res.status(200).json({
    success: true,
    message: `Reminder sent to ${notifications.length} attendees`,
    count: notifications.length
  });
});
