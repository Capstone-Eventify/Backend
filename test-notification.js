// Simple test script to send notifications
const notificationService = require('./src/services/notificationService');

async function testNotifications() {
  console.log('Testing notification system...');
  
  // Test event registration notification
  const mockTicketData = {
    ticket: {
      id: 'test-ticket-123',
      ticketType: 'General Admission',
      orderNumber: 'ORD-TEST-123'
    },
    event: {
      id: 'test-event-123',
      title: 'Test Event - Real-time Notifications',
      organizerId: 'test-organizer-123',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      startTime: '7:00 PM',
      venueName: 'Test Venue',
      city: 'Test City',
      state: 'Test State'
    },
    attendee: {
      id: 'test-user-123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    }
  };

  try {
    await notificationService.notifyEventRegistration(mockTicketData);
    console.log('✅ Registration notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending registration notification:', error);
  }

  // Test refund notification
  const mockRefundData = {
    payment: {
      id: 'test-payment-123',
      amount: 25.00
    },
    ticket: {
      id: 'test-ticket-123'
    },
    event: {
      id: 'test-event-123',
      title: 'Test Event - Refund Test',
      organizerId: 'test-organizer-123'
    },
    attendee: {
      id: 'test-user-123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    },
    reason: 'Testing refund notifications'
  };

  try {
    await notificationService.notifyRefund(mockRefundData);
    console.log('✅ Refund notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending refund notification:', error);
  }

  console.log('Test completed!');
}

// Run the test
testNotifications();