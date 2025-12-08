const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { hashPassword, comparePassword } = require('../utils/auth');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      avatar: true,
      bio: true,
      phone: true,
      street: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    bio: req.body.bio,
    phone: req.body.phone,
    street: req.body.street,
    city: req.body.city,
    state: req.body.state,
    zipCode: req.body.zipCode,
    country: req.body.country,
    avatar: req.body.avatar
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: fieldsToUpdate,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      avatar: true,
      bio: true,
      phone: true,
      street: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  // Verify current password
  const isMatch = await comparePassword(currentPassword, user.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword }
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Get user's tickets
// @route   GET /api/users/tickets
// @access  Private
exports.getUserTickets = asyncHandler(async (req, res) => {
  const tickets = await prisma.ticket.findMany({
    where: { attendeeId: req.user.id },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          image: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          venueName: true,
          city: true,
          state: true,
          country: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Get user's events (for organizers)
// @route   GET /api/users/events
// @access  Private/Organizer
exports.getUserEvents = asyncHandler(async (req, res) => {
  if (req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Only organizers can access this route'
    });
  }

  const events = await prisma.event.findMany({
    where: { organizerId: req.user.id },
    include: {
      tickets: {
        select: {
          id: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({
    success: true,
    count: events.length,
    data: events
  });
});

