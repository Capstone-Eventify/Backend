const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Technology', 'Business', 'Education', 'Health & Wellness',
      'Arts & Culture', 'Sports', 'Food & Drink', 'Travel',
      'Entertainment', 'Networking', 'Other'
    ]
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: [
      'Conference', 'Workshop', 'Seminar', 'Meetup', 'Webinar',
      'Training', 'Exhibition', 'Festival', 'Party', 'Other'
    ]
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  location: {
    venueName: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    meetingLink: String
  },
  pricing: {
    price: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    ticketTypes: [{
      name: String,
      price: Number,
      quantity: Number,
      available: Number
    }]
  },
  capacity: {
    maxAttendees: {
      type: Number,
      required: [true, 'Maximum attendees is required']
    },
    currentBookings: {
      type: Number,
      default: 0
    }
  },
  image: {
    type: String,
    default: ''
  },
  images: [String],
  tags: [String],
  requirements: String,
  refundPolicy: String,
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'live', 'ended', 'cancelled'],
    default: 'draft'
  },
  publishedAt: Date,
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ startDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model('Event', eventSchema);

