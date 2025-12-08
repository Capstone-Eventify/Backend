const express = require('express');
const router = express.Router();
const {
  getEventShareLinks,
  trackSocialShare
} = require('../controllers/socialController');

router.get('/event/:eventId/share', getEventShareLinks);
router.post('/track', trackSocialShare);

module.exports = router;

