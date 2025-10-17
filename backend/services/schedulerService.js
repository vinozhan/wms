const cron = require('node-cron');
const BillingService = require('./billingService');

class SchedulerService {
  
  static init() {
    console.log('Initializing scheduler service...');
    
    // Schedule monthly billing generation on the 1st of every month at 2 AM
    cron.schedule('0 2 1 * *', async () => {
      console.log('Starting monthly billing generation...');
      try {
        const results = await BillingService.generateBillsForAllUsers();
        console.log('Monthly billing completed:', results);
      } catch (error) {
        console.error('Monthly billing failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Colombo"
    });
    
    // Schedule weekly reminder for overdue payments (every Sunday at 10 AM)
    cron.schedule('0 10 * * 0', async () => {
      console.log('Checking for overdue payments...');
      try {
        await this.processOverduePayments();
      } catch (error) {
        console.error('Overdue payment processing failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Colombo"
    });

    console.log('Scheduler service initialized successfully');
  }

  // Process overdue payments and add late fees
  static async processOverduePayments() {
    const { Payment } = require('../models');
    
    try {
      const overduePayments = await Payment.find({
        status: 'pending',
        dueDate: { $lt: new Date() }
      }).populate('user', 'name email');

      console.log(`Found ${overduePayments.length} overdue payments`);

      for (const payment of overduePayments) {
        const daysPastDue = Math.floor((new Date() - payment.dueDate) / (1000 * 60 * 60 * 24));
        
        // Add late payment penalty if not already added
        const hasLateFee = payment.charges.penalties.some(p => p.type === 'late_payment');
        
        if (!hasLateFee && daysPastDue > 7) { // Grace period of 7 days
          const lateFeePenalty = {
            type: 'late_payment',
            description: `Late payment fee (${daysPastDue} days overdue)`,
            amount: Math.round(payment.totals.totalAmount * 0.02) // 2% late fee
          };

          payment.charges.penalties.push(lateFeePenalty);
          payment.calculateTotals(); // Recalculate totals
          
          await payment.save();
          
          console.log(`Added late fee to payment ${payment.invoiceNumber} for user ${payment.user.email}`);
        }
      }

    } catch (error) {
      console.error('Error processing overdue payments:', error);
      throw error;
    }
  }

  // Manual trigger for billing (for testing)
  static async triggerMonthlyBilling() {
    console.log('Manually triggering monthly billing...');
    try {
      const results = await BillingService.generateBillsForAllUsers();
      console.log('Manual billing completed:', results);
      return results;
    } catch (error) {
      console.error('Manual billing failed:', error);
      throw error;
    }
  }

  // Test scheduler
  static testScheduler() {
    console.log('Testing scheduler with a 10-second job...');
    
    // Schedule a test job that runs every 10 seconds for testing
    const testJob = cron.schedule('*/10 * * * * *', () => {
      console.log('Test scheduler job running at:', new Date().toISOString());
    }, {
      scheduled: false
    });

    testJob.start();
    
    // Stop the test job after 1 minute
    setTimeout(() => {
      testJob.stop();
      console.log('Test scheduler job stopped');
    }, 60000);
  }
}

module.exports = SchedulerService;