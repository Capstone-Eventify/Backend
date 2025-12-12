#!/usr/bin/env node

/**
 * Test the CommunicationService directly
 * Run with: node test-sms-service.js +1234567890
 */

require('dotenv').config();

async function testService() {
  console.log('🧪 Testing CommunicationService...\n');

  try {
    const communicationService = require('./src/services/communicationService');
    
    const testPhone = process.argv[2];
    if (!testPhone) {
      console.log('❌ Please provide a phone number: node test-sms-service.js +1234567890');
      return;
    }

    console.log(`📱 Testing SMS to: ${testPhone}`);
    
    const result = await communicationService.testSMS(testPhone);
    
    console.log('\n📊 Result:', result);
    
    if (result.success) {
      console.log('✅ SMS test successful!');
      console.log('Message ID:', result.messageId);
    } else {
      console.log('❌ SMS test failed!');
      console.log('Error:', result.error);
    }

  } catch (error) {
    console.log('❌ Service test failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

testService();