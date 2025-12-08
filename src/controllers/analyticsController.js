const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get event analytics
// @route   GET /api/analytics/event/:eventId
// @access  Private/Organizer
exports.getEventAnalytics = asyncHandler(async (req, res) => {
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
      message: 'Not authorized'
    });
  }

  // Get all tickets for this event
  const tickets = await prisma.ticket.findMany({
    where: { eventId },
    include: {
      attendee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      payment: true
    }
  });

  // Calculate statistics
  const totalTickets = tickets.length;
  const confirmedTickets = tickets.filter(t => t.status === 'CONFIRMED');
  const checkedInTickets = confirmedTickets.filter(t => t.checkedIn);
  const refundedTickets = tickets.filter(t => t.status === 'REFUNDED');

  // Revenue calculation
  const totalRevenue = confirmedTickets.reduce((sum, ticket) => {
    return sum + (ticket.payment?.amount || ticket.price || 0);
  }, 0);

  // Group by ticket type
  const ticketTypeStats = tickets.reduce((acc, ticket) => {
    const type = ticket.ticketType || 'General';
    if (!acc[type]) {
      acc[type] = { count: 0, revenue: 0, checkedIn: 0 };
    }
    acc[type].count++;
    if (ticket.status === 'CONFIRMED') {
      acc[type].revenue += ticket.payment?.amount || ticket.price || 0;
    }
    if (ticket.checkedIn) {
      acc[type].checkedIn++;
    }
    return acc;
  }, {});

  // Registration timeline (last 30 days)
  const registrationTimeline = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = tickets.filter(t => {
      const ticketDate = new Date(t.createdAt);
      return ticketDate >= date && ticketDate < nextDay;
    }).length;

    return {
      date: date.toISOString().split('T')[0],
      count
    };
  });

  // Check-in rate
  const checkInRate = confirmedTickets.length > 0
    ? (checkedInTickets.length / confirmedTickets.length) * 100
    : 0;

  // Average ticket price
  const averageTicketPrice = confirmedTickets.length > 0
    ? totalRevenue / confirmedTickets.length
    : 0;

  res.status(200).json({
    success: true,
    data: {
      totalTickets,
      confirmedTickets: confirmedTickets.length,
      checkedInTickets: checkedInTickets.length,
      refundedTickets: refundedTickets.length,
      totalRevenue,
      checkInRate: Math.round(checkInRate * 100) / 100,
      averageTicketPrice: Math.round(averageTicketPrice * 100) / 100,
      ticketTypeStats,
      registrationTimeline
    }
  });
});

// @desc    Get organizer dashboard analytics
// @route   GET /api/analytics/organizer
// @access  Private/Organizer
exports.getOrganizerAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get all events organized by user
  const events = await prisma.event.findMany({
    where: { organizerId: userId },
    include: {
      tickets: {
        include: {
          payment: true
        }
      }
    }
  });

  // Calculate overall statistics
  const totalEvents = events.length;
  const activeEvents = events.filter(e => 
    e.status === 'PUBLISHED' || e.status === 'LIVE'
  ).length;

  const allTickets = events.flatMap(e => e.tickets);
  const confirmedTickets = allTickets.filter(t => t.status === 'CONFIRMED');
  const totalRevenue = confirmedTickets.reduce((sum, ticket) => {
    return sum + (ticket.payment?.amount || ticket.price || 0);
  }, 0);

  const totalAttendees = new Set(allTickets.map(t => t.attendeeId)).size;

  // Revenue by month (last 12 months)
  const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthTickets = confirmedTickets.filter(t => {
      const paymentDate = t.payment?.createdAt || t.createdAt;
      const ticketDate = new Date(paymentDate);
      return ticketDate >= date && ticketDate < nextMonth;
    });

    const monthRevenue = monthTickets.reduce((sum, ticket) => {
      return sum + (ticket.payment?.amount || ticket.price || 0);
    }, 0);

    return {
      month: date.toISOString().split('T')[0].substring(0, 7),
      revenue: monthRevenue
    };
  });

  // Top performing events
  const eventPerformance = events.map(event => {
    const eventTickets = event.tickets.filter(t => t.status === 'CONFIRMED');
    const eventRevenue = eventTickets.reduce((sum, ticket) => {
      return sum + (ticket.payment?.amount || ticket.price || 0);
    }, 0);

    return {
      eventId: event.id,
      title: event.title,
      ticketsSold: eventTickets.length,
      revenue: eventRevenue,
      attendees: new Set(eventTickets.map(t => t.attendeeId)).size
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  res.status(200).json({
    success: true,
    data: {
      totalEvents,
      activeEvents,
      totalRevenue,
      totalAttendees,
      revenueByMonth,
      topEvents: eventPerformance
    }
  });
});

