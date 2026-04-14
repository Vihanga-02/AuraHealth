const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Public routes
router.post('/checkout', paymentController.checkout);
router.post('/confirm', paymentController.confirmPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

// Admin routes
router.get('/transactions', paymentController.getTransactions);
router.get('/transactions/stats', paymentController.getTransactionStats);
router.get('/transactions/:id', paymentController.getTransactionById);
router.post('/transactions/:id/refund', paymentController.processRefund);

module.exports = router;