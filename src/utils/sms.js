// SMS utility - Mock implementation
// In production, integrate with Twilio, AWS SNS, or similar service

/**
 * Send SMS notification
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - Result object
 */
exports.sendSMS = async (phoneNumber, message) => {
  // Mock implementation
  // In production, replace with actual SMS service:
  // 
  // Example with Twilio:
  // const twilio = require('twilio');
  // const client = twilio(
  //   process.env.TWILIO_ACCOUNT_SID,
  //   process.env.TWILIO_AUTH_TOKEN
  // );
  // 
  // return await client.messages.create({
  //   body: message,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phoneNumber
  // });

  console.log(`[SMS Mock] Sending SMS to ${phoneNumber}: ${message}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    phoneNumber,
    message
  };
};

/**
 * Send bulk SMS
 * @param {Array<string>} phoneNumbers - Array of phone numbers
 * @param {string} message - SMS message content
 * @returns {Promise<Array>} - Array of results
 */
exports.sendBulkSMS = async (phoneNumbers, message) => {
  const results = [];
  
  for (const phoneNumber of phoneNumbers) {
    try {
      const result = await exports.sendSMS(phoneNumber, message);
      results.push({ phoneNumber, ...result });
    } catch (error) {
      results.push({ phoneNumber, success: false, error: error.message });
    }
  }
  
  return results;
};

