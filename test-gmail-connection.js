#!/usr/bin/env node

/**
 * Test Gmail connection directly
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testGmailConnection() {
  console.log('🧪 Testing Gmail Connection...\n');

  console.log('📋 Current Configuration:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? `${process.env.EMAIL_PASS.substring(0, 4)}****` : 'Not set');

  // Test 1: Create transporter
  console.log('\n🔧 Step 1: Creating transporter...');
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    debug: true, // Enable debug output
    logger: true // Log to console
  });

  // Test 2: Verify connection
  console.log('\n📡 Step 2: Verifying connection...');
  try {
    const verified = await transporter.verify();
    console.log('✅ Gmail connection verified successfully!');
    console.log('Connection details:', verified);
  } catch (verifyError) {
    console.log('❌ Gmail connection verification failed:');
    console.log('Error:', verifyError.message);
    console.log('Code:', verifyError.code);
    console.log('Command:', verifyError.command);
    
    // Check specific error types
    if (verifyError.message.includes('Username and Password not accepted')) {
      console.log('\n🔍 Diagnosis: Authentication Issue');
      console.log('Possible causes:');
      console.log('1. App Password is incorrect or has spaces');
      console.log('2. 2-Factor Authentication is not enabled');
      console.log('3. App Password was not generated correctly');
      console.log('4. Account has security restrictions');
      
      console.log('\n🔧 Solutions:');
      console.log('1. Regenerate App Password at: https://myaccount.google.com/apppasswords');
      console.log('2. Ensure 2FA is enabled first');
      console.log('3. Copy App Password without spaces');
      console.log('4. Try a different Gmail account');
    }
    
    return;
  }

  // Test 3: Send test email
  console.log('\n📧 Step 3: Sending test email...');
  try {
    const testEmail = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '🧪 Test Email from Eventify',
      html: `
        <h2>🎉 Gmail Configuration Successful!</h2>
        <p>This test email confirms that your Gmail configuration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
        <p>You can now send email notifications for event registrations!</p>
      `
    };

    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    
  } catch (sendError) {
    console.log('❌ Test email failed:');
    console.log('Error:', sendError.message);
  }
}

testGmailConnection().catch(console.error);