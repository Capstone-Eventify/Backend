const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
  getFavoriteIds
} = require('../controllers/favoritesController');

// All routes require authentication
router.get('/', protect, getFavorites);
router.get('/ids', protect, getFavoriteIds);
router.get('/check/:eventId', protect, checkFavorite);
router.post('/', protect, addFavorite);
router.delete('/:eventId', protect, removeFavorite);

module.exports = router;

