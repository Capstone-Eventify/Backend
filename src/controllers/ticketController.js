const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { sendEmail } = require('../utils/email');
const { generateTicketPDF } = require('../utils/pdfGenerator');
const communicationService = require('../services/communicationService');

// @desc    Get user tickets
// @route   GET /api/tickets
// @access  Private
exports.getTickets = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  console.log('Fetching tickets for user:', userId);
  
  const tickets = await prisma.ticket.findMany({
    where: { attendeeId: userId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          image: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          venueName: true,
          city: true,
          state: true,
          country: true
        }
      },
      ticketTier: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true
        }
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

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicket = asyncHandler(async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: {
      event: true,
      ticketTier: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true
        }
      },
      attendee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Check if user owns the ticket or is admin
  if (ticket.attendeeId !== req.user.id && req.user.role !== 'ADMIN') {
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

// @desc    Check in attendee (scan QR code)
// @route   POST /api/tickets/:id/checkin
// @access  Private/Organizer
exports.checkInTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Get ticket
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      event: {
        include: {
          organizer: true
        }
      }
    }
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Check if user is event organizer or admin
  if (ticket.event.organizerId !== userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to check in tickets for this event'
    });
  }

  if (ticket.checkedIn) {
    return res.status(400).json({
      success: false,
      message: 'Ticket already checked in'
    });
  }

  // Update ticket
  const updatedTicket = await prisma.ticket.update({
    where: { id },
    data: {
      checkedIn: true,
      checkedInAt: new Date()
    },
    include: {
      attendee: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      event: {
        select: {
          title: true
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Ticket checked in successfully',
    data: updatedTicket
  });
});

// @desc    Get ticket by QR code
// @route   GET /api/tickets/qr/:qrCode
// @access  Private/Organizer
exports.getTicketByQRCode = asyncHandler(async (req, res) => {
  const { qrCode } = req.params;
  const userId = req.user.id;

  // Find ticket by QR code (which is now the ticket ID)
  const ticket = await prisma.ticket.findUnique({
    where: { qrCode },
    include: {
      event: {
        include: {
          organizer: true
        }
      },
      attendee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      ticketTier: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true
        }
      }
    }
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Check if user is event organizer or admin
  if (ticket.event.organizerId !== userId && req.user.role !== 'ADMIN') {
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

// @desc    Get tickets by event (for organizer)
// @route   GET /api/tickets/event/:eventId
// @access  Private/Organizer
exports.getEventTickets = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  // Verify user is event organizer
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true }
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
      message: 'Not authorized to view tickets for this event'
    });
  }

  const tickets = await prisma.ticket.findMany({
    where: { eventId },
    include: {
      attendee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
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


// @desc    Download ticket as PDF
// @route   GET /api/tickets/:id/download
// @access  Private
exports.downloadTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Get ticket with all related data
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          image: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          venueName: true,
          city: true,
          state: true,
          country: true
        }
      },
      ticketTier: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true
        }
      },
      attendee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Check if user owns the ticket or is admin/organizer
  if (ticket.attendeeId !== userId && req.user.role !== 'ADMIN') {
    // Also check if user is the event organizer
    const event = await prisma.event.findUnique({
      where: { id: ticket.eventId },
      select: { organizerId: true }
    });

    if (!event || event.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this ticket'
      });
    }
  }

  // Only allow download for confirmed tickets
  if (ticket.status !== 'CONFIRMED') {
    return res.status(400).json({
      success: false,
      message: 'Only confirmed tickets can be downloaded'
    });
  }

  try {
    // Prepare ticket data for PDF generation
    const ticketData = {
      ticket,
      event: ticket.event,
      attendee: ticket.attendee,
      ticketTier: ticket.ticketTier
    };

    // Generate PDF
    const pdfBuffer = await generateTicketPDF(ticketData);

    // Set response headers for PDF download
    const filename = `ticket_${ticket.event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${ticket.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating ticket PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating ticket PDF'
    });
  }
});