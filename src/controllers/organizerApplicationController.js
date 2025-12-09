const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create organizer application
// @route   POST /api/organizer-applications
// @access  Private
exports.createApplication = asyncHandler(async (req, res) => {
  const { organizationName, website, description, reason, experience } = req.body;
  const userId = req.user.id;

  // Check if user already has an application
  const existingApplication = await prisma.organizerApplication.findUnique({
    where: { userId }
  });

  if (existingApplication) {
    return res.status(400).json({
      success: false,
      message: 'You already have an organizer application'
    });
  }

  // Check if user is already an organizer
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (user.role === 'ORGANIZER' || user.role === 'ADMIN') {
    return res.status(400).json({
      success: false,
      message: 'You are already an organizer'
    });
  }

  const application = await prisma.organizerApplication.create({
    data: {
      userId,
      organizationName,
      website,
      description,
      reason,
      experience,
      status: 'pending'
    },
    include: {
      user: {
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
    message: 'Organizer application submitted successfully',
    data: application
  });
});

// @desc    Get user's organizer application
// @route   GET /api/organizer-applications/my-application
// @access  Private
exports.getMyApplication = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const application = await prisma.organizerApplication.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'No organizer application found'
    });
  }

  res.status(200).json({
    success: true,
    data: application
  });
});

// @desc    Get all organizer applications (Admin only)
// @route   GET /api/organizer-applications
// @access  Private/Admin
exports.getAllApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const where = {};
  if (status && status !== 'all') {
    where.status = status.toLowerCase();
  }

  const applications = await prisma.organizerApplication.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Format response
  const formattedApplications = applications.map(app => ({
    id: app.id,
    userId: app.userId,
    userEmail: app.user.email,
    userName: `${app.user.firstName} ${app.user.lastName}`,
    organizationName: app.organizationName,
    website: app.website,
    description: app.description,
    reason: app.reason,
    experience: app.experience,
    status: app.status,
    submittedAt: app.createdAt.toISOString(),
    reviewedAt: app.reviewedAt?.toISOString(),
    notes: app.notes
  }));

  res.status(200).json({
    success: true,
    count: formattedApplications.length,
    data: formattedApplications
  });
});

// @desc    Approve organizer application (Admin only)
// @route   PUT /api/organizer-applications/:id/approve
// @access  Private/Admin
exports.approveApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const adminId = req.user.id;

  const application = await prisma.organizerApplication.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          role: true
        }
      }
    }
  });

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  if (application.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: `Application is already ${application.status}`
    });
  }

  // Update application status and user role in a transaction
  await prisma.$transaction(async (tx) => {
    // Update application
    await tx.organizerApplication.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        notes
      }
    });

    // Update user role to ORGANIZER
    await tx.user.update({
      where: { id: application.userId },
      data: { role: 'ORGANIZER' }
    });
  });

  res.status(200).json({
    success: true,
    message: 'Organizer application approved and user role updated'
  });
});

// @desc    Reject organizer application (Admin only)
// @route   PUT /api/organizer-applications/:id/reject
// @access  Private/Admin
exports.rejectApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const adminId = req.user.id;

  const application = await prisma.organizerApplication.findUnique({
    where: { id }
  });

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  if (application.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: `Application is already ${application.status}`
    });
  }

  await prisma.organizerApplication.update({
    where: { id },
    data: {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      notes
    }
  });

  res.status(200).json({
    success: true,
    message: 'Organizer application rejected'
  });
});

