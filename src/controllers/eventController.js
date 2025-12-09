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
  
  // Handle status filtering based on user role
  if (status) {
    const statusUpper = status.toUpperCase();
    // If status is explicitly requested, apply it
    where.status = statusUpper;
    
    // But restrict DRAFT access
    if (statusUpper === 'DRAFT') {
      // Only organizers can explicitly request DRAFT events (their own)
      if (!req.user || req.user.role !== 'ORGANIZER') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view draft events'
        });
      }
      // Organizers can only see their own DRAFT events
      where.organizerId = req.user.id;
    }
  } else {
    // Default filtering based on user role
    if (!req.user || req.user.role === 'ATTENDEE') {
      // Attendee/Public: Only LIVE events
      where.status = 'LIVE';
    } else if (req.user.role === 'ORGANIZER') {
      // Organizer: LIVE events OR their own events (any status including DRAFT)
      where.OR = [
        { status: 'LIVE' },
        { organizerId: req.user.id } // Their own events regardless of status
      ];
    } else if (req.user.role === 'ADMIN') {
      // Admin: Only LIVE events
      where.status = 'LIVE';
    } else {
      // Fallback: Only LIVE events
      where.status = 'LIVE';
    }
  }
  
  if (category) {
    where.category = category;
  }

  if (search) {
    const searchConditions = {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    };
    
    // If where.OR already exists (for draft filtering), combine with AND
    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        searchConditions
      ];
      delete where.OR;
    } else {
      Object.assign(where, searchConditions);
    }
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
          email: true,
          avatar: true
        }
      },
      ticketTiers: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
        take: 1 // Get lowest price tier for price display
      },
      _count: {
        select: {
          tickets: {
            where: { status: 'CONFIRMED' }
          }
        }
      }
    },
    orderBy: { [sort]: 'desc' },
    take: parseInt(limit),
    skip: (parseInt(page) - 1) * parseInt(limit)
  });

  // Format events to match frontend expectations
  const formattedEvents = events.map(event => {
    const lowestPrice = event.ticketTiers.length > 0
      ? event.ticketTiers[0].price
      : event.price;
    
    const priceString = lowestPrice > 0 ? `$${lowestPrice.toFixed(2)}` : 'FREE';
    
    const statusMap = {
      'DRAFT': 'upcoming',
      'PUBLISHED': 'upcoming',
      'LIVE': 'live',
      'ENDED': 'ended',
      'CANCELLED': 'cancelled'
    };

    // Format images array - ensure it's an array
    const imagesArray = Array.isArray(event.images) 
      ? event.images 
      : (event.images ? [event.images] : []);
    
    // Format images for ImageGallery component
    const formattedImages = imagesArray.length > 0
      ? imagesArray.map((img, idx) => ({
          id: `img_${idx + 1}`,
          url: img,
          isPrimary: idx === 0
        }))
      : [];

    return {
      ...event,
      organizer: {
        id: event.organizer.id,
        name: `${event.organizer.firstName} ${event.organizer.lastName}`,
        email: event.organizer.email,
        avatar: event.organizer.avatar
      },
      date: event.startDate.toISOString().split('T')[0],
      time: event.startTime,
      endDate: event.endDate ? event.endDate.toISOString().split('T')[0] : undefined,
      endTime: event.endTime,
      location: event.isOnline 
        ? 'Online Event' 
        : (event.venueName || event.address || `${event.city || ''}, ${event.state || ''}`.trim() || 'TBA'),
      image: event.image || (imagesArray.length > 0 ? imagesArray[0] : ''),
      images: formattedImages,
      price: priceString,
      attendees: event._count.tickets || event.currentBookings,
      status: statusMap[event.status] || 'upcoming'
    };
  });

  res.status(200).json({
    success: true,
    count,
    data: formattedEvents,
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
          avatar: true,
          bio: true
        }
      },
      ticketTiers: {
        where: { isActive: true },
        orderBy: { price: 'asc' }
      },
      tickets: {
        select: {
          id: true,
          status: true
        }
      },
      _count: {
        select: {
          tickets: {
            where: { status: 'CONFIRMED' }
          }
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

  // Check event visibility based on user role
  if (event.status === 'DRAFT') {
    // Only organizers can see their own DRAFT events
    if (!req.user || req.user.role !== 'ORGANIZER' || req.user.id !== event.organizerId) {
      return res.status(403).json({
        success: false,
        message: 'This event is not available for viewing'
      });
    }
  } else if (event.status !== 'LIVE') {
    // For non-LIVE, non-DRAFT events (PUBLISHED, ENDED, CANCELLED)
    if (!req.user) {
      // Public users can only see LIVE events
      return res.status(403).json({
        success: false,
        message: 'This event is not available for viewing'
      });
    }
    
    if (req.user.role === 'ATTENDEE') {
      // Attendees can only see LIVE events
      return res.status(403).json({
        success: false,
        message: 'This event is not available for viewing'
      });
    }
    
    if (req.user.role === 'ADMIN') {
      // Admins can only see LIVE events
      return res.status(403).json({
        success: false,
        message: 'This event is not available for viewing'
      });
    }
    
    // Organizers can see their own events regardless of status
    if (req.user.role === 'ORGANIZER' && req.user.id !== event.organizerId) {
      // Organizers can only see LIVE events from other organizers
      return res.status(403).json({
        success: false,
        message: 'This event is not available for viewing'
      });
    }
  }

  // Increment views
  await prisma.event.update({
    where: { id: req.params.id },
    data: { views: { increment: 1 } }
  });

  // Format ticket tiers - ensure it's an array
  const ticketTiers = event.ticketTiers && Array.isArray(event.ticketTiers) && event.ticketTiers.length > 0
    ? event.ticketTiers.map(tier => ({
        id: tier.id,
        name: tier.name,
        price: tier.price,
        description: tier.description || '',
        quantity: tier.quantity || 0,
        available: tier.available !== undefined ? tier.available : tier.quantity || 0
      }))
    : [];

  // Determine price string (from lowest tier or event price)
  const priceString = ticketTiers.length > 0 
    ? (Math.min(...ticketTiers.map(t => t.price)) > 0 
        ? `$${Math.min(...ticketTiers.map(t => t.price)).toFixed(2)}`
        : 'FREE')
    : (event.price > 0 ? `$${event.price.toFixed(2)}` : 'FREE');

  // Format status to match frontend
  const statusMap = {
    'DRAFT': 'upcoming',
    'PUBLISHED': 'upcoming',
    'LIVE': 'live',
    'ENDED': 'ended',
    'CANCELLED': 'cancelled'
  };

  // Format images array - ensure it's an array
  const imagesArray = Array.isArray(event.images) 
    ? event.images 
    : (event.images ? [event.images] : []);
  
  // Format images for ImageGallery component
  const formattedImages = imagesArray.length > 0
    ? imagesArray.map((img, idx) => ({
        id: `img_${idx + 1}`,
        url: img,
        isPrimary: idx === 0
      }))
    : [];

  // Format response to match frontend EventDetail structure
  const formattedEvent = {
    id: event.id,
    title: event.title,
    description: event.description,
    fullDescription: event.fullDescription || event.description,
    date: event.startDate.toISOString().split('T')[0],
    time: event.startTime,
    endDate: event.endDate ? event.endDate.toISOString().split('T')[0] : undefined,
    endTime: event.endTime,
    location: event.isOnline 
      ? 'Online Event' 
      : (event.venueName || event.address || `${event.city || ''}, ${event.state || ''}`.trim() || 'TBA'),
    address: event.address,
    city: event.city,
    state: event.state,
    zipCode: event.zipCode,
    country: event.country,
    isOnline: event.isOnline,
    meetingLink: event.meetingLink,
    category: event.category,
    image: event.image || (imagesArray.length > 0 ? imagesArray[0] : ''),
    images: formattedImages,
    price: priceString,
    ticketTiers: ticketTiers,
    maxAttendees: event.maxAttendees,
    attendees: event._count.tickets || event.currentBookings,
    status: statusMap[event.status] || 'upcoming',
    tags: event.tags,
    requirements: event.requirements,
    refundPolicy: event.refundPolicy,
    hasSeating: event.hasSeating || false,
    organizer: {
      id: event.organizer.id,
      name: `${event.organizer.firstName} ${event.organizer.lastName}`,
      email: event.organizer.email,
      avatar: event.organizer.avatar,
      bio: event.organizer.bio
    },
    createdAt: event.createdAt.toISOString()
  };

  res.status(200).json({
    success: true,
    data: formattedEvent
  });
});

// @desc    Create event
// @route   POST /api/events
// @access  Private/Organizer
exports.createEvent = asyncHandler(async (req, res) => {
  const { ticketTiers, date, time, endDate, endTime, ...eventFields } = req.body;
  
  // Convert date/time strings to DateTime objects
  const startDate = date ? new Date(date + 'T' + (time || '00:00')) : new Date(req.body.startDate);
  const endDateTime = endDate ? new Date(endDate + 'T' + (endTime || '23:59')) : new Date(req.body.endDate);

  // Remove fields that don't exist in the schema
  const { imageDisplayType, seatingArrangement, ...validFields } = eventFields;
  
  const eventData = {
    ...validFields,
    organizerId: req.user.id,
    startDate: startDate,
    endDate: endDateTime,
    startTime: time || req.body.startTime || '00:00',
    endTime: endTime || req.body.endTime || '23:59',
    fullDescription: req.body.fullDescription || req.body.description
    // Note: imageDisplayType and seatingArrangement are not in the schema, so they're excluded
  };

  // Create event with ticket tiers
  const event = await prisma.$transaction(async (tx) => {
    const createdEvent = await tx.event.create({
      data: {
        ...eventData,
        ticketTiers: ticketTiers && ticketTiers.length > 0 ? {
          create: ticketTiers.map(tier => ({
            name: tier.name,
            price: tier.price,
            description: tier.description,
            quantity: tier.quantity || tier.available || 100,
            available: tier.available || tier.quantity || 100,
            isActive: true
          }))
        } : undefined
      },
    include: {
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
            email: true,
            avatar: true,
            bio: true
          }
        },
        ticketTiers: {
          where: { isActive: true }
      }
    }
  });

    return createdEvent;
  });

  // Format response
  const formattedEvent = {
    ...event,
    organizer: {
      id: event.organizer.id,
      name: `${event.organizer.firstName} ${event.organizer.lastName}`,
      email: event.organizer.email,
      avatar: event.organizer.avatar,
      bio: event.organizer.bio
    },
    date: event.startDate.toISOString().split('T')[0],
    time: event.startTime,
    endDate: event.endDate ? event.endDate.toISOString().split('T')[0] : undefined,
    endTime: event.endTime,
    ticketTiers: event.ticketTiers.map(tier => ({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      description: tier.description,
      quantity: tier.quantity,
      available: tier.available
    }))
  };

  res.status(201).json({
    success: true,
    data: formattedEvent
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

  const { ticketTiers, date, time, endDate, endTime, ...eventFields } = req.body;
  
  // Prepare update data
  const updateData = { ...eventFields };
  
  // Convert date/time strings to DateTime if provided
  if (date && time) {
    updateData.startDate = new Date(date + 'T' + time);
  }
  if (endDate && endTime) {
    updateData.endDate = new Date(endDate + 'T' + endTime);
  }
  if (time) {
    updateData.startTime = time;
  }
  if (endTime) {
    updateData.endTime = endTime;
  }
  if (req.body.fullDescription !== undefined) {
    updateData.fullDescription = req.body.fullDescription;
  }

  event = await prisma.$transaction(async (tx) => {
    // Update event
    const updatedEvent = await tx.event.update({
    where: { id: req.params.id },
      data: updateData,
    include: {
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
            email: true,
            avatar: true,
            bio: true
        }
        },
        ticketTiers: {
          where: { isActive: true },
          orderBy: { price: 'asc' }
        }
      }
    });

    // Update ticket tiers if provided
    if (ticketTiers && Array.isArray(ticketTiers)) {
      // Delete existing tiers (soft delete)
      await tx.ticketTier.updateMany({
        where: { eventId: req.params.id },
        data: { isActive: false }
      });

      // Create new tiers
      if (ticketTiers.length > 0) {
        await tx.ticketTier.createMany({
          data: ticketTiers.map(tier => ({
            eventId: req.params.id,
            name: tier.name,
            price: tier.price,
            description: tier.description,
            quantity: tier.quantity || tier.available || 100,
            available: tier.available || tier.quantity || 100,
            isActive: true
          }))
        });
      }

      // Reload with new tiers
      return await tx.event.findUnique({
        where: { id: req.params.id },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              bio: true
            }
          },
          ticketTiers: {
            where: { isActive: true },
            orderBy: { price: 'asc' }
          }
        }
      });
    }

    return updatedEvent;
  });

  // Format response
  const formattedEvent = {
    ...event,
    organizer: {
      id: event.organizer.id,
      name: `${event.organizer.firstName} ${event.organizer.lastName}`,
      email: event.organizer.email,
      avatar: event.organizer.avatar,
      bio: event.organizer.bio
    },
    date: event.startDate.toISOString().split('T')[0],
    time: event.startTime,
    endDate: event.endDate ? event.endDate.toISOString().split('T')[0] : undefined,
    endTime: event.endTime,
    ticketTiers: event.ticketTiers.map(tier => ({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      description: tier.description,
      quantity: tier.quantity,
      available: tier.available
    }))
  };

  res.status(200).json({
    success: true,
    data: formattedEvent
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
  // Build where clause - organizers see their own events, admins see all
  const whereClause = req.user.role === 'ADMIN' 
    ? {} // Admins see all events
    : { organizerId: req.user.id }; // Organizers see only their events

  console.log('getMyEvents - User ID:', req.user.id, 'Role:', req.user.role);
  console.log('getMyEvents - Where clause:', JSON.stringify(whereClause));

  const events = await prisma.event.findMany({
    where: whereClause,
    include: {
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          bio: true
        }
      },
      ticketTiers: {
        where: { isActive: true },
        orderBy: { price: 'asc' }
      },
      _count: {
        select: {
          tickets: {
            where: { status: 'CONFIRMED' }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('getMyEvents - Found', events.length, 'events');
  if (events.length > 0) {
    console.log('getMyEvents - First event:', {
      id: events[0].id,
      title: events[0].title,
      organizerId: events[0].organizerId,
      organizer: events[0].organizer ? 'exists' : 'null',
      ticketTiersCount: events[0].ticketTiers?.length || 0
    });
  }

  // Format events to match frontend expectations
  const formattedEvents = events.map(event => {
    const ticketTiers = (event.ticketTiers || []).map(tier => ({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      description: tier.description,
      quantity: tier.quantity,
      available: tier.available
    }));

    const lowestPrice = ticketTiers.length > 0
      ? Math.min(...ticketTiers.map(t => t.price))
      : event.price;
    
    const priceString = lowestPrice > 0 ? `$${lowestPrice.toFixed(2)}` : 'FREE';
    
    const statusMap = {
      'DRAFT': 'upcoming',
      'PUBLISHED': 'upcoming',
      'LIVE': 'live',
      'ENDED': 'ended',
      'CANCELLED': 'cancelled'
    };

    // Format images array - ensure it's an array
    const imagesArray = Array.isArray(event.images) 
      ? event.images 
      : (event.images ? [event.images] : []);
    
    // Format images for ImageGallery component
    const formattedImages = imagesArray.length > 0
      ? imagesArray.map((img, idx) => ({
          id: `img_${idx + 1}`,
          url: img,
          isPrimary: idx === 0
        }))
      : [];

    return {
      ...event,
      organizer: {
        id: event.organizer.id,
        name: `${event.organizer.firstName} ${event.organizer.lastName}`,
        email: event.organizer.email,
        avatar: event.organizer.avatar,
        bio: event.organizer.bio
      },
      date: event.startDate.toISOString().split('T')[0],
      time: event.startTime,
      endDate: event.endDate ? event.endDate.toISOString().split('T')[0] : undefined,
      endTime: event.endTime,
      location: event.isOnline 
        ? 'Online Event' 
        : (event.venueName || event.address || `${event.city || ''}, ${event.state || ''}`.trim() || 'TBA'),
      image: event.image || (imagesArray.length > 0 ? imagesArray[0] : ''),
      images: formattedImages,
      price: priceString,
      ticketTiers: ticketTiers,
      attendees: event._count?.tickets || event.currentBookings || 0,
      status: statusMap[event.status] || 'upcoming',
      fullDescription: event.fullDescription || event.description
    };
  });

  console.log('getMyEvents - Formatted', formattedEvents.length, 'events, sending response');

  res.status(200).json({
    success: true,
    count: formattedEvents.length,
    data: formattedEvents
  });
});

// @desc    Get events by organizer ID
// @route   GET /api/events/organizer/:organizerId
// @access  Public
exports.getEventsByOrganizer = asyncHandler(async (req, res) => {
  const { organizerId } = req.params;

  // Build where clause
  const where = { organizerId };
  
  // Filter by status based on viewer's role
  if (req.user && req.user.id === organizerId && req.user.role === 'ORGANIZER') {
    // Organizer viewing their own events: show all (including DRAFT)
    // Don't filter by status
  } else if (req.user && req.user.role === 'ADMIN') {
    // Admin viewing organizer's events: only LIVE
    where.status = 'LIVE';
  } else {
    // Public/Attendee viewing organizer's events: only LIVE
    where.status = 'LIVE';
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          bio: true
        }
      },
      ticketTiers: {
        where: { isActive: true },
        orderBy: { price: 'asc' }
      },
      _count: {
        select: {
          tickets: {
            where: { status: 'CONFIRMED' }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Format events to match frontend expectations
  const formattedEvents = events.map(event => {
    const ticketTiers = event.ticketTiers.map(tier => ({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      description: tier.description,
      quantity: tier.quantity,
      available: tier.available
    }));

    const lowestPrice = ticketTiers.length > 0
      ? Math.min(...ticketTiers.map(t => t.price))
      : event.price;
    
    const priceString = lowestPrice > 0 ? `$${lowestPrice.toFixed(2)}` : 'FREE';
    
    const statusMap = {
      'DRAFT': 'upcoming',
      'PUBLISHED': 'upcoming',
      'LIVE': 'live',
      'ENDED': 'ended',
      'CANCELLED': 'cancelled'
    };

    // Format images array - ensure it's an array
    const imagesArray = Array.isArray(event.images) 
      ? event.images 
      : (event.images ? [event.images] : []);
    
    // Format images for ImageGallery component
    const formattedImages = imagesArray.length > 0
      ? imagesArray.map((img, idx) => ({
          id: `img_${idx + 1}`,
          url: img,
          isPrimary: idx === 0
        }))
      : [];

    return {
      ...event,
      organizer: {
        id: event.organizer.id,
        name: `${event.organizer.firstName} ${event.organizer.lastName}`,
        email: event.organizer.email,
        avatar: event.organizer.avatar,
        bio: event.organizer.bio
      },
      date: event.startDate.toISOString().split('T')[0],
      time: event.startTime,
      endDate: event.endDate ? event.endDate.toISOString().split('T')[0] : undefined,
      endTime: event.endTime,
      location: event.isOnline 
        ? 'Online Event' 
        : (event.venueName || event.address || `${event.city || ''}, ${event.state || ''}`.trim() || 'TBA'),
      image: event.image || (imagesArray.length > 0 ? imagesArray[0] : ''),
      images: formattedImages,
      price: priceString,
      ticketTiers: ticketTiers,
      attendees: event._count.tickets || event.currentBookings,
      status: statusMap[event.status] || 'upcoming',
      fullDescription: event.fullDescription || event.description
    };
  });

  res.status(200).json({
    success: true,
    count: formattedEvents.length,
    data: formattedEvents
  });
});
