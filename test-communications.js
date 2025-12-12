#!/usr/bin/env node

/**
 * Test script for SMS and Email communications
 * Run with: node test-communications.js
 */

require('dotenv').config();
const communicationService = require('./src/services/communicationService');

async function testCommunications() {
  console.log('🧪 Testing Communication Services...\n');

  // Test SMS
  console.log('📱 Testing SMS...');
  try {
    const smsResult = await communicationService.testSMS('+1234567890'); // Replace with your phone number
    console.log('SMS Result:', smsResult);
    if (smsResult.success) {
      console.log('✅ SMS test successful!');
    } else {
      console.log('❌ SMS test failed:', smsResult.error);
    }
  } catch (error) {
    console.log('❌ SMS test error:', error.message);
  }

  console.log('\n📧 Testing Email...');
  try {
    const emailResult = await communicationService.testEmail('test@example.com'); // Replace with your email
    console.log('Email Result:', emailResult);
    if (emailResult.success) {
      console.log('✅ Email test successful!');
    } else {
      console.log('❌ Email test failed:', emailResult.error);
    }
  } catch (error) {
    console.log('❌ Email test error:', error.message);
  }

  console.log('\n🔧 Configuration Status:');
  console.log('Twilio SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Missing');
  console.log('Twilio Token:', process.env.TWILIO_AUTH_TOKEN ? '✅ Configured' : '❌ Missing');
  console.log('Twilio Phone:', process.env.TWILIO_PHONE_NUMBER ? '✅ Configured' : '❌ Missing');
  console.log('Email User:', process.env.EMAIL_USER ? '✅ Configured' : '❌ Missing');
  console.log('Email Pass:', process.env.EMAIL_PASS ? '✅ Configured' : '❌ Missing');

  console.log('\n✨ Test completed!');
}

// Run tests
testCommunications().catch(console.error);