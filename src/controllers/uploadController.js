const asyncHandler = require('../middleware/asyncHandler');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');

// @desc    Upload image to S3
// @route   POST /api/upload/image
// @access  Private
exports.uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  try {
    const folder = req.body.folder || 'general'; // 'avatars', 'events', 'general'
    const subFolder = req.body.subFolder || null; // For events: event name (will be sanitized)
    const fileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    const imageUrl = await uploadToS3(
      req.file.buffer,
      fileName,
      req.file.mimetype,
      folder,
      subFolder // Pass subfolder (event name) for events folder
    );

    res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        fileName: fileName,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('S3 upload error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.Code,
      bucket: process.env.AWS_S3_BUCKET_NAME
    });
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        code: error.Code,
        message: error.message
      } : undefined
    });
  }
});

// @desc    Delete image from S3
// @route   DELETE /api/upload/image
// @access  Private
exports.deleteImage = asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({
      success: false,
      message: 'Image URL is required'
    });
  }

  try {
    await deleteFromS3(imageUrl);
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('S3 delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  }
});

