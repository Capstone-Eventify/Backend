#!/usr/bin/env node

/**
 * Look up Twilio error codes and test message delivery
 */

require('dotenv').config();
const twilio = require('twilio');

async function checkTwilioErrors() {
  console.log('🔍 Twilio Error Code Lookup...\n');

  // Error code 30032 explanation
  console.log('📋 Error Code 30032:');
  console.log('Description: Message delivery failed');
  console.log('Possible causes:');
  console.log('- Invalid destination number');
  console.log('- Number not capable of receiving SMS');
  console.log('- Carrier blocking');
  console.log('- Number is landline (not mobile)');
  console.log('- International number restrictions');

  console.log('\n🧪 Testing with different approaches...\n');

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Test 1: Check if number is mobile
    console.log('📱 Step 1: Checking phone number type...');
    try {
      const phoneNumber = await client.lookups.v1.phoneNumbers('+13474467440').fetch({
        type: ['carrier']
      });
      
      console.log('✅ Phone number lookup successful:');
      console.log('- Country:', phoneNumber.countryCode);
      console.log('- National Format:', phoneNumber.nationalFormat);
      console.log('- Carrier Name:', phoneNumber.carrier?.name || 'Unknown');
      console.log('- Carrier Type:', phoneNumber.carrier?.type || 'Unknown');
      console.log('- Mobile Network:', phoneNumber.carrier?.mobile_network_code || 'Unknown');
      
      if (phoneNumber.carrier?.type !== 'mobile') {
        console.log('⚠️  WARNING: This may not be a mobile number!');
        console.log('   SMS can only be sent to mobile numbers.');
      }
      
    } catch (lookupError) {
      console.log('❌ Phone number lookup failed:', lookupError.message);
    }

    // Test 2: Try sending with different message
    console.log('\n📤 Step 2: Trying simple message...');
    try {
      const message = await client.messages.create({
        body: 'Test',
        from: process.env.TWILIO_PHONE_NUMBER,
        to: '+13474467440'
      });

      console.log('✅ Message sent:', message.sid);
      
      // Wait and check status
      setTimeout(async () => {
        try {
          const status = await client.messages(message.sid).fetch();
          console.log('\n📊 Final Status:', status.status);
          console.log('Error Code:', status.errorCode || 'None');
          console.log('Error Message:', status.errorMessage || 'None');
          console.log('Price:', status.price || 'Unknown');
          console.log('Direction:', status.direction);
        } catch (e) {
          console.log('❌ Status check failed:', e.message);
        }
      }, 5000);

    } catch (sendError) {
      console.log('❌ Message send failed:', sendError.message);
    }

    // Test 3: List recent messages
    console.log('\n📜 Step 3: Checking recent messages...');
    try {
      const messages = await client.messages.list({ limit: 5 });
      console.log(`✅ Found ${messages.length} recent messages:`);
      
      messages.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.sid} - ${msg.status} - ${msg.to} - ${msg.errorCode || 'No error'}`);
      });
      
    } catch (listError) {
      console.log('❌ Message list failed:', listError.message);
    }

  } catch (error) {
    console.log('❌ Twilio client error:', error.message);
  }
}

checkTwilioErrors();