const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create support ticket
// @route   POST /api/support-tickets
// @access  Private
exports.createTicket = asyncHandler(async (req, res) => {
  const { subject, description, category, priority } = req.body;
  const userId = req.user.id;

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject,
      description,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open'
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Support ticket created successfully',
    data: ticket
  });
});

// @desc    Get user's support tickets
// @route   GET /api/support-tickets
// @access  Private
exports.getMyTickets = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  const where = { userId };
  if (status) {
    where.status = status.toLowerCase();
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Get all support tickets (Admin/Support)
// @route   GET /api/support-tickets/all
// @access  Private/Admin
exports.getAllTickets = asyncHandler(async (req, res) => {
  const { status, category } = req.query;

  const where = {};
  if (status) {
    where.status = status.toLowerCase();
  }
  if (category) {
    where.category = category.toLowerCase();
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      replies: {
        select: {
          id: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1 // Get latest reply for count
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Get single support ticket
// @route   GET /api/support-tickets/:id
// @access  Private
exports.getTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  // Check if user owns the ticket or is admin
  if (ticket.userId !== userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this ticket'
    });
  }

  res.status(200).json({
    success: true,
    data: ticket
  });
});

// @desc    Update support ticket (Admin)
// @route   PUT /api/support-tickets/:id
// @access  Private/Admin
exports.updateTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, priority, assignedTo, resolution } = req.body;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id }
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  const updateData = {};
  if (status) updateData.status = status.toLowerCase();
  if (priority) updateData.priority = priority.toLowerCase();
  if (assignedTo) updateData.assignedTo = assignedTo;
  if (resolution) updateData.resolution = resolution;
  
  if (status === 'resolved' || status === 'closed') {
    updateData.resolvedAt = new Date();
  }

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Support ticket updated',
    data: updated
  });
});

// @desc    Add reply to support ticket
// @route   POST /api/support-tickets/:id/replies
// @access  Private
exports.addReply = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  // Check if ticket exists
  const ticket = await prisma.supportTicket.findUnique({
    where: { id }
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  // Check authorization: user must own ticket or be admin
  if (ticket.userId !== userId && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to reply to this ticket'
    });
  }

  // Create reply
  const reply = await prisma.supportTicketReply.create({
    data: {
      ticketId: id,
      userId,
      message,
      isAdminReply: isAdmin
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    }
  });

  // If admin replied, update ticket status to in_progress if it's open
  if (isAdmin && ticket.status === 'open') {
    await prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'in_progress',
        assignedTo: userId
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Reply added successfully',
    data: reply
  });
});

// @desc    Get replies for a support ticket
// @route   GET /api/support-tickets/:id/replies
// @access  Private
exports.getReplies = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if ticket exists and user has access
  const ticket = await prisma.supportTicket.findUnique({
    where: { id }
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Support ticket not found'
    });
  }

  // Check authorization
  if (ticket.userId !== userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view replies for this ticket'
    });
  }

  const replies = await prisma.supportTicketReply.findMany({
    where: { ticketId: id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  res.status(200).json({
    success: true,
    count: replies.length,
    data: replies
  });
});

