const socketService = require('./socketService');
const { sendEmail } = require('../utils/email');
const { sendPushNotification } = require('../utils/pushNotifications');
const prisma = require('../lib/prisma');

class NotificationService {
  // Event Registration Notification
  async notifyEventRegistration(ticketData) {
    try {
      const { ticket, event, attendee } = ticketData;
      
      // Real-time notification to user
      await socketService.sendToUser(attendee.id, {
        type: 'ticket_confirmed',
        title: 'Registration Confirmed!',
        message: `Your registration for "${event.title}" has been confirmed. Your ticket is ready!`,
        link: `/dashboard?tab=tickets`,
        metadata: {
          eventId: event.id,
          ticketId: ticket.id,
          eventTitle: event.title
        }
      });

      // Email notification
      try {
        await this.sendRegistrationEmail(attendee, event, ticket);
      } catch (emailError) {
        console.error('Error sending registration email:', emailError);
        // Don't fail the notification if email fails
      }

      // Notify event organizer
      await socketService.sendToUser(event.organizerId, {
        type: 'info',
        title: 'New Registration',
        message: `${attendee.firstName} ${attendee.lastName} registered for "${event.title}"`,
        link: `/dashboard/events/${event.id}`,
        metadata: {
          eventId: event.id,
          attendeeId: attendee.id,
          eventTitle: event.title
        }
      });

      console.log(`Registration notifications sent for event: ${event.title}`);
    } catch (error) {
      console.error('Error sending registration notifications:', error);
    }
  }

  // Event Cancellation Notification
  async notifyEventCancellation(eventId, reason = 'Event has been cancelled') {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          tickets: {
            where: { status: 'CONFIRMED' },
            include: {
              attendee: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      if (!event) return;

      // Notify all attendees
      const attendeeIds = event.tickets.map(ticket => ticket.attendeeId);
      
      await socketService.sendToUsers(attendeeIds, {
        type: 'event_deleted',
        title: 'Event Cancelled',
        message: `"${event.title}" has been cancelled. ${reason}`,
        link: `/dashboard?tab=tickets`,
        metadata: {
          eventId: event.id,
          eventTitle: event.title,
          reason
        }
      });

      // Send cancellation emails
      for (const ticket of event.tickets) {
        try {
          await this.sendCancellationEmail(ticket.attendee, event, reason);
        } catch (emailError) {
          console.error('Error sending cancellation email:', emailError);
          // Continue with other emails
        }
      }

      console.log(`Cancellation notifications sent for event: ${event.title}`);
    } catch (error) {
      console.error('Error sending cancellation notifications:', error);
    }
  }

  // Refund Notification
  async notifyRefund(refundData) {
    try {
      const { payment, ticket, event, attendee, reason } = refundData;
      
      // Notify user about refund
      await socketService.sendToUser(attendee.id, {
        type: 'refund_requested',
        title: 'Refund Processed',
        message: `Your refund for "${event.title}" has been processed. Amount: $${payment.amount}`,
        link: `/dashboard?tab=tickets`,
        metadata: {
          eventId: event.id,
          ticketId: ticket.id,
          paymentId: payment.id,
          amount: payment.amount,
          reason
        }
      });

      // Email notification
      try {
        await this.sendRefundEmail(attendee, event, payment, reason);
      } catch (emailError) {
        console.error('Error sending refund email:', emailError);
        // Don't fail the notification if email fails
      }

      // Notify event organizer
      await socketService.sendToUser(event.organizerId, {
        type: 'warning',
        title: 'Refund Processed',
        message: `Refund processed for ${attendee.firstName} ${attendee.lastName} - "${event.title}" ($${payment.amount})`,
        link: `/dashboard/events/${event.id}`,
        metadata: {
          eventId: event.id,
          attendeeId: attendee.id,
          amount: payment.amount,
          reason
        }
      });

      console.log(`Refund notifications sent for event: ${event.title}`);
    } catch (error) {
      console.error('Error sending refund notifications:', error);
    }
  }

  // Event Reminder Notification
  async notifyEventReminder(eventId, customMessage = null) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          tickets: {
            where: { status: 'CONFIRMED' },
            include: {
              attendee: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      if (!event) return;

      const eventDate = new Date(event.startDate);
      const now = new Date();
      const timeDiff = eventDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));

      let message = customMessage;
      if (!message) {
        if (daysUntil <= 1) {
          message = `"${event.title}" is starting soon! Don't forget to attend.`;
        } else {
          message = `Reminder: "${event.title}" is in ${daysUntil} days.`;
        }
      }

      // Notify all attendees
      const attendeeIds = event.tickets.map(ticket => ticket.attendeeId);
      
      await socketService.sendToUsers(attendeeIds, {
        type: 'info',
        title: 'Event Reminder',
        message,
        link: `/events/${eventId}`,
        metadata: {
          eventId: event.id,
          eventTitle: event.title,
          daysUntil
        }
      });

      // Send reminder emails
      for (const ticket of event.tickets) {
        try {
          await this.sendReminderEmail(ticket.attendee, event, message);
        } catch (emailError) {
          console.error('Error sending reminder email:', emailError);
          // Continue with other emails
        }
      }

      console.log(`Reminder notifications sent for event: ${event.title}`);
    } catch (error) {
      console.error('Error sending reminder notifications:', error);
    }
  }

  // Waitlist Approval Notification
  async notifyWaitlistApproval(waitlistEntry) {
    try {
      const { userId, event } = waitlistEntry;
      
      await socketService.sendToUser(userId, {
        type: 'waitlist_approved',
        title: 'Waitlist Approved!',
        message: `Great news! You can now register for "${event.title}". Limited time offer!`,
        link: `/events/${event.id}`,
        metadata: {
          eventId: event.id,
          eventTitle: event.title
        }
      });

      // Get user details for email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true }
      });

      if (user) {
        try {
          await this.sendWaitlistApprovalEmail(user, event);
        } catch (emailError) {
          console.error('Error sending waitlist approval email:', emailError);
          // Don't fail the notification if email fails
        }
      }

      console.log(`Waitlist approval notification sent for event: ${event.title}`);
    } catch (error) {
      console.error('Error sending waitlist approval notification:', error);
    }
  }

  // Admin Notifications
  async notifyAdmins(notification) {
    try {
      await socketService.sendToRole('ADMIN', notification);
      console.log('Admin notification sent:', notification.title);
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }

  // Email Templates
  async sendRegistrationEmail(attendee, event, ticket) {
    try {
      const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const eventTime = event.startTime || 'Time TBD';
      const venue = event.venueName || 'Venue TBD';
      const location = `${event.city || ''}, ${event.state || ''} ${event.country || ''}`.trim();

      await sendEmail({
        email: attendee.email,
        subject: `Registration Confirmed - ${event.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Registration Confirmed!</h2>
            <p>Hi ${attendee.firstName},</p>
            <p>Your registration for <strong>${event.title}</strong> has been confirmed!</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Event Details</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><strong>Time:</strong> ${eventTime}</p>
              <p><strong>Venue:</strong> ${venue}</p>
              ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
              <p><strong>Ticket Type:</strong> ${ticket.ticketType}</p>
              <p><strong>Order Number:</strong> ${ticket.orderNumber}</p>
            </div>

            <p>You can download your ticket and view event details in your dashboard.</p>
            <p style="margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?tab=tickets" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View My Tickets
              </a>
            </p>
            
            <p>We look forward to seeing you at the event!</p>
            <p>Best regards,<br>The Eventify Team</p>
          </div>
        `
      });
    } catch (error) {
      console.error('Error sending registration email:', error);
    }
  }

  async sendCancellationEmail(attendee, event, reason) {
    try {
      await sendEmail({
        email: attendee.email,
        subject: `Event Cancelled - ${event.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #DC2626;">Event Cancelled</h2>
            <p>Hi ${attendee.firstName},</p>
            <p>We regret to inform you that <strong>${event.title}</strong> has been cancelled.</p>
            
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
              <p><strong>Reason:</strong> ${reason}</p>
            </div>

            <p>Your ticket will be automatically refunded to your original payment method within 5-7 business days.</p>
            <p>If you have any questions, please contact our support team.</p>
            
            <p>We apologize for any inconvenience caused.</p>
            <p>Best regards,<br>The Eventify Team</p>
          </div>
        `
      });
    } catch (error) {
      console.error('Error sending cancellation email:', error);
    }
  }

  async sendRefundEmail(attendee, event, payment, reason) {
    try {
      await sendEmail({
        email: attendee.email,
        subject: `Refund Processed - ${event.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Refund Processed</h2>
            <p>Hi ${attendee.firstName},</p>
            <p>Your refund for <strong>${event.title}</strong> has been processed successfully.</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <p><strong>Refund Amount:</strong> $${payment.amount}</p>
              <p><strong>Reason:</strong> ${reason || 'Refund requested'}</p>
              <p><strong>Processing Time:</strong> 5-7 business days</p>
            </div>

            <p>The refund will appear on your original payment method within 5-7 business days.</p>
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Thank you for using Eventify.</p>
            <p>Best regards,<br>The Eventify Team</p>
          </div>
        `
      });
    } catch (error) {
      console.error('Error sending refund email:', error);
    }
  }

  async sendReminderEmail(attendee, event, message) {
    try {
      const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      await sendEmail({
        email: attendee.email,
        subject: `Reminder - ${event.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Event Reminder</h2>
            <p>Hi ${attendee.firstName},</p>
            <p>${message}</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Event Details</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><strong>Time:</strong> ${event.startTime || 'Time TBD'}</p>
              <p><strong>Venue:</strong> ${event.venueName || 'Venue TBD'}</p>
            </div>

            <p style="margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${event.id}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Event Details
              </a>
            </p>
            
            <p>We look forward to seeing you!</p>
            <p>Best regards,<br>The Eventify Team</p>
          </div>
        `
      });
    } catch (error) {
      console.error('Error sending reminder email:', error);
    }
  }

  async sendWaitlistApprovalEmail(user, event) {
    try {
      await sendEmail({
        email: user.email,
        subject: `Waitlist Approved - ${event.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Great News! You're Off the Waitlist</h2>
            <p>Hi ${user.firstName},</p>
            <p>Exciting news! A spot has opened up for <strong>${event.title}</strong> and you can now register!</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <p><strong>⏰ Limited Time:</strong> This offer is time-sensitive. Register now to secure your spot!</p>
            </div>

            <p style="margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${event.id}" 
                 style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Register Now
              </a>
            </p>
            
            <p>Don't miss out on this opportunity!</p>
            <p>Best regards,<br>The Eventify Team</p>
          </div>
        `
      });
    } catch (error) {
      console.error('Error sending waitlist approval email:', error);
    }
  }
}

// Export singleton instance
module.exports = new NotificationService();