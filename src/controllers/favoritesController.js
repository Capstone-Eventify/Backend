const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get user's favorite events
// @route   GET /api/favorites
// @access  Private
exports.getFavorites = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      event: {
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
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Format events to match frontend expectations
  const formattedEvents = favorites.map(fav => {
    const event = fav.event;
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
      price: priceString,
      ticketTiers: ticketTiers,
      attendees: event._count.tickets || event.currentBookings,
      status: statusMap[event.status] || 'upcoming',
      fullDescription: event.fullDescription || event.description,
      isFavorite: true,
      favoritedAt: fav.createdAt.toISOString()
    };
  });

  res.status(200).json({
    success: true,
    count: formattedEvents.length,
    data: formattedEvents
  });
});

// @desc    Add event to favorites
// @route   POST /api/favorites
// @access  Private
exports.addFavorite = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: 'Event ID is required'
    });
  }

  // Check if event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  // Check if already favorited
  const existingFavorite = await prisma.favorite.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId
      }
    }
  });

  if (existingFavorite) {
    return res.status(400).json({
      success: false,
      message: 'Event is already in favorites'
    });
  }

  // Create favorite
  const favorite = await prisma.favorite.create({
    data: {
      userId,
      eventId
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          image: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Event added to favorites',
    data: {
      id: favorite.id,
      eventId: favorite.eventId,
      userId: favorite.userId,
      createdAt: favorite.createdAt.toISOString()
    }
  });
});

// @desc    Remove event from favorites
// @route   DELETE /api/favorites/:eventId
// @access  Private
exports.removeFavorite = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { eventId } = req.params;

  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId
      }
    }
  });

  if (!favorite) {
    return res.status(404).json({
      success: false,
      message: 'Favorite not found'
    });
  }

  await prisma.favorite.delete({
    where: {
      userId_eventId: {
        userId,
        eventId
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Event removed from favorites'
  });
});

// @desc    Check if event is favorited
// @route   GET /api/favorites/check/:eventId
// @access  Private
exports.checkFavorite = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { eventId } = req.params;

  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId
      }
    }
  });

  res.status(200).json({
    success: true,
    data: {
      isFavorite: !!favorite,
      favoritedAt: favorite ? favorite.createdAt.toISOString() : null
    }
  });
});

// @desc    Get favorite event IDs for user
// @route   GET /api/favorites/ids
// @access  Private
exports.getFavoriteIds = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: {
      eventId: true
    }
  });

  const eventIds = favorites.map(fav => fav.eventId);

  res.status(200).json({
    success: true,
    count: eventIds.length,
    data: eventIds
  });
});

