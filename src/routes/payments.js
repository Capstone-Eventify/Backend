const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  getPaymentHistory
} = require('../controllers/paymentController');

// All payment routes require authentication
router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);
router.post('/refund', protect, processRefund);
router.get('/history', protect, getPaymentHistory);

module.exports = router;

