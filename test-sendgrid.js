#!/usr/bin/env node

/**
 * Test SendGrid configuration
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSendGrid() {
  console.log('📧 Testing SendGrid Configuration...\n');

  console.log('📋 Configuration:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? `${process.env.EMAIL_PASS.substring(0, 8)}****` : 'Not set');

  if (process.env.EMAIL_PASS === 'your-sendgrid-api-key-here') {
    console.log('\n❌ Please update EMAIL_PASS with your actual SendGrid API key');
    console.log('1. Go to https://app.sendgrid.com/settings/api_keys');
    console.log('2. Create API key with Mail Send permissions');
    console.log('3. Copy the API key (starts with SG.)');
    console.log('4. Update EMAIL_PASS in .env file');
    return;
  }

  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    console.log('\n📡 Verifying SendGrid connection...');
    await transporter.verify();
    console.log('✅ SendGrid connection verified successfully!');

    console.log('\n📧 Sending test email...');
    const result = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME} <thilakediga321@gmail.com>`, // Use your verified sender
      to: 'thilakediga321@gmail.com', // Send to yourself
      subject: '🧪 SendGrid Test Email from Eventify',
      html: `
        <h2>🎉 SendGrid Configuration Successful!</h2>
        <p>This test email confirms that your SendGrid configuration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>You can now send email notifications for event registrations!</p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Check your inbox for the test email!');

  } catch (error) {
    console.log('❌ SendGrid test failed:', error.message);
    
    if (error.message.includes('Unauthorized')) {
      console.log('\n🔍 API Key Issue:');
      console.log('- Check that your API key is correct');
      console.log('- Ensure API key has Mail Send permissions');
      console.log('- Verify your SendGrid account is active');
    }
  }
}

testSendGrid();