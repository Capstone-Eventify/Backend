const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = asyncHandler(async (req, res) => {
  const {
    category,
    status,
    search,
    page = 1,
    limit = 10,
    sort = 'createdAt'
  } = req.query;

  // Build where clause
  const where = {};
  
  if (category) {
    where.category = category;
  }

  if (status) {
    where.status = status.toUpperCase();
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Count total
  const count = await prisma.event.count({ where });

  // Execute query
  const events = await prisma.event.findMany({
    where,
    include: {
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: { [sort]: 'desc' },
    take: parseInt(limit),
    skip: (parseInt(page) - 1) * parseInt(limit)
  });

  res.status(200).json({
    success: true,
    count,
    data: events,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / limit),
      totalItems: count
    }
  });
});

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true
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

  // Increment views
  await prisma.event.update({
    where: { id: req.params.id },
    data: { views: { increment: 1 } }
  });

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Create event
// @route   POST /api/events
// @access  Private/Organizer
exports.createEvent = asyncHandler(async (req, res) => {
  const eventData = {
    ...req.body,
    organizerId: req.user.id
  };

  const event = await prisma.event.create({
    data: eventData,
    include: {
      organizer: {
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
    data: event
  });
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Organizer
exports.updateEvent = asyncHandler(async (req, res) => {
  let event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: { organizer: true }
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  // Make sure user is event owner
  if (event.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this event'
    });
  }

  event = await prisma.event.update({
    where: { id: req.params.id },
    data: req.body,
    include: {
      organizer: {
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
    data: event
  });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Organizer
exports.deleteEvent = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    select: { organizerId: true }
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  // Make sure user is event owner
  if (event.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this event'
    });
  }

  await prisma.event.delete({
    where: { id: req.params.id }
  });

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully'
  });
});

// @desc    Get organizer's events
// @route   GET /api/events/organizer/my-events
// @access  Private/Organizer
exports.getMyEvents = asyncHandler(async (req, res) => {
  const events = await prisma.event.findMany({
    where: { organizerId: req.user.id },
    include: {
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({
    success: true,
    count: events.length,
    data: events
  });
});
