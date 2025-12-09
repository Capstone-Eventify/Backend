const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  changePassword,
  getUserTickets,
  getUserEvents,
  completeOnboarding,
  getUserById,
  updateUserRole
} = require('../controllers/userController');

// Public routes
router.get('/:id', getUserById);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.put('/onboarding/complete', protect, completeOnboarding);
router.get('/tickets', protect, getUserTickets);
router.get('/events', protect, getUserEvents);

// Admin routes
router.put('/:userId/role', protect, authorize('admin'), updateUserRole);

module.exports = router;

