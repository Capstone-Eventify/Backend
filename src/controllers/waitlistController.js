const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Join waitlist for an event
// @route   POST /api/events/:eventId/waitlist
// @access  Private
exports.joinWaitlist = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { ticketTierId, quantity = 1, notes } = req.body;
  const userId = req.user.id;

  if (!ticketTierId) {
    return res.status(400).json({
      success: false,
      message: 'Ticket tier ID is required'
    });
  }

  // Check if event and tier exist
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      ticketTiers: {
        where: { id: ticketTierId, isActive: true }
      }
    }
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  if (event.ticketTiers.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Ticket tier not found'
    });
  }

  // Check if user is already on waitlist for this tier
  const existingEntry = await prisma.waitlistEntry.findUnique({
    where: {
      eventId_userId_ticketTierId: {
        eventId,
        userId,
        ticketTierId
      }
    }
  });

  if (existingEntry) {
    return res.status(400).json({
      success: false,
      message: 'You are already on the waitlist for this ticket tier'
    });
  }

  const waitlistEntry = await prisma.waitlistEntry.create({
    data: {
      eventId,
      userId,
      ticketTierId,
      quantity,
      status: 'pending',
      notes
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
      ticketTier: {
        select: {
          id: true,
          name: true,
          price: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Added to waitlist successfully',
    data: {
      id: waitlistEntry.id,
      eventId: waitlistEntry.eventId,
      userId: waitlistEntry.userId,
      userName: `${waitlistEntry.user.firstName} ${waitlistEntry.user.lastName}`,
      userEmail: waitlistEntry.user.email,
      ticketTierId: waitlistEntry.ticketTierId,
      ticketTierName: waitlistEntry.ticketTier.name,
      quantity: waitlistEntry.quantity,
      requestedAt: waitlistEntry.requestedAt.toISOString(),
      status: waitlistEntry.status,
      notes: waitlistEntry.notes
    }
  });
});

// @desc    Get waitlist entries for an event (organizer)
// @route   GET /api/events/:eventId/waitlist
// @access  Private/Organizer
exports.getWaitlistEntries = asyncHandler(async (req, res) => {
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
      message: 'Not authorized to view waitlist for this event'
    });
  }

  const waitlistEntries = await prisma.waitlistEntry.findMany({
    where: { eventId },
    include: {
      user: {
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
          price: true
        }
      }
    },
    orderBy: {
      requestedAt: 'asc'
    }
  });

  const formattedEntries = waitlistEntries.map(entry => ({
    id: entry.id,
    eventId: entry.eventId,
    userId: entry.userId,
    userName: `${entry.user.firstName} ${entry.user.lastName}`,
    userEmail: entry.user.email,
    ticketTierId: entry.ticketTierId,
    ticketTierName: entry.ticketTier.name,
    quantity: entry.quantity,
    requestedAt: entry.requestedAt.toISOString(),
    status: entry.status,
    notes: entry.notes
  }));

  res.status(200).json({
    success: true,
    count: formattedEntries.length,
    data: formattedEntries
  });
});

// @desc    Get user's waitlist entries
// @route   GET /api/waitlist
// @access  Private
exports.getUserWaitlistEntries = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const waitlistEntries = await prisma.waitlistEntry.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          image: true,
          startDate: true,
          startTime: true
        }
      },
      ticketTier: {
        select: {
          id: true,
          name: true,
          price: true
        }
      }
    },
    orderBy: {
      requestedAt: 'desc'
    }
  });

  const formattedEntries = waitlistEntries.map(entry => ({
    id: entry.id,
    eventId: entry.eventId,
    userId: entry.userId,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    userEmail: req.user.email,
    ticketTierId: entry.ticketTierId,
    ticketTierName: entry.ticketTier.name,
    quantity: entry.quantity,
    requestedAt: entry.requestedAt.toISOString(),
    status: entry.status,
    notes: entry.notes
  }));

  res.status(200).json({
    success: true,
    count: formattedEntries.length,
    data: formattedEntries
  });
});

// @desc    Update waitlist entry status (approve/reject)
// @route   PUT /api/waitlist/:entryId
// @access  Private/Organizer
exports.updateWaitlistEntry = asyncHandler(async (req, res) => {
  const { entryId } = req.params;
  const { status, notes } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be pending, approved, or rejected'
    });
  }

  const waitlistEntry = await prisma.waitlistEntry.findUnique({
    where: { id: entryId },
    include: {
      event: {
        select: { organizerId: true }
      }
    }
  });

  if (!waitlistEntry) {
    return res.status(404).json({
      success: false,
      message: 'Waitlist entry not found'
    });
  }

  if (waitlistEntry.event.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this waitlist entry'
    });
  }

  const updatedEntry = await prisma.waitlistEntry.update({
    where: { id: entryId },
    data: {
      status,
      notes: notes !== undefined ? notes : waitlistEntry.notes
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
      ticketTier: {
        select: {
          id: true,
          name: true,
          price: true
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Waitlist entry updated successfully',
    data: {
      id: updatedEntry.id,
      eventId: updatedEntry.eventId,
      userId: updatedEntry.userId,
      userName: `${updatedEntry.user.firstName} ${updatedEntry.user.lastName}`,
      userEmail: updatedEntry.user.email,
      ticketTierId: updatedEntry.ticketTierId,
      ticketTierName: updatedEntry.ticketTier.name,
      quantity: updatedEntry.quantity,
      requestedAt: updatedEntry.requestedAt.toISOString(),
      status: updatedEntry.status,
      notes: updatedEntry.notes
    }
  });
});

// @desc    Remove from waitlist
// @route   DELETE /api/waitlist/:entryId
// @access  Private
exports.removeFromWaitlist = asyncHandler(async (req, res) => {
  const { entryId } = req.params;
  const userId = req.user.id;

  const waitlistEntry = await prisma.waitlistEntry.findUnique({
    where: { id: entryId }
  });

  if (!waitlistEntry) {
    return res.status(404).json({
      success: false,
      message: 'Waitlist entry not found'
    });
  }

  if (waitlistEntry.userId !== userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to remove this waitlist entry'
    });
  }

  await prisma.waitlistEntry.delete({
    where: { id: entryId }
  });

  res.status(200).json({
    success: true,
    message: 'Removed from waitlist successfully'
  });
});

