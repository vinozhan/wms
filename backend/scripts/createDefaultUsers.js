const mongoose = require('mongoose');
const { User } = require('../models');
require('dotenv').config();

const defaultUsers = [
  {
    name: 'System Administrator',
    email: 'admin@wastemanagement.com',
    password: 'Admin123!',
    phone: '1234567890',
    userType: 'admin',
    accountStatus: 'active',
    address: {
      street: '123 Admin Street',
      city: 'Colombo',
      postalCode: '10001',
      coordinates: {
        latitude: 6.9271,
        longitude: 79.8612
      }
    }
  },
  {
    name: 'John Collector',
    email: 'collector@wastemanagement.com',
    password: 'Collector123!',
    phone: '1234567891',
    userType: 'collector',
    accountStatus: 'active',
    address: {
      street: '456 Collector Avenue',
      city: 'Colombo',
      postalCode: '10002',
      coordinates: {
        latitude: 6.9271,
        longitude: 79.8612
      }
    }
  },
  {
    name: 'Jane Collector',
    email: 'collector2@wastemanagement.com',
    password: 'Collector123!',
    phone: '1234567892',
    userType: 'collector',
    accountStatus: 'active',
    address: {
      street: '789 Collection Road',
      city: 'Colombo',
      postalCode: '10003',
      coordinates: {
        latitude: 6.9271,
        longitude: 79.8612
      }
    }
  }
];

const createDefaultUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Creating default users...\n');

    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`❌ User ${userData.email} already exists`);
          continue;
        }

        // Create new user
        const user = new User(userData);
        await user.save();
        
        console.log(`✅ Created ${userData.userType}: ${userData.email}`);
        console.log(`   Name: ${userData.name}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   Status: ${userData.accountStatus}\n`);
        
      } catch (error) {
        console.log(`❌ Error creating ${userData.email}:`, error.message);
      }
    }

    console.log('\n🎉 Setup completed!');
    console.log('\n📋 Default Login Credentials:');
    console.log('================================');
    console.log('👨‍💼 ADMIN LOGIN:');
    console.log('   Email: admin@wastemanagement.com');
    console.log('   Password: Admin123!');
    console.log('\n👷‍♂️ COLLECTOR LOGIN:');
    console.log('   Email: collector@wastemanagement.com');
    console.log('   Password: Collector123!');
    console.log('\n👷‍♀️ COLLECTOR 2 LOGIN:');
    console.log('   Email: collector2@wastemanagement.com');
    console.log('   Password: Collector123!');
    console.log('\n⚠️  Remember to change these passwords in production!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createDefaultUsers();