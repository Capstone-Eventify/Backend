const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2', // US East (Ohio)
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// IMPORTANT: Use the actual bucket name, NOT the access point alias
// The bucket name you provided ends with "-s3alias" which is an access point alias
// The actual bucket name is likely just "eventifyimages" 
// Check your S3 console to find the actual bucket name
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'eventifyimages';

/**
 * Sanitize string for use as folder name
 * @param {string} name - Name to sanitize
 * @returns {string} Sanitized name
 */
const sanitizeFolderName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
};

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} mimetype - MIME type
 * @param {string} folder - Folder path (e.g., 'avatars', 'events')
 * @param {string} subFolder - Optional subfolder (e.g., event name for events folder)
 * @returns {Promise<string>} S3 URL
 */
const uploadToS3 = async (fileBuffer, fileName, mimetype, folder = 'uploads', subFolder = null) => {
  // Build key path
  let key = folder;
  
  // Add subfolder if provided (e.g., events/event-name/)
  if (subFolder) {
    const sanitizedSubFolder = sanitizeFolderName(subFolder);
    key = `${folder}/${sanitizedSubFolder}`;
  }
  
  // Add timestamp and filename
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  key = `${key}/${Date.now()}-${sanitizedFileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype
    // Note: ACLs are disabled on this bucket, use bucket policy for public access instead
  });

  await s3Client.send(command);
  
  // Return public URL
  const region = process.env.AWS_REGION || 'us-east-2'; // US East (Ohio)
  return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
};

/**
 * Delete file from S3
 * @param {string} fileUrl - Full S3 URL or key
 */
const deleteFromS3 = async (fileUrl) => {
  // Extract key from URL if full URL is provided
  let key = fileUrl;
  if (fileUrl.includes('.amazonaws.com/')) {
    key = fileUrl.split('.amazonaws.com/')[1];
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  await s3Client.send(command);
};

/**
 * Get presigned URL for private files (if needed)
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getPresignedUrl,
  s3Client,
  sanitizeFolderName
};

