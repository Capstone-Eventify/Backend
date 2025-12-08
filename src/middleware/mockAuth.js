// Mock authentication middleware for testing without database
// This bypasses real JWT verification and database lookups

exports.mockProtect = (req, res, next) => {
  // Extract token from header if present (optional in mock mode)
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Create mock user (always allow in mock mode)
  req.user = {
    id: `user_${Date.now()}`,
    email: 'test@eventify.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'ATTENDEE',
    isActive: true
  };

  // If token exists, try to extract user info from it (optional)
  if (token && token !== 'test_token') {
    // Could decode basic info from token if needed
    // For now, just use mock user
  }

  next();
};

