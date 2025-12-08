const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { sendEmail } = require('../utils/email');
const { sendSMS } = require('../utils/sms');
const { sendPushNotification } = require('../utils/pushNotifications');

// @desc    Send event reminder
// @route   POST /api/notifications/reminder
// @access  Private/Organizer
exports.sendEventReminder = asyncHandler(async (req, res) => {
  const { eventId, reminderType } = req.body; // reminderType: 'email', 'sms', 'push', 'all'
  const userId = req.user.id;

  // Get event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: true,
      tickets: {
        where: { status: 'CONFIRMED' },
        include: {
          attendee: true
        }
      }
    }
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  if (event.organizerId !== userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  const results = [];
  const reminderMessage = `Reminder: ${event.title} is happening ${getTimeUntilEvent(event.startDate)}. Don't forget to attend!`;

  for (const ticket of event.tickets) {
    const attendee = ticket.attendee;
    
    try {
      if (reminderType === 'email' || reminderType === 'all') {
        await sendEmail({
          email: attendee.email,
          subject: `Reminder: ${event.title}`,
          message: reminderMessage,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Event Reminder</h2>
              <p>Hi ${attendee.firstName},</p>
              <p>${reminderMessage}</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">${event.title}</h3>
                <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${event.startTime}</p>
                <p><strong>Location:</strong> ${event.venueName || event.city}</p>
              </div>
              <p>We look forward to seeing you there!</p>
            </div>
          `
        });
        results.push({ attendeeId: attendee.id, email: 'sent' });
      }

      if (reminderType === 'sms' || reminderType === 'all') {
        if (attendee.phone) {
          await sendSMS(attendee.phone, reminderMessage);
          results.push({ attendeeId: attendee.id, sms: 'sent' });
        }
      }

      if (reminderType === 'push' || reminderType === 'all') {
        await sendPushNotification(attendee.id, {
          title: 'Event Reminder',
          body: reminderMessage,
          data: { eventId, type: 'reminder' }
        });
        results.push({ attendeeId: attendee.id, push: 'sent' });
      }
    } catch (error) {
      results.push({ attendeeId: attendee.id, error: error.message });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Reminders sent',
    count: results.length,
    results
  });
});

// Helper function
function getTimeUntilEvent(eventDate) {
  const now = new Date();
  const event = new Date(eventDate);
  const diff = event - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 7) return `in ${days} days`;
  if (days < 30) return `in ${Math.floor(days / 7)} weeks`;
  return `in ${Math.floor(days / 30)} months`;
}

