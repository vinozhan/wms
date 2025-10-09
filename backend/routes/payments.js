const express = require('express');
const { Payment, Collection } = require('../models');
const { 
  authMiddleware, 
  authorize, 
  paymentValidation,
  paramValidation,
  queryValidation,
  handleValidationErrors
} = require('../middleware');

const router = express.Router();

router.post('/', 
  authMiddleware,
  paymentValidation.create,
  async (req, res) => {
    try {
      const {
        billingPeriod,
        collections,
        paymentDetails
      } = req.body;

      const userId = req.user.userType === 'admin' ? req.body.user : req.user._id;

      const payment = new Payment({
        user: userId,
        billingPeriod,
        collections,
        paymentDetails,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      await payment.save();

      const populatedPayment = await Payment.findById(payment._id)
        .populate('user', 'name email')
        .populate('collections');

      res.status(201).json({
        message: 'Payment created successfully',
        payment: populatedPayment
      });

    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({ 
        error: 'Failed to create payment' 
      });
    }
  }
);

router.get('/', 
  authMiddleware,
  queryValidation.pagination,
  handleValidationErrors,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter = {};
      
      if (req.user.userType !== 'admin') {
        filter.user = req.user._id;
      }

      if (req.query.status) {
        filter.status = req.query.status;
      }

      const payments = await Payment.find(filter)
        .populate('user', 'name email')
        .populate('collections', 'collectionId status')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);

      const total = await Payment.countDocuments(filter);

      res.json({
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPayments: total
        }
      });

    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch payments' 
      });
    }
  }
);

router.post('/:id/process', 
  authMiddleware,
  paramValidation.mongoId,
  paymentValidation.process,
  async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        return res.status(404).json({ 
          error: 'Payment not found' 
        });
      }

      if (req.user.userType !== 'admin' && 
          payment.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      await payment.processPayment(req.body);

      setTimeout(async () => {
        await payment.confirmPayment();
      }, 2000);

      res.json({
        message: 'Payment processed successfully',
        payment
      });

    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({ 
        error: 'Failed to process payment' 
      });
    }
  }
);

module.exports = router;