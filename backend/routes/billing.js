const express = require('express');
const { authMiddleware, authorize } = require('../middleware');
const {
  generateMyBill,
  generateUserBill,
  generateAllBills,
  createManualBill,
  getBillingRates,
  getBillingSummary
} = require('../controllers/billingController');

const router = express.Router();

// User routes (residents and businesses)
router.post('/generate-my-bill', authMiddleware, authorize('resident', 'business'), generateMyBill);
router.get('/my-summary', authMiddleware, authorize('resident', 'business'), getBillingSummary);

// Admin routes
router.post('/generate-user-bill/:userId', authMiddleware, authorize('admin'), generateUserBill);
router.post('/generate-all-bills', authMiddleware, authorize('admin'), generateAllBills);
router.post('/manual-bill/:userId', authMiddleware, authorize('admin'), createManualBill);
router.get('/summary/:userId', authMiddleware, authorize('admin'), getBillingSummary);

// Public/shared routes
router.get('/rates', authMiddleware, getBillingRates);

module.exports = router;