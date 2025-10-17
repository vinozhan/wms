const crypto = require('crypto');
const { Payment, Collection } = require('../models');

// Create payment
const createPayment = async (req, res) => {
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
};

// Get payments
const getPayments = async (req, res) => {
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
};

// Process payment
const processPayment = async (req, res) => {
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
};

// Initialize PayHere payment
const paymentPayHere = async (req, res) => {
  try {
    const { paymentId } = req.body;

    // Validate paymentId exists and is valid
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    const paymentData = await Payment.findById(paymentId).populate('user', 'name email phone address');

    // Validate required environment variables
    if (!process.env.PAYHERE_MERCHANT_ID || !process.env.PAYHERE_MERCHANT_SECRET) {
      console.error("Missing PayHere credentials in environment variables");
      return res.status(500).json({
        success: false,
        message: "Payment system configuration error"
      });
    }

    // Validate required payment data
    if (!paymentData?.totals?.totalAmount || typeof paymentData.totals.totalAmount !== 'number') {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount"
      });
    }

    if (!paymentData) {
      return res.json({ success: false, message: "Payment not found" });
    }

    if (paymentData.status === 'completed') {
      return res.json({ success: false, message: "Payment already completed" });
    }

    // Generate PayHere payment data
    const orderId = paymentData.paymentId || `PAY_${Date.now()}`;
    const amount = paymentData.totals.totalAmount;
    const currency = paymentData.totals.currency || 'LKR';

    // Generate hash (must be done server-side for security)
    const merchantId = String(process.env.PAYHERE_MERCHANT_ID);
    const secretHash = crypto.createHash('md5')
      .update(String(process.env.PAYHERE_MERCHANT_SECRET))
      .digest('hex')
      .toUpperCase();

    const hashString = [
      merchantId,
      orderId,
      amount.toFixed(2),
      currency,
      secretHash
    ].join('');

    const hash = crypto.createHash('md5')
      .update(hashString)
      .digest('hex')
      .toUpperCase();

    const paymentPayload = {
      merchant_id: merchantId,
      order_id: orderId,
      items: `Waste Management Services - Invoice ${paymentData.invoiceNumber}`,
      amount: amount.toFixed(2),
      currency: currency,
      hash: hash,
      first_name: paymentData.user?.name?.split(' ')[0] || 'Customer',
      last_name: paymentData.user?.name?.split(' ').slice(1).join(' ') || '',
      email: paymentData.user?.email || 'customer@example.com',
      phone: paymentData.user?.phone || '0771234567',
      address: paymentData.user?.address?.street || 'No 1, Main Street',
      city: paymentData.user?.address?.city || 'Colombo',
      country: 'Sri Lanka',
      custom_1: paymentId, // Store payment ID in custom field
    };

    console.log('PayHere payment initialized:', {
      orderId,
      amount: amount.toFixed(2),
      currency,
      paymentId
    });

    res.json({
      success: true,
      paymentData: paymentPayload,
      message: "Payment initialized successfully"
    });

  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({
      success: false,
      message: "Payment initialization failed",
      error: error.message
    });
  }
};

// Verify PayHere payment
const verifyPayHere = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1 // Contains our paymentId
    } = req.body;

    // Log received values for debugging
    console.log("Received from PayHere:", {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1
    });

    // Validate required fields
    if (!merchant_id || !order_id || !payhere_amount || !status_code || !md5sig) {
      return res.status(400).send("Missing required fields");
    }

    // Format amount to 2 decimal places to match initial hash generation
    const formattedAmount = parseFloat(payhere_amount).toFixed(2);

    // Verify the payment
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;
    const secretHash = crypto
      .createHash('md5')
      .update(merchant_secret)
      .digest('hex')
      .toUpperCase();

    const local_md5sig = crypto
      .createHash('md5')
      .update(
        merchant_id +
        order_id +
        formattedAmount +
        payhere_currency +
        status_code +
        secretHash
      )
      .digest('hex')
      .toUpperCase();

    // Log both hashes for comparison
    console.log("Hash Comparison:", {
      received: md5sig,
      computed: local_md5sig,
      status_code: status_code
    });

    if (local_md5sig === md5sig && status_code == 2) {
      // Payment is verified and successful
      await Payment.findByIdAndUpdate(custom_1, {
        status: 'completed',
        paymentDate: new Date(),
        'paymentDetails.transactionId': payment_id,
        'paymentDetails.provider': 'PayHere'
      });

      console.log(`Payment ${custom_1} verified and completed via PayHere`);
      return res.status(200).send("Payment verified and processed");
    } else {
      // Payment verification failed - log why
      if (local_md5sig !== md5sig) {
        console.log("Hash mismatch - possible tampering or secret mismatch");
      }
      if (status_code != 2) {
        console.log(`Payment not successful - status code: ${status_code}`);
      }
      // Payment verification failed
      return res.status(400).send("Payment verification failed");
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).send("Error processing payment verification");
  }
};

// PayHere notification handler
const payhereNotify = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig
    } = req.body;

    console.log('PayHere Notification:', req.body);

    // Verify the payment status
    if (status_code === '2') { // Success
      const payment = await Payment.findOne({ paymentId: order_id });
      
      if (payment) {
        await payment.confirmPayment();
        console.log(`Payment ${order_id} confirmed via PayHere`);
      }
    } else {
      const payment = await Payment.findOne({ paymentId: order_id });
      
      if (payment) {
        await payment.failPayment('PayHere payment failed');
        console.log(`Payment ${order_id} failed via PayHere`);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('PayHere notification error:', error);
    res.status(500).send('Error');
  }
};

module.exports = {
  createPayment,
  getPayments,
  processPayment,
  paymentPayHere,
  verifyPayHere,
  payhereNotify
};