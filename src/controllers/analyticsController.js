const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get event analytics
// @route   GET /api/analytics/event/:eventId
// @access  Private/Organizer
exports.getEventAnalytics = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  // Verify user is event organizer and get event dates
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { 
      organizerId: true,
      createdAt: true,
      publishedAt: true,
      startDate: true
    }
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

  // Debug logging
  const eventStartDate = event.publishedAt || event.createdAt || event.startDate;
  console.log('Event Analytics Debug:', {
    eventId,
    eventStartDate: eventStartDate,
    eventCreatedAt: event.createdAt,
    eventPublishedAt: event.publishedAt,
    eventStartDateField: event.startDate,
    totalTickets: tickets.length,
    ticketDates: tickets.map(t => ({
      id: t.id,
      createdAt: t.createdAt,
      status: t.status,
      ticketType: t.ticketType,
      price: t.price,
      checkedIn: t.checkedIn,
      paymentAmount: t.payment?.amount
    })),
    dateRange: {
      start: eventStartDate,
      end: new Date().toISOString()
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
      const revenue = ticket.payment?.amount || ticket.price || 0;
      acc[type].revenue += revenue;
    }
    if (ticket.checkedIn) {
      acc[type].checkedIn++;
    }
    return acc;
  }, {});

  // Debug ticket type stats
  console.log('Ticket Type Stats Debug:', {
    ticketTypeStats,
    ticketsProcessed: tickets.length,
    ticketDetails: tickets.map(t => ({
      id: t.id,
      ticketType: t.ticketType,
      status: t.status,
      price: t.price,
      paymentAmount: t.payment?.amount,
      checkedIn: t.checkedIn
    }))
  });

  // Registration timeline - from first registration date to today
  // Find the first ticket creation date (first registration)
  const firstTicketDate = tickets.length > 0 
    ? tickets.reduce((earliest, ticket) => {
        if (!ticket.createdAt) return earliest
        const ticketDate = new Date(ticket.createdAt)
        return earliest && ticketDate < earliest ? ticketDate : (earliest || ticketDate)
      }, null)
    : null

  // Use first ticket date if available, otherwise use event start date
  const startDate = firstTicketDate 
    ? new Date(firstTicketDate)
    : new Date(eventStartDate)
    
  startDate.setHours(0, 0, 0, 0)
  startDate.setMinutes(0, 0, 0)
  startDate.setSeconds(0, 0)
  startDate.setMilliseconds(0)
  
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  
  // Calculate number of days from first registration to today
  const daysDiff = firstTicketDate 
    ? Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0
    
  const totalDays = Math.max(1, daysDiff + 1) // At least 1 day, add 1 to include today
  
  // Generate timeline from first registration date to today
  const registrationTimeline = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    date.setHours(0, 0, 0, 0)
    date.setMinutes(0, 0, 0)
    date.setSeconds(0, 0)
    date.setMilliseconds(0)
    
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    const count = tickets.filter(t => {
      if (!t.createdAt) return false
      const ticketDate = new Date(t.createdAt)
      ticketDate.setHours(0, 0, 0, 0)
      ticketDate.setMinutes(0, 0, 0)
      ticketDate.setSeconds(0, 0)
      ticketDate.setMilliseconds(0)
      return ticketDate.getTime() >= date.getTime() && ticketDate.getTime() < nextDay.getTime()
    }).length

    return {
      date: date.toISOString().split('T')[0],
      count
    }
  })
  
  console.log('Registration Timeline Debug:', {
    firstTicketDate: firstTicketDate?.toISOString(),
    eventStartDate: eventStartDate?.toISOString(),
    startDate: startDate.toISOString(),
    today: today.toISOString(),
    totalDays,
    timelineLength: registrationTimeline.length,
    ticketsWithDates: tickets.map(t => ({
      id: t.id,
      createdAt: t.createdAt
    }))
  })

  // Check-in rate
  const checkInRate = confirmedTickets.length > 0
    ? (checkedInTickets.length / confirmedTickets.length) * 100
    : 0;

  // Average ticket price
  const averageTicketPrice = confirmedTickets.length > 0
    ? totalRevenue / confirmedTickets.length
    : 0;

  const responseData = {
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
  };

  // Debug final response
  console.log('Analytics Response:', {
    totalTickets: responseData.data.totalTickets,
    confirmedTickets: responseData.data.confirmedTickets,
    ticketTypeStatsKeys: Object.keys(responseData.data.ticketTypeStats),
    registrationTimelineWithData: responseData.data.registrationTimeline.filter(d => d.count > 0),
    registrationTimelineTotal: responseData.data.registrationTimeline.reduce((sum, d) => sum + d.count, 0)
  });

  res.status(200).json(responseData);
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

