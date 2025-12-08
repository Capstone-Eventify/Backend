const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get social sharing links for event
// @route   GET /api/social/event/:eventId/share
// @access  Public
exports.getEventShareLinks = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      description: true,
      image: true,
      startDate: true,
      venueName: true,
      city: true
    }
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const eventUrl = `${baseUrl}/events/${eventId}`;
  const shareText = encodeURIComponent(`Check out ${event.title}! ${event.description?.substring(0, 100)}...`);
  const imageUrl = event.image || '';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(eventUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`,
    whatsapp: `https://wa.me/?text=${shareText}%20${encodeURIComponent(eventUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(event.title)}&body=${shareText}%20${encodeURIComponent(eventUrl)}`,
    copy: eventUrl
  };

  res.status(200).json({
    success: true,
    data: {
      eventUrl,
      shareLinks,
      event: {
        title: event.title,
        description: event.description,
        image: imageUrl,
        date: event.startDate,
        location: event.venueName || event.city
      }
    }
  });
});

// @desc    Track social share
// @route   POST /api/social/track
// @access  Public
exports.trackSocialShare = asyncHandler(async (req, res) => {
  const { eventId, platform, userId } = req.body;

  // In production, save to analytics database:
  // await prisma.socialShare.create({
  //   data: {
  //     eventId,
  //     platform,
  //     userId: userId || null,
  //     timestamp: new Date()
  //   }
  // });

  console.log(`[Social Share] Event: ${eventId}, Platform: ${platform}, User: ${userId || 'anonymous'}`);

  res.status(200).json({
    success: true,
    message: 'Share tracked'
  });
});

