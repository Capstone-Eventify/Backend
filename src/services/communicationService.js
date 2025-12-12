const twilio = require('twilio');
const nodemailer = require('nodemailer');

class CommunicationService {
  constructor() {
    // Initialize Twilio
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Initialize Email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Send SMS notification
  async sendSMS(to, message) {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.log('Twilio not configured, skipping SMS');
        return { success: false, error: 'Twilio not configured' };
      }

      // Format phone number (ensure it starts with +)
      const phoneNumber = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;
      
      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log(`SMS sent successfully to ${phoneNumber}:`, result.sid);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // Send email notification
  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Email not configured, skipping email');
        return { success: false, error: 'Email not configured' };
      }

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'Eventify'} <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}:`, result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send event registration confirmation
  async sendEventRegistrationNotification(user, event, ticket) {
    const notifications = [];

    // SMS Message
    const smsMessage = `🎉 Registration confirmed for "${event.title}"!\n\n📅 ${new Date(event.startDate).toLocaleDateString()} at ${event.startTime}\n📍 ${event.venueName || event.city}\n🎫 Ticket ID: ${ticket.id}\n\nSee you there! - Eventify`;

    // Email HTML Content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .ticket-info { background: #e8f2ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
            <p>You're all set for ${event.title}</p>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Great news! Your registration for <strong>${event.title}</strong> has been confirmed.</p>
            
            <div class="event-details">
              <h3>📅 Event Details</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${event.startTime}</p>
              <p><strong>Location:</strong> ${event.venueName || event.city}</p>
              ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
            </div>

            <div class="ticket-info">
              <h3>🎫 Your Ticket</h3>
              <p><strong>Ticket ID:</strong> ${ticket.id}</p>
              <p><strong>Ticket Type:</strong> ${ticket.ticketTier?.name || 'General'}</p>
              <p><strong>Price:</strong> $${ticket.price}</p>
              <p><strong>Order Number:</strong> ${ticket.orderNumber}</p>
            </div>

            <p>
              <a href="${process.env.FRONTEND_URL}/dashboard?tab=tickets" class="button">
                View My Tickets
              </a>
            </p>

            <p><strong>Important:</strong> Please bring this confirmation or show your ticket on your mobile device at the event.</p>
            
            <p>We're excited to see you there!</p>
            
            <div class="footer">
              <p>This is an automated message from Eventify</p>
              <p>If you have any questions, please contact our support team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send SMS if user has phone number
    if (user.phone) {
      const smsResult = await this.sendSMS(user.phone, smsMessage);
      notifications.push({ type: 'sms', ...smsResult });
    }

    // Send Email
    const emailResult = await this.sendEmail(
      user.email,
      `🎉 Registration Confirmed: ${event.title}`,
      emailHtml
    );
    notifications.push({ type: 'email', ...emailResult });

    return notifications;
  }

  // Send event reminder (24 hours before)
  async sendEventReminder(user, event, ticket) {
    const notifications = [];

    // SMS Reminder
    const smsMessage = `⏰ Reminder: "${event.title}" is tomorrow!\n\n📅 ${new Date(event.startDate).toLocaleDateString()} at ${event.startTime}\n📍 ${event.venueName || event.city}\n\nDon't forget to bring your ticket! - Eventify`;

    // Email Reminder HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reminder-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Event Reminder</h1>
            <p>Don't forget about ${event.title}!</p>
          </div>
          <div class="content">
            <div class="reminder-box">
              <h3>🚨 Your event is tomorrow!</h3>
              <p>This is a friendly reminder that you're registered for <strong>${event.title}</strong>.</p>
            </div>
            
            <div class="event-details">
              <h3>📅 Event Details</h3>
              <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${event.startTime}</p>
              <p><strong>Location:</strong> ${event.venueName || event.city}</p>
            </div>

            <p>
              <a href="${process.env.FRONTEND_URL}/dashboard?tab=tickets" class="button">
                View My Ticket
              </a>
            </p>

            <p><strong>Don't forget:</strong> Bring your ticket confirmation or show it on your mobile device.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send SMS if user has phone number
    if (user.phone) {
      const smsResult = await this.sendSMS(user.phone, smsMessage);
      notifications.push({ type: 'sms', ...smsResult });
    }

    // Send Email
    const emailResult = await this.sendEmail(
      user.email,
      `⏰ Reminder: ${event.title} is tomorrow!`,
      emailHtml
    );
    notifications.push({ type: 'email', ...emailResult });

    return notifications;
  }

  // Send event cancellation notification
  async sendEventCancellationNotification(user, event, ticket) {
    const notifications = [];

    // SMS Message
    const smsMessage = `❌ Event Cancelled: "${event.title}" scheduled for ${new Date(event.startDate).toLocaleDateString()} has been cancelled. You will receive a full refund within 3-5 business days. - Eventify`;

    // Email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .cancellation-box { background: #ffebee; border: 1px solid #e74c3c; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .refund-info { background: #e8f5e8; border: 1px solid #4caf50; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Event Cancelled</h1>
            <p>Important update about ${event.title}</p>
          </div>
          <div class="content">
            <div class="cancellation-box">
              <h3>Event Cancellation Notice</h3>
              <p>We regret to inform you that <strong>${event.title}</strong> scheduled for ${new Date(event.startDate).toLocaleDateString()} has been cancelled.</p>
            </div>
            
            <div class="refund-info">
              <h3>💰 Refund Information</h3>
              <p>You will receive a <strong>full refund</strong> of $${ticket.price} within 3-5 business days.</p>
              <p>The refund will be processed to your original payment method.</p>
            </div>

            <p>We sincerely apologize for any inconvenience this may cause. We appreciate your understanding.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send SMS if user has phone number
    if (user.phone) {
      const smsResult = await this.sendSMS(user.phone, smsMessage);
      notifications.push({ type: 'sms', ...smsResult });
    }

    // Send Email
    const emailResult = await this.sendEmail(
      user.email,
      `❌ Event Cancelled: ${event.title}`,
      emailHtml
    );
    notifications.push({ type: 'email', ...emailResult });

    return notifications;
  }

  // Test SMS functionality
  async testSMS(phoneNumber) {
    return await this.sendSMS(
      phoneNumber,
      '🧪 Test SMS from Eventify! Your SMS notifications are working correctly. 🎉'
    );
  }

  // Test Email functionality
  async testEmail(email) {
    const testHtml = `
      <h2>🧪 Test Email from Eventify</h2>
      <p>Congratulations! Your email notifications are working correctly.</p>
      <p>You'll receive notifications for:</p>
      <ul>
        <li>Event registration confirmations</li>
        <li>Event reminders</li>
        <li>Event cancellations</li>
        <li>Important updates</li>
      </ul>
      <p>Thank you for using Eventify! 🎉</p>
    `;

    return await this.sendEmail(
      email,
      '🧪 Test Email from Eventify',
      testHtml
    );
  }
}

module.exports = new CommunicationService();