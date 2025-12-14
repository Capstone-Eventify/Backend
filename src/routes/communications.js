const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const communicationService = require('../services/communicationService');
const asyncHandler = require('../middleware/asyncHandler');
const prisma = require('../lib/prisma');

// @desc    Test SMS functionality
// @route   POST /api/communications/test-sms
// @access  Private
router.post('/test-sms', protect, asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  const result = await communicationService.testSMS(phoneNumber);
  
  res.status(200).json({
    success: true,
    message: 'SMS test completed',
    data: result
  });
}));

// @desc    Test Email functionality
// @route   POST /api/communications/test-email
// @access  Private
router.post('/test-email', protect, asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const result = await communicationService.testEmail(email);
  
  res.status(200).json({
    success: true,
    message: 'Email test completed',
    data: result
  });
}));

// @desc    Send manual event reminder
// @route   POST /api/communications/send-reminder
// @access  Private (Admin/Organizer)
router.post('/send-reminder', protect, authorize('ORGANIZER', 'ADMIN'), asyncHandler(async (req, res) => {
  const { eventId, ticketId } = req.body;
  
  if (!eventId || !ticketId) {
    return res.status(400).json({
      success: false,
      message: 'Event ID and Ticket ID are required'
    });
  }

  // Get ticket with event and user data
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      event: true,
      attendee: true
    }
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Send SMS reminder only (use notification service for email + in-app notifications)
  const notifications = [];
  
  if (ticket.attendee.phone) {
    const smsMessage = `⏰ Reminder: "${ticket.event.title}" is tomorrow!\n\n📅 ${new Date(ticket.event.startDate).toLocaleDateString()} at ${ticket.event.startTime}\n📍 ${ticket.event.venueName || ticket.event.city}\n\nDon't forget to bring your ticket! - Eventify`;
    
    const smsResult = await communicationService.sendSMS(ticket.attendee.phone, smsMessage);
    notifications.push({ type: 'sms', ...smsResult });
  } else {
    notifications.push({ type: 'sms', success: false, error: 'No phone number available' });
  }
  
  res.status(200).json({
    success: true,
    message: 'Reminder sent successfully',
    data: notifications
  });
}));

// @desc    Get communication settings
// @route   GET /api/communications/settings
// @access  Private (Admin)
router.get('/settings', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const settings = {
    sms: {
      enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not configured'
    },
    email: {
      enabled: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      host: process.env.EMAIL_HOST || 'Not configured',
      user: process.env.EMAIL_USER || 'Not configured'
    }
  };
  
  res.status(200).json({
    success: true,
    data: settings
  });
}));

module.exports = router;