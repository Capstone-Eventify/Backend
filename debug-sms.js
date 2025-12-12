#!/usr/bin/env node

/**
 * Debug SMS functionality
 * Run with: node debug-sms.js +1234567890
 */

require('dotenv').config();
const twilio = require('twilio');

async function debugSMS() {
  console.log('🔍 Debugging SMS Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing');
  console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');
  console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ Missing');
  
  if (process.env.TWILIO_ACCOUNT_SID) {
    console.log('SID Value:', process.env.TWILIO_ACCOUNT_SID);
  }
  if (process.env.TWILIO_PHONE_NUMBER) {
    console.log('Phone Number:', process.env.TWILIO_PHONE_NUMBER);
  }

  console.log('\n🔧 Testing Twilio Client...');
  
  try {
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    console.log('✅ Twilio client initialized successfully');

    // Test account info
    console.log('\n📞 Testing Account Access...');
    try {
      const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log('✅ Account accessible:', account.friendlyName);
      console.log('Account Status:', account.status);
    } catch (accountError) {
      console.log('❌ Account access failed:', accountError.message);
      return;
    }

    // Test phone number validation
    console.log('\n📱 Testing Phone Number...');
    try {
      const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 20 });
      console.log('✅ Found phone numbers:', phoneNumbers.length);
      
      const ourNumber = phoneNumbers.find(p => p.phoneNumber === process.env.TWILIO_PHONE_NUMBER);
      if (ourNumber) {
        console.log('✅ Our phone number is valid and active');
        console.log('Number capabilities:', ourNumber.capabilities);
      } else {
        console.log('❌ Our phone number not found in account');
        console.log('Available numbers:', phoneNumbers.map(p => p.phoneNumber));
      }
    } catch (phoneError) {
      console.log('❌ Phone number check failed:', phoneError.message);
    }

    // Test SMS sending
    const testPhone = process.argv[2] || '+1234567890';
    console.log(`\n📤 Testing SMS to ${testPhone}...`);
    
    try {
      const message = await client.messages.create({
        body: '🧪 Test SMS from Eventify debug script! If you receive this, SMS is working correctly. 🎉',
        from: process.env.TWILIO_PHONE_NUMBER,
        to: testPhone
      });

      console.log('✅ SMS sent successfully!');
      console.log('Message SID:', message.sid);
      console.log('Status:', message.status);
      console.log('Direction:', message.direction);
      console.log('From:', message.from);
      console.log('To:', message.to);
      
      // Check message status after a moment
      setTimeout(async () => {
        try {
          const updatedMessage = await client.messages(message.sid).fetch();
          console.log('\n📊 Updated Message Status:', updatedMessage.status);
          console.log('Error Code:', updatedMessage.errorCode || 'None');
          console.log('Error Message:', updatedMessage.errorMessage || 'None');
        } catch (statusError) {
          console.log('❌ Could not fetch message status:', statusError.message);
        }
      }, 3000);

    } catch (smsError) {
      console.log('❌ SMS sending failed:', smsError.message);
      console.log('Error Code:', smsError.code);
      console.log('More Info:', smsError.moreInfo);
    }

  } catch (error) {
    console.log('❌ Twilio initialization failed:', error.message);
  }
}

// Run debug
debugSMS().catch(console.error);

console.log('\n💡 Usage: node debug-sms.js +1234567890');
console.log('Replace +1234567890 with your actual phone number');