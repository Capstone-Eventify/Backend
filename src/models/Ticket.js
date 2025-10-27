const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event is required']
  },
  attendee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Attendee is required']
  },
  ticketType: {
    type: String,
    required: [true, 'Ticket type is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  qrCode: {
    type: String,
    default: ''
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: Date,
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Generate unique order number
ticketSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    this.orderNumber = `TIX-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Indexes
ticketSchema.index({ event: 1, attendee: 1 });
ticketSchema.index({ orderNumber: 1 });
ticketSchema.index({ status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);

