/**
 * Test script for S3 upload functionality
 * Run: node test-s3-upload.js
 */

require('dotenv').config();
const { uploadToS3 } = require('./src/utils/s3');
const fs = require('fs');
const path = require('path');

async function testS3Upload() {
  console.log('🧪 Testing S3 Upload Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('  AWS_REGION:', process.env.AWS_REGION || 'us-east-2 (default)');
  console.log('  AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
  console.log('  AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
  console.log('  AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME || 'eventifyimages (default)');
  console.log('\n⚠️  Note: Use the actual bucket name (e.g., "eventifyimages"), not the access point alias');
  console.log('');

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ Missing AWS credentials in .env file');
    console.log('\nPlease add to Backend/.env:');
    console.log('AWS_REGION=us-east-2');
    console.log('AWS_ACCESS_KEY_ID=your_access_key');
    console.log('AWS_SECRET_ACCESS_KEY=your_secret_key');
    console.log('AWS_S3_BUCKET_NAME=eventifyimages-es4zzdf7sg54csd99bmexchnbbuskuse2a-s3alias');
    process.exit(1);
  }

  try {
    // Create a test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    console.log('📤 Uploading test image to S3...');
    const imageUrl = await uploadToS3(
      testImageBuffer,
      'test-image.png',
      'image/png',
      'test'
    );

    console.log('✅ Upload successful!');
    console.log('📎 Image URL:', imageUrl);
    console.log('\n🎉 S3 configuration is working correctly!');
    console.log('\nYou can now test image uploads through the API:');
    console.log('  POST http://localhost:5001/api/upload/image');
    console.log('  Headers: Authorization: Bearer YOUR_TOKEN');
    console.log('  Body: FormData with "image" file and "folder" (optional)');
    
  } catch (error) {
    console.error('\n❌ S3 Upload Test Failed:');
    console.error('Error:', error.message);
    
    if (error.name === 'InvalidAccessKeyId') {
      console.error('\n💡 Issue: Invalid AWS Access Key ID');
      console.error('   Check that AWS_ACCESS_KEY_ID is correct in .env');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('\n💡 Issue: Invalid AWS Secret Access Key');
      console.error('   Check that AWS_SECRET_ACCESS_KEY is correct in .env');
    } else if (error.name === 'NoSuchBucket') {
      console.error('\n💡 Issue: Bucket not found');
      console.error('   Check that AWS_S3_BUCKET_NAME matches your bucket name');
      console.error('   Current bucket:', process.env.AWS_S3_BUCKET_NAME || 'eventifyimages-es4zzdf7sg54csd99bmexchnbbuskuse2a-s3alias');
    } else if (error.name === 'AccessDenied') {
      console.error('\n💡 Issue: Access Denied');
      console.error('   Check IAM user has S3 permissions');
      console.error('   Verify bucket policy allows uploads');
    } else {
      console.error('\n💡 Full error details:', error);
    }
    
    process.exit(1);
  }
}

testS3Upload();

