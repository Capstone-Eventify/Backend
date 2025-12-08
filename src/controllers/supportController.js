const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { sendEmail } = require('../utils/email');

// @desc    Create support ticket
// @route   POST /api/support/tickets
// @access  Private
exports.createSupportTicket = asyncHandler(async (req, res) => {
  const { subject, message, category, priority } = req.body;
  const userId = req.user.id;

  if (!subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Subject and message are required'
    });
  }

  // Create support ticket (using Event model as placeholder - in production, create SupportTicket model)
  // For now, we'll store in a JSON field or create a separate table
  const ticket = {
    id: `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    subject,
    message,
    category: category || 'general',
    priority: priority || 'medium',
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // In production, save to database:
  // const supportTicket = await prisma.supportTicket.create({
  //   data: {
  //     userId,
  //     subject,
  //     message,
  //     category,
  //     priority
  //   }
  // });

  // Send notification email to support team
  try {
    await sendEmail({
      email: process.env.SUPPORT_EMAIL || 'support@eventify.com',
      subject: `New Support Ticket: ${subject}`,
      message: `A new support ticket has been created.\n\nUser: ${req.user.email}\nSubject: ${subject}\nMessage: ${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Support Ticket</h2>
          <p><strong>User:</strong> ${req.user.email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Category:</strong> ${category || 'general'}</p>
          <p><strong>Priority:</strong> ${priority || 'medium'}</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
      `
    });
  } catch (error) {
    console.error('Failed to send support email:', error);
  }

  res.status(201).json({
    success: true,
    message: 'Support ticket created successfully',
    data: ticket
  });
});

// @desc    Get user support tickets
// @route   GET /api/support/tickets
// @access  Private
exports.getSupportTickets = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // In production, fetch from database:
  // const tickets = await prisma.supportTicket.findMany({
  //   where: { userId },
  //   orderBy: { createdAt: 'desc' }
  // });

  // Mock response
  res.status(200).json({
    success: true,
    count: 0,
    data: []
  });
});

// @desc    Get single support ticket
// @route   GET /api/support/tickets/:id
// @access  Private
exports.getSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // In production, fetch from database and verify ownership
  // const ticket = await prisma.supportTicket.findUnique({
  //   where: { id },
  //   include: { responses: true }
  // });

  res.status(200).json({
    success: true,
    message: 'Support ticket routes - Database model to be implemented'
  });
});

