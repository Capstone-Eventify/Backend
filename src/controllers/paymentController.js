const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
exports.createPaymentIntent = asyncHandler(async (req, res) => {
  const { eventId, ticketTierId, quantity = 1, promoCode, discount, amount } = req.body;
  const userId = req.user.id;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: 'Event ID is required'
    });
  }

  // Get event and ticket tier from database
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      ticketTiers: ticketTierId ? {
        where: { id: ticketTierId, isActive: true }
      } : undefined
    }
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  // Get ticket tier if specified
  let ticketTier = null;
  if (ticketTierId) {
    ticketTier = event.ticketTiers && event.ticketTiers.length > 0 
      ? event.ticketTiers[0] 
      : null;
    if (!ticketTier) {
      return res.status(404).json({
        success: false,
        message: 'Ticket tier not found or inactive'
      });
    }
    // Check if tier has enough available tickets
    if (ticketTier.available < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${ticketTier.available} tickets available for ${ticketTier.name} tier`
      });
    }
  }

  // Check if event has capacity
  if (event.currentBookings + quantity > event.maxAttendees) {
    return res.status(400).json({
      success: false,
      message: `Only ${event.maxAttendees - event.currentBookings} tickets available`
    });
  }

  // Calculate amount - use provided amount, ticket tier price, or event price
  let finalAmount;
  if (amount) {
    finalAmount = Math.round(parseFloat(amount) * 100);
  } else if (ticketTier) {
    finalAmount = Math.round(ticketTier.price * 100 * quantity);
  } else {
    finalAmount = Math.round(event.price * 100 * quantity);
  }

  // Apply discount if promo code is valid
  if (promoCode && discount) {
    finalAmount = Math.round(finalAmount * (1 - discount / 100));
  }

  // Create payment intent with Stripe
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: event.currency?.toLowerCase() || 'usd',
      metadata: {
        userId: userId,
        eventId: eventId,
        ticketTierId: ticketTierId || 'general',
        quantity: quantity.toString(),
        promoCode: promoCode || '',
        discount: discount?.toString() || '0'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      }
    });
  } catch (error) {
    console.error('Stripe Payment Intent Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
exports.confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, eventId, ticketTierId, quantity = 1, attendees = [], promoCode, discount } = req.body;
  const userId = req.user.id;

  if (!paymentIntentId || !eventId) {
    return res.status(400).json({
      success: false,
      message: 'Payment intent ID and event ID are required'
    });
  }

  // Verify payment intent with Stripe
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment intent',
      error: error.message
    });
  }

  if (paymentIntent.status !== 'succeeded') {
    return res.status(400).json({
      success: false,
      message: `Payment not completed. Status: ${paymentIntent.status}`,
      status: paymentIntent.status
    });
  }

  // Get event, user, and ticket tier from database
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      ticketTiers: {
        where: ticketTierId ? { id: ticketTierId, isActive: true } : { isActive: true }
      }
    }
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get ticket tier if specified
  let ticketTier = null;
  if (ticketTierId) {
    ticketTier = event.ticketTiers.find(t => t.id === ticketTierId);
    if (!ticketTier) {
      return res.status(404).json({
        success: false,
        message: 'Ticket tier not found'
      });
    }
    // Check if tier has enough available tickets
    if (ticketTier.available < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${ticketTier.available} tickets available for ${ticketTier.name} tier`
      });
    }
  }

  // Check if event has capacity
  if (event.currentBookings + quantity > event.maxAttendees) {
    return res.status(400).json({
      success: false,
      message: `Only ${event.maxAttendees - event.currentBookings} tickets available`
    });
  }

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create tickets and payment in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Calculate price per ticket
    const pricePerTicket = ticketTier 
      ? ticketTier.price 
      : paymentIntent.amount / 100 / quantity;

  // Create tickets
  const tickets = [];
  for (let i = 0; i < quantity; i++) {
      const attendeeInfo = attendees[i] || {};
    
      // Create ticket first (without QR code)
      const ticket = await tx.ticket.create({
      data: {
          eventId: eventId,
        attendeeId: userId,
          ticketTierId: ticketTierId || null,
          ticketType: ticketTier ? ticketTier.name : 'General',
          price: pricePerTicket,
          currency: paymentIntent.currency.toUpperCase(),
        status: 'CONFIRMED',
          orderNumber: orderNumber,
        metadata: {
            attendeeName: attendeeInfo.name || `${user.firstName} ${user.lastName}`,
            attendeeEmail: attendeeInfo.email || user.email,
            ticketTierId: ticketTierId || null,
          promoCode: promoCode || null,
          discount: discount || 0
        }
      }
    });
    
    // Update ticket with QR code = ticket ID for direct lookup
    const updatedTicket = await tx.ticket.update({
      where: { id: ticket.id },
      data: { qrCode: ticket.id }
    });
    
    tickets.push(updatedTicket);
  }

    // Update ticket tier availability if tier was used
    if (ticketTier) {
      await tx.ticketTier.update({
        where: { id: ticketTierId },
        data: {
          available: {
            decrement: quantity
          }
        }
      });
    }

  // Create payment record
    const payment = await tx.payment.create({
    data: {
        userId: userId,
        eventId: eventId,
        ticketId: tickets[0].id, // Link to first ticket
      amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
      stripePaymentId: paymentIntent.id,
      paymentMethod: 'card',
      status: 'COMPLETED',
      transactionId: paymentIntent.id,
      metadata: {
          orderNumber: orderNumber,
          quantity: quantity,
        promoCode: promoCode || null,
          discount: discount || 0,
          ticketIds: tickets.map(t => t.id)
      }
    }
  });

  // Update event bookings
    await tx.event.update({
    where: { id: eventId },
    data: {
      currentBookings: {
        increment: quantity
      }
    }
  });

    return { tickets, payment };
  });

  res.status(200).json({
    success: true,
    message: 'Payment confirmed successfully',
    data: {
      orderNumber,
      tickets: result.tickets,
      payment: result.payment,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      }
    }
  });
});

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private
exports.processRefund = asyncHandler(async (req, res) => {
  const { paymentId, ticketId, reason } = req.body;
  const userId = req.user.id;

  console.log('Refund request:', { paymentId, ticketId, reason, userId });

  // Support both paymentId (legacy) and ticketId (new approach)
  let payment;

  if (ticketId) {
    // Find payment by ticket ID
    payment = await prisma.payment.findFirst({
      where: {
        ticketId: ticketId,
        userId: userId
      },
      include: {
        ticket: {
          include: {
            event: true
          }
        }
      }
    });
  } else if (paymentId) {
    // Find payment by payment ID or Stripe payment ID
    payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { id: paymentId, userId: userId },
          { stripePaymentId: paymentId, userId: userId }
        ]
      },
      include: {
        ticket: {
          include: {
            event: true
          }
        }
      }
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Either ticketId or paymentId is required'
    });
  }

  if (!payment) {
    console.log('Payment not found for:', { ticketId, paymentId, userId });
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  console.log('Found payment:', { paymentId: payment.id, ticketId: payment.ticketId, status: payment.status });

  if (payment.status === 'REFUNDED') {
    return res.status(400).json({
      success: false,
      message: 'Payment already refunded'
    });
  }

  // Check if ticket is eligible for refund
  if (payment.ticket.status === 'REFUNDED') {
    return res.status(400).json({
      success: false,
      message: 'Ticket already refunded'
    });
  }

  // Process Stripe refund if there's a Stripe payment ID
  let refund = null;
  if (payment.stripePaymentId) {
    try {
      // Map custom reasons to Stripe-accepted reasons
      const mapReasonToStripe = (customReason) => {
        if (!customReason) return 'requested_by_customer';
        
        const lowerReason = customReason.toLowerCase();
        
        // Check for fraudulent indicators
        if (lowerReason.includes('fraud') || lowerReason.includes('unauthorized')) {
          return 'fraudulent';
        }
        
        // Check for duplicate indicators
        if (lowerReason.includes('duplicate') || lowerReason.includes('double')) {
          return 'duplicate';
        }
        
        // Default to customer request for all other reasons
        return 'requested_by_customer';
      };

      const stripeReason = mapReasonToStripe(reason);
      
      console.log('Refund reason mapping:', { originalReason: reason, stripeReason });
      
      refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentId,
        reason: stripeReason,
        metadata: {
          userId: userId,
          ticketId: payment.ticketId,
          originalReason: reason || 'Customer request',
          mappedReason: stripeReason
        }
      });
    } catch (stripeError) {
      console.error('Stripe Refund Error:', stripeError);
      return res.status(500).json({
        success: false,
        message: 'Failed to process Stripe refund',
        error: stripeError.message
      });
    }
  }

  // Update payment and tickets in transaction
  try {
    await prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          metadata: {
            ...payment.metadata,
            refundId: refund?.id || 'manual_refund',
            refundedAt: new Date().toISOString(),
            refundReason: reason || 'requested_by_customer',
            stripeReason: refund ? 'mapped_to_stripe' : 'manual_refund'
          }
        }
      });

      // Update ticket status
      await tx.ticket.update({
        where: { id: payment.ticketId },
        data: {
          status: 'REFUNDED'
        }
      });

      // Decrease event bookings
      await tx.event.update({
        where: { id: payment.eventId },
        data: {
          currentBookings: {
            decrement: 1
          }
        }
      });
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund?.id || 'manual_refund',
        amount: refund ? refund.amount / 100 : payment.amount,
        currency: refund?.currency || payment.currency,
        status: refund?.status || 'processed'
      }
    });
  } catch (error) {
    console.error('Database Refund Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update refund status',
      error: error.message
    });
  }
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const payments = await prisma.payment.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          image: true,
          startDate: true
        }
      },
      ticket: {
        select: {
          id: true,
          orderNumber: true,
          ticketType: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments
  });
});
