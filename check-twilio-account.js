#!/usr/bin/env node

/**
 * Check Twilio account status and limitations
 */

require('dotenv').config();
const twilio = require('twilio');

async function checkAccount() {
  console.log('🔍 Checking Twilio Account Status...\n');

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Get account info
    console.log('📋 Account Information:');
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('- Account SID:', account.sid);
    console.log('- Account Name:', account.friendlyName);
    console.log('- Account Status:', account.status);
    console.log('- Account Type:', account.type);
    console.log('- Date Created:', account.dateCreated);

    // Check balance
    console.log('\n💰 Account Balance:');
    try {
      const balance = await client.balance.fetch();
      console.log('- Current Balance:', balance.balance, balance.currency);
    } catch (balanceError) {
      console.log('- Balance check failed:', balanceError.message);
    }

    // Check phone numbers
    console.log('\n📱 Phone Numbers:');
    const phoneNumbers = await client.incomingPhoneNumbers.list();
    phoneNumbers.forEach((number, index) => {
      console.log(`${index + 1}. ${number.phoneNumber}`);
      console.log('   - Friendly Name:', number.friendlyName);
      console.log('   - Capabilities:', JSON.stringify(number.capabilities));
      console.log('   - Status:', number.status || 'Active');
    });

    // Check recent messages with details
    console.log('\n📜 Recent Messages (Last 10):');
    const messages = await client.messages.list({ limit: 10 });
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      console.log(`\n${i + 1}. Message SID: ${msg.sid}`);
      console.log('   - To:', msg.to);
      console.log('   - From:', msg.from);
      console.log('   - Status:', msg.status);
      console.log('   - Direction:', msg.direction);
      console.log('   - Date Sent:', msg.dateSent);
      console.log('   - Error Code:', msg.errorCode || 'None');
      console.log('   - Error Message:', msg.errorMessage || 'None');
      console.log('   - Price:', msg.price || 'Unknown');
      console.log('   - Body Preview:', msg.body.substring(0, 50) + '...');
    }

    // Check if this is a trial account
    console.log('\n🧪 Trial Account Check:');
    if (account.type === 'Trial') {
      console.log('⚠️  This is a TRIAL account with limitations:');
      console.log('   - Can only send SMS to verified phone numbers');
      console.log('   - Limited number of messages');
      console.log('   - Messages may have trial watermarks');
      console.log('   - Need to verify phone numbers in Twilio Console');
      
      console.log('\n📞 To verify +13474467440:');
      console.log('   1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      console.log('   2. Click "Add a new number"');
      console.log('   3. Enter +13474467440');
      console.log('   4. Complete verification process');
    } else {
      console.log('✅ This is a FULL account - no trial limitations');
    }

    // Check for any account restrictions
    console.log('\n🔒 Account Restrictions:');
    try {
      // This might not be available in all account types
      console.log('- No specific restrictions API available');
      console.log('- Check Twilio Console for any account flags');
    } catch (restrictionError) {
      console.log('- Could not check restrictions:', restrictionError.message);
    }

  } catch (error) {
    console.log('❌ Account check failed:', error.message);
  }
}

checkAccount();