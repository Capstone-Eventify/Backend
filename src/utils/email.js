const nodemailer = require('nodemailer');

// Check if email is configured
const isEmailConfigured = () => {
  return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

// Create reusable transporter (only if email is configured)
let transporter = null;

if (isEmailConfigured()) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    transporter = null;
  }
}

// Send email
exports.sendEmail = async (options) => {
  if (!isEmailConfigured() || !transporter) {
    throw new Error('Email service is not configured. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in your .env file.');
  }

  const message = {
    from: `${process.env.EMAIL_FROM_NAME || 'Eventify'} <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
    await transporter.sendMail(message);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

