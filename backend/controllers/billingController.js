const BillingService = require('../services/billingService');
const { User, Payment } = require('../models');

// Generate bill for current user
const generateMyBill = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    let billingPeriod = null;
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      billingPeriod = { startDate, endDate };
    }

    const bill = await BillingService.generateBill(userId, billingPeriod);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'No collection data found for the specified period'
      });
    }

    const populatedBill = await Payment.findById(bill._id)
      .populate('user', 'name email')
      .populate('collections');

    res.json({
      success: true,
      message: 'Bill generated successfully',
      bill: populatedBill
    });

  } catch (error) {
    console.error('Generate my bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bill',
      error: error.message
    });
  }
};

// Generate bill for specific user (admin only)
const generateUserBill = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    let billingPeriod = null;
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      billingPeriod = { startDate, endDate };
    }

    const bill = await BillingService.generateBill(userId, billingPeriod);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'No collection data found for the specified period'
      });
    }

    const populatedBill = await Payment.findById(bill._id)
      .populate('user', 'name email')
      .populate('collections');

    res.json({
      success: true,
      message: 'Bill generated successfully',
      bill: populatedBill
    });

  } catch (error) {
    console.error('Generate user bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bill',
      error: error.message
    });
  }
};

// Generate bills for all users (admin only)
const generateAllBills = async (req, res) => {
  try {
    const { month, year } = req.query;

    let billingPeriod = null;
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      billingPeriod = { startDate, endDate };
    }

    const results = await BillingService.generateBillsForAllUsers(billingPeriod);

    res.json({
      success: true,
      message: 'Bulk bill generation completed',
      results
    });

  } catch (error) {
    console.error('Generate all bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bills',
      error: error.message
    });
  }
};

// Create manual bill (admin only)
const createManualBill = async (req, res) => {
  try {
    const { userId } = req.params;
    const billingData = req.body;

    const bill = await BillingService.generateManualBill(userId, billingData);

    const populatedBill = await Payment.findById(bill._id)
      .populate('user', 'name email')
      .populate('collections');

    res.status(201).json({
      success: true,
      message: 'Manual bill created successfully',
      bill: populatedBill
    });

  } catch (error) {
    console.error('Create manual bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create manual bill',
      error: error.message
    });
  }
};

// Get billing rates and configuration
const getBillingRates = async (req, res) => {
  try {
    const { userType } = req.query;

    // Import rates from service
    const BillingRates = require('../services/billingService');
    
    const rates = {
      resident: {
        baseRate: 500,
        wasteRates: {
          general: 30,
          recyclable: 15,
          organic: 25,
          hazardous: 100
        },
        recyclingBonus: {
          threshold: 10,
          bonusRate: 5
        },
        taxRate: 0.15
      },
      business: {
        baseRate: 2000,
        wasteRates: {
          general: 40,
          recyclable: 20,
          organic: 35,
          hazardous: 150
        },
        recyclingBonus: {
          threshold: 50,
          bonusRate: 8
        },
        taxRate: 0.18,
        volumeDiscount: {
          threshold: 500,
          discountRate: 0.1
        }
      }
    };

    if (userType && rates[userType]) {
      res.json({
        success: true,
        rates: rates[userType]
      });
    } else {
      res.json({
        success: true,
        rates
      });
    }

  } catch (error) {
    console.error('Get billing rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing rates',
      error: error.message
    });
  }
};

// Get billing summary for user
const getBillingSummary = async (req, res) => {
  try {
    const userId = req.user.userType === 'admin' && req.params.userId 
      ? req.params.userId 
      : req.user._id;

    const currentPeriod = BillingService.getBillingPeriod();
    const previousPeriod = BillingService.getPreviousBillingPeriod();

    // Get bills for current and previous periods
    const [currentBill, previousBill, totalBills, pendingBills] = await Promise.all([
      Payment.findOne({
        user: userId,
        'billingPeriod.startDate': currentPeriod.startDate,
        'billingPeriod.endDate': currentPeriod.endDate
      }),
      Payment.findOne({
        user: userId,
        'billingPeriod.startDate': previousPeriod.startDate,
        'billingPeriod.endDate': previousPeriod.endDate
      }),
      Payment.countDocuments({ user: userId }),
      Payment.countDocuments({ user: userId, status: 'pending' })
    ]);

    // Calculate totals
    const totalPaid = await Payment.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totals.totalAmount' } } }
    ]);

    const totalPending = await Payment.aggregate([
      { $match: { user: userId, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$totals.totalAmount' } } }
    ]);

    res.json({
      success: true,
      summary: {
        currentPeriod: {
          ...currentPeriod,
          hasBill: !!currentBill,
          bill: currentBill
        },
        previousPeriod: {
          ...previousPeriod,
          hasBill: !!previousBill,
          bill: previousBill
        },
        totals: {
          totalBills,
          pendingBills,
          totalPaid: totalPaid[0]?.total || 0,
          totalPending: totalPending[0]?.total || 0
        }
      }
    });

  } catch (error) {
    console.error('Get billing summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing summary',
      error: error.message
    });
  }
};

module.exports = {
  generateMyBill,
  generateUserBill,
  generateAllBills,
  createManualBill,
  getBillingRates,
  getBillingSummary
};