const express = require('express');
const { 
  authMiddleware, 
  authorize, 
  paymentValidation,
  paramValidation,
  queryValidation,
  handleValidationErrors
} = require('../middleware');
const {
  createPayment,
  getPayments,
  processPayment,
  paymentPayHere,
  verifyPayHere,
  payhereNotify
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/', authMiddleware, paymentValidation.create, createPayment);
router.get('/', authMiddleware, queryValidation.pagination, handleValidationErrors, getPayments);
router.post('/:id/process', authMiddleware, paramValidation.mongoId, paymentValidation.process, processPayment);
router.post('/payment-payhere', authMiddleware, paymentPayHere);
router.post('/verify-payhere', verifyPayHere);
router.post('/payhere-notify', payhereNotify);

module.exports = router;