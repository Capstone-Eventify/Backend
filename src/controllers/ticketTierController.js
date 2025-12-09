const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get ticket tiers for an event
// @route   GET /api/events/:eventId/ticket-tiers
// @access  Public
exports.getTicketTiers = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true }
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  const ticketTiers = await prisma.ticketTier.findMany({
    where: {
      eventId,
      isActive: true
    },
    orderBy: {
      price: 'asc'
    }
  });

  res.status(200).json({
    success: true,
    count: ticketTiers.length,
    data: ticketTiers
  });
});

// @desc    Create ticket tier for an event
// @route   POST /api/events/:eventId/ticket-tiers
// @access  Private/Organizer
exports.createTicketTier = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { name, price, description, quantity, available } = req.body;

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

  if (event.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to create ticket tiers for this event'
    });
  }

  const ticketTier = await prisma.ticketTier.create({
    data: {
      eventId,
      name,
      price: parseFloat(price),
      description,
      quantity: quantity || available || 100,
      available: available || quantity || 100,
      isActive: true
    }
  });

  res.status(201).json({
    success: true,
    data: ticketTier
  });
});

// @desc    Update ticket tier
// @route   PUT /api/ticket-tiers/:tierId
// @access  Private/Organizer
exports.updateTicketTier = asyncHandler(async (req, res) => {
  const { tierId } = req.params;

  const ticketTier = await prisma.ticketTier.findUnique({
    where: { id: tierId },
    include: {
      event: {
        select: { organizerId: true }
      }
    }
  });

  if (!ticketTier) {
    return res.status(404).json({
      success: false,
      message: 'Ticket tier not found'
    });
  }

  if (ticketTier.event.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this ticket tier'
    });
  }

  const updatedTier = await prisma.ticketTier.update({
    where: { id: tierId },
    data: req.body
  });

  res.status(200).json({
    success: true,
    data: updatedTier
  });
});

// @desc    Delete ticket tier
// @route   DELETE /api/ticket-tiers/:tierId
// @access  Private/Organizer
exports.deleteTicketTier = asyncHandler(async (req, res) => {
  const { tierId } = req.params;

  const ticketTier = await prisma.ticketTier.findUnique({
    where: { id: tierId },
    include: {
      event: {
        select: { organizerId: true }
      }
    }
  });

  if (!ticketTier) {
    return res.status(404).json({
      success: false,
      message: 'Ticket tier not found'
    });
  }

  if (ticketTier.event.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this ticket tier'
    });
  }

  // Soft delete by setting isActive to false
  await prisma.ticketTier.update({
    where: { id: tierId },
    data: { isActive: false }
  });

  res.status(200).json({
    success: true,
    message: 'Ticket tier deleted successfully'
  });
});

