const prisma = require('../lib/prisma');
const { generateToken, hashPassword, comparePassword, generateResetToken, hashResetToken } = require('../utils/auth');
const { sendEmail } = require('../utils/email');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role?.toUpperCase() || 'ATTENDEE'
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    }
  });

  // Generate token
  const token = generateToken(user.id, user.role);

  // Format response to include name field
  const formattedUser = {
    ...user,
    name: `${user.firstName} ${user.lastName}`,
    hasCompletedOnboarding: user.hasCompletedOnboarding || false
  };

  res.status(201).json({
    success: true,
    data: {
      user: formattedUser,
      token,
      isNewUser: true // Flag to indicate this is a new registration
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Check for user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if password matches
  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate token
  const token = generateToken(user.id, user.role);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role.toLowerCase(),
        hasCompletedOnboarding: user.hasCompletedOnboarding || false
      },
      token,
      isNewUser: false // Existing user signing in
    }
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
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
      hasCompletedOnboarding: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // Format response to include name field and lowercase role
  const formattedUser = {
    ...user,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role.toLowerCase(),
    joinDate: user.createdAt.toISOString(),
    hasCompletedOnboarding: user.hasCompletedOnboarding || false
  };

  res.status(200).json({
    success: true,
    data: formattedUser
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res) => {
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
    country: req.body.country
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: fieldsToUpdate
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email address'
    });
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Don't reveal if user exists for security
    return res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent'
    });
  }

  // Generate reset token
  const { resetToken, hashedToken } = generateResetToken();
  const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save hashed token to database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpire
    }
  });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  // Check if email is configured
  const isEmailConfigured = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);

  // Send email (or log in development mode)
  try {
    if (isEmailConfigured) {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You requested a password reset for your Eventify account.</p>
            <p>Click the button below to reset your password (link expires in 10 minutes):</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${resetUrl}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
          </div>
        `
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } else {
      // Development mode: log the reset URL instead of sending email
      console.log('\n========================================');
      console.log('🔐 PASSWORD RESET LINK (DEV MODE)');
      console.log('========================================');
      console.log(`Email: ${user.email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('========================================\n');

      res.status(200).json({
        success: true,
        message: 'Password reset link generated',
        resetUrl: resetUrl, // Include in response for development
        devMode: true
      });
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    
    // Clear token if email fails
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: null,
        resetPasswordExpire: null
      }
    }).catch(err => {
      console.error('Error clearing reset token:', err);
    });

    return res.status(500).json({
      success: false,
      message: error.message || 'Email could not be sent. Please check your email configuration.'
    });
  }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }

  // Hash token to compare with database
  const hashedToken = hashResetToken(token);

  // Find user with valid token
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Hash new password
  const hashedPassword = await hashPassword(password);

  // Update user password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpire: null
    }
  });

  res.status(200).json({
    success: true,
    message: 'Password reset successful'
  });
});
