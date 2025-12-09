const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../utils/upload');
const { uploadImage, deleteImage } = require('../controllers/uploadController');

// Upload single image
router.post('/image', protect, upload.single('image'), uploadImage);

// Delete image
router.delete('/image', protect, deleteImage);

module.exports = router;

