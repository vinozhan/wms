const mongoose = require('mongoose');
const { User, WasteBin, Payment, Collection } = require('../models');
require('dotenv').config();

const createSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a resident user to add waste bins to
    const resident = await User.findOne({ userType: 'resident' });
    if (!resident) {
      console.log('No resident user found. Please register a resident first.');
      return;
    }

    console.log(`Creating sample data for user: ${resident.email}`);

    // Create sample waste bins
    const wasteBins = [
      {
        binId: `BIN-${Date.now()}-001`,
        owner: resident._id,
        deviceType: 'rfid_tag',
        deviceId: `RFID-${Date.now()}-001`,
        binType: 'general',
        capacity: {
          total: 100,
          current: 45,
          unit: 'liters'
        },
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: resident.address.street + ', ' + resident.address.city
        },
        sensorData: {
          fillLevel: 45,
          temperature: 28,
          humidity: 65,
          lastUpdated: new Date()
        },
        nextScheduledCollection: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      },
      {
        binId: `BIN-${Date.now()}-002`,
        owner: resident._id,
        deviceType: 'smart_sensor',
        deviceId: `SENSOR-${Date.now()}-002`,
        binType: 'recyclable',
        capacity: {
          total: 80,
          current: 65,
          unit: 'liters'
        },
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: resident.address.street + ', ' + resident.address.city
        },
        sensorData: {
          fillLevel: 81,
          temperature: 26,
          humidity: 70,
          lastUpdated: new Date()
        },
        status: 'full',
        nextScheduledCollection: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // Tomorrow
      },
      {
        binId: `BIN-${Date.now()}-003`,
        owner: resident._id,
        deviceType: 'qr_code',
        deviceId: `QR-${Date.now()}-003`,
        binType: 'organic',
        capacity: {
          total: 60,
          current: 20,
          unit: 'liters'
        },
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: resident.address.street + ', ' + resident.address.city
        },
        sensorData: {
          fillLevel: 33,
          temperature: 30,
          humidity: 80,
          lastUpdated: new Date()
        },
        nextScheduledCollection: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      }
    ];

    const createdBins = await WasteBin.insertMany(wasteBins);
    console.log(`✅ Created ${createdBins.length} waste bins`);

    // Update user's waste bins
    resident.wasteBins = createdBins.map(bin => bin._id);
    await resident.save();

    // Create sample collections
    const collections = [];
    for (const bin of createdBins) {
      collections.push({
        collectionId: `COL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        wasteBin: bin._id,
        collector: await User.findOne({ userType: 'collector' }).select('_id'),
        scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        actualCollectionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'completed',
        wasteData: {
          weight: Math.floor(Math.random() * 50) + 10,
          volume: Math.floor(Math.random() * 40) + 10,
          wasteType: bin.binType
        },
        location: {
          type: 'Point',
          coordinates: bin.location.coordinates
        },
        verification: {
          method: bin.deviceType === 'rfid_tag' ? 'rfid_scan' : 'qr_scan',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      });
    }

    const createdCollections = await Collection.insertMany(collections);
    console.log(`✅ Created ${createdCollections.length} collections`);

    // Create sample payments
    const payments = [
      {
        paymentId: `PAY-${Date.now()}-001`,
        user: resident._id,
        billingPeriod: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          endDate: new Date()
        },
        collections: createdCollections.map(col => col._id),
        charges: {
          baseRate: 1500,
          wasteCharges: [
            {
              binId: createdBins[0]._id,
              wasteType: 'general',
              weight: 25,
              volume: 20,
              rate: 50,
              amount: 1250
            },
            {
              binId: createdBins[1]._id,
              wasteType: 'recyclable',
              weight: 15,
              volume: 18,
              rate: 30,
              amount: 450
            },
            {
              binId: createdBins[2]._id,
              wasteType: 'organic',
              weight: 20,
              volume: 15,
              rate: 40,
              amount: 800
            }
          ],
          additionalServices: [],
          penalties: [],
          discounts: [
            {
              type: 'recycling_bonus',
              description: 'Recycling bonus for proper sorting',
              percentage: 5,
              amount: 150
            }
          ]
        },
        totals: {
          subtotal: 4000,
          taxAmount: 600,
          discountAmount: 150,
          penaltyAmount: 0,
          totalAmount: 4450,
          currency: 'LKR'
        },
        paymentDetails: {
          method: 'credit_card'
        },
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        invoiceNumber: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`
      },
      {
        paymentId: `PAY-${Date.now()}-002`,
        user: resident._id,
        billingPeriod: {
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        },
        collections: [],
        charges: {
          baseRate: 1500,
          wasteCharges: [
            {
              binId: createdBins[0]._id,
              wasteType: 'general',
              weight: 30,
              volume: 25,
              rate: 50,
              amount: 1500
            }
          ],
          additionalServices: [],
          penalties: [],
          discounts: []
        },
        totals: {
          subtotal: 3000,
          taxAmount: 450,
          discountAmount: 0,
          penaltyAmount: 0,
          totalAmount: 3450,
          currency: 'LKR'
        },
        paymentDetails: {
          method: 'credit_card',
          transactionId: 'TXN-' + Date.now(),
          provider: 'PayHere'
        },
        status: 'completed',
        paymentDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        dueDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), // 23 days ago
        invoiceNumber: `INV-${new Date().getFullYear()}${String(new Date().getMonth()).padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`
      }
    ];

    const createdPayments = await Payment.insertMany(payments);
    console.log(`✅ Created ${createdPayments.length} payments`);

    console.log('\n🎉 Sample data created successfully!');
    console.log('\n📋 Summary:');
    console.log(`👤 User: ${resident.email}`);
    console.log(`🗑️ Waste Bins: ${createdBins.length}`);
    console.log(`📦 Collections: ${createdCollections.length}`);
    console.log(`💳 Payments: ${createdPayments.length}`);
    console.log('\nYou can now test the waste bins and payments features!');

  } catch (error) {
    console.error('❌ Failed to create sample data:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createSampleData();