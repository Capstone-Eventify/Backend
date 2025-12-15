const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { sendEmail } = require('../utils/email');
const { generateTicketPDF } = require('../utils/pdfGenerator');
const communicationService = require('../services/communicationService');
const notificationService = require('../services/notificationService');

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

// @desc    Mark ticket as no-show and promote waitlisted user
// @route   POST /api/tickets/:id/no-show
// @access  Private/Organizer
exports.markNoShow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Get ticket with event info
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      event: {
        include: {
          organizer: true,
          ticketTiers: {
            where: { isActive: true }
          }
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
      ticketTier: true
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
      message: 'Not authorized to manage tickets for this event'
    });
  }

  if (ticket.status === 'CANCELLED') {
    return res.status(400).json({
      success: false,
      message: 'Cannot mark cancelled ticket as no-show'
    });
  }

  try {
    // Start transaction to handle no-show and waitlist promotion
    const result = await prisma.$transaction(async (tx) => {
      // Mark ticket as cancelled (no-show)
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          // Add a metadata field to track it was a no-show
          metadata: {
            ...(ticket.metadata || {}),
            noShow: true,
            noShowAt: new Date().toISOString(),
            noShowBy: userId
          }
        }
      });

      // Update event current bookings
      await tx.event.update({
        where: { id: ticket.eventId },
        data: {
          currentBookings: {
            decrement: 1
          }
        }
      });

      // Update ticket tier availability if applicable
      if (ticket.ticketTierId) {
        await tx.ticketTier.update({
          where: { id: ticket.ticketTierId },
          data: {
            available: {
              increment: 1
            }
          }
        });
      }

      // Find next waitlisted user for the same ticket tier
      const nextWaitlistEntry = await tx.waitlistEntry.findFirst({
        where: {
          eventId: ticket.eventId,
          ticketTierId: ticket.ticketTierId,
          status: 'pending'
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          ticketTier: true
        },
        orderBy: {
          requestedAt: 'asc' // First come, first served
        }
      });

      let promotedUser = null;

      if (nextWaitlistEntry) {
        // Create new ticket for waitlisted user
        const newTicket = await tx.ticket.create({
          data: {
            eventId: ticket.eventId,
            attendeeId: nextWaitlistEntry.userId,
            ticketTierId: ticket.ticketTierId,
            ticketType: ticket.ticketType,
            price: ticket.price,
            status: 'CONFIRMED',
            qrCode: `${ticket.eventId}-${nextWaitlistEntry.userId}-${Date.now()}`,
            orderNumber: `WAITLIST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            metadata: {
              promotedFromWaitlist: true,
              originalWaitlistEntryId: nextWaitlistEntry.id,
              promotedAt: new Date().toISOString(),
              replacedTicketId: ticket.id
            }
          }
        });

        // Create payment record for the promoted user
        await tx.payment.create({
          data: {
            userId: nextWaitlistEntry.userId,
            eventId: ticket.eventId,
            ticketId: newTicket.id,
            amount: ticket.price,
            status: 'COMPLETED',
            transactionId: `WAITLIST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            paymentMethod: 'waitlist_promotion',
            metadata: {
              promotedFromWaitlist: true,
              originalWaitlistEntryId: nextWaitlistEntry.id
            }
          }
        });

        // Update waitlist entry status
        await tx.waitlistEntry.update({
          where: { id: nextWaitlistEntry.id },
          data: {
            status: 'approved',
            notes: `Automatically promoted due to no-show. Ticket ID: ${newTicket.id}`
          }
        });

        // Update event current bookings (add back the promoted user)
        await tx.event.update({
          where: { id: ticket.eventId },
          data: {
            currentBookings: {
              increment: 1
            }
          }
        });

        // Decrease ticket tier availability again
        if (ticket.ticketTierId) {
          await tx.ticketTier.update({
            where: { id: ticket.ticketTierId },
            data: {
              available: {
                decrement: 1
              }
            }
          });
        }

        promotedUser = {
          id: nextWaitlistEntry.user.id,
          name: `${nextWaitlistEntry.user.firstName} ${nextWaitlistEntry.user.lastName}`,
          email: nextWaitlistEntry.user.email,
          ticketId: newTicket.id,
          orderNumber: newTicket.orderNumber
        };
      }

      return {
        noShowTicket: updatedTicket,
        promotedUser
      };
    });

    // Send notification to promoted user if applicable
    if (result.promotedUser) {
      try {
        // Send promotion notification
        await notificationService.notifyWaitlistPromotion({
          userId: result.promotedUser.id,
          userName: result.promotedUser.name,
          userEmail: result.promotedUser.email,
          event: ticket.event,
          ticketId: result.promotedUser.ticketId,
          orderNumber: result.promotedUser.orderNumber,
          replacedAttendee: `${ticket.attendee.firstName} ${ticket.attendee.lastName}`
        });
        console.log(`Promotion notification sent to ${result.promotedUser.email}`);
      } catch (notificationError) {
        console.error('Error sending promotion notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }
    }

    res.status(200).json({
      success: true,
      message: result.promotedUser 
        ? `Ticket marked as no-show and ${result.promotedUser.name} has been promoted from waitlist`
        : 'Ticket marked as no-show',
      data: {
        noShowTicket: {
          id: result.noShowTicket.id,
          attendeeName: `${ticket.attendee.firstName} ${ticket.attendee.lastName}`,
          attendeeEmail: ticket.attendee.email,
          status: result.noShowTicket.status
        },
        promotedUser: result.promotedUser
      }
    });

  } catch (error) {
    console.error('Error marking ticket as no-show:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing no-show. Please try again.'
    });
  }
});

// @desc    Undo no-show (restore ticket)
// @route   POST /api/tickets/:id/restore
// @access  Private/Organizer
exports.restoreTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Get ticket with event info
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      event: {
        select: {
          id: true,
          organizerId: true,
          maxAttendees: true,
          currentBookings: true
        }
      },
      attendee: {
        select: {
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

  // Check if user is event organizer or admin
  if (ticket.event.organizerId !== userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to manage tickets for this event'
    });
  }

  // Check if ticket was marked as no-show
  const isNoShow = ticket.metadata && 
    typeof ticket.metadata === 'object' && 
    ticket.metadata.noShow === true;

  if (ticket.status !== 'CANCELLED' || !isNoShow) {
    return res.status(400).json({
      success: false,
      message: 'Can only restore tickets that were marked as no-show'
    });
  }

  // Check if event has capacity
  if (ticket.event.currentBookings >= ticket.event.maxAttendees) {
    return res.status(400).json({
      success: false,
      message: 'Cannot restore ticket - event is at full capacity'
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Restore ticket
      const restoredTicket = await tx.ticket.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          metadata: {
            ...(ticket.metadata || {}),
            noShow: false,
            restoredAt: new Date().toISOString(),
            restoredBy: userId
          }
        }
      });

      // Update event current bookings
      await tx.event.update({
        where: { id: ticket.eventId },
        data: {
          currentBookings: {
            increment: 1
          }
        }
      });

      // Update ticket tier availability if applicable
      if (ticket.ticketTierId) {
        await tx.ticketTier.update({
          where: { id: ticket.ticketTierId },
          data: {
            available: {
              decrement: 1
            }
          }
        });
      }

      return restoredTicket;
    });

    res.status(200).json({
      success: true,
      message: 'Ticket restored successfully',
      data: {
        id: result.id,
        attendeeName: `${ticket.attendee.firstName} ${ticket.attendee.lastName}`,
        attendeeEmail: ticket.attendee.email,
        status: result.status
      }
    });

  } catch (error) {
    console.error('Error restoring ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring ticket. Please try again.'
    });
  }
});