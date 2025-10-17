const request = require('supertest');
const app = require('../server');
const { User, WasteBin } = require('../models');
const { generateToken } = require('../middleware/auth');

describe('Waste Bins', () => {
  let adminToken, userToken, adminUser, regularUser;

  beforeEach(async () => {
    adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123',
      phone: '1234567890',
      userType: 'admin',
      accountStatus: 'active',
      address: {
        street: '123 Admin St',
        city: 'Colombo',
        postalCode: '10001',
        coordinates: { latitude: 6.9271, longitude: 79.8612 }
      }
    });
    await adminUser.save();
    adminToken = generateToken(adminUser._id);

    regularUser = new User({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'Password123',
      phone: '1234567890',
      userType: 'resident',
      accountStatus: 'active',
      address: {
        street: '123 User St',
        city: 'Colombo',
        postalCode: '10001',
        coordinates: { latitude: 6.9271, longitude: 79.8612 }
      }
    });
    await regularUser.save();
    userToken = generateToken(regularUser._id);
  });

  describe('POST /api/waste-bins', () => {
    it('should create a waste bin as admin', async () => {
      const binData = {
        binId: 'BIN001',
        owner: regularUser._id,
        deviceType: 'rfid_tag',
        deviceId: 'RFID001',
        binType: 'general',
        capacity: {
          total: 100,
          unit: 'liters'
        },
        location: {
          coordinates: [79.8612, 6.9271],
          address: '123 User St, Colombo'
        }
      };

      const response = await request(app)
        .post('/api/waste-bins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(binData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Waste bin created successfully');
      expect(response.body).toHaveProperty('wasteBin');
      expect(response.body.wasteBin.binId).toBe(binData.binId);
    });

    it('should not create waste bin without authorization', async () => {
      const binData = {
        binId: 'BIN001',
        owner: regularUser._id,
        deviceType: 'rfid_tag',
        deviceId: 'RFID001',
        binType: 'general',
        capacity: { total: 100, unit: 'liters' },
        location: {
          coordinates: [79.8612, 6.9271],
          address: '123 User St, Colombo'
        }
      };

      const response = await request(app)
        .post('/api/waste-bins')
        .send(binData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No valid token provided.');
    });

    it('should not create waste bin with duplicate binId', async () => {
      const binData = {
        binId: 'BIN001',
        owner: regularUser._id,
        deviceType: 'rfid_tag',
        deviceId: 'RFID001',
        binType: 'general',
        capacity: { total: 100, unit: 'liters' },
        location: {
          coordinates: [79.8612, 6.9271],
          address: '123 User St, Colombo'
        }
      };

      await request(app)
        .post('/api/waste-bins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(binData);

      const response = await request(app)
        .post('/api/waste-bins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...binData, deviceId: 'RFID002' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bin with this ID already exists');
    });
  });

  describe('GET /api/waste-bins', () => {
    beforeEach(async () => {
      const bin1 = new WasteBin({
        binId: 'BIN001',
        owner: regularUser._id,
        deviceType: 'rfid_tag',
        deviceId: 'RFID001',
        binType: 'general',
        capacity: { total: 100, current: 50, unit: 'liters' },
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: '123 User St, Colombo'
        }
      });

      const bin2 = new WasteBin({
        binId: 'BIN002',
        owner: regularUser._id,
        deviceType: 'smart_sensor',
        deviceId: 'SENSOR001',
        binType: 'recyclable',
        capacity: { total: 100, current: 80, unit: 'liters' },
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: '123 User St, Colombo'
        }
      });

      await bin1.save();
      await bin2.save();
    });

    it('should get all waste bins as admin', async () => {
      const response = await request(app)
        .get('/api/waste-bins')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('wasteBins');
      expect(response.body.wasteBins).toHaveLength(2);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should get only user bins as regular user', async () => {
      const response = await request(app)
        .get('/api/waste-bins')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('wasteBins');
      expect(response.body.wasteBins).toHaveLength(2);
      response.body.wasteBins.forEach(bin => {
        expect(bin.owner._id).toBe(regularUser._id.toString());
      });
    });

    it('should filter bins by type', async () => {
      const response = await request(app)
        .get('/api/waste-bins?binType=recyclable')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.wasteBins).toHaveLength(1);
      expect(response.body.wasteBins[0].binType).toBe('recyclable');
    });
  });

  describe('PATCH /api/waste-bins/:id/sensor', () => {
    let wasteBin;

    beforeEach(async () => {
      wasteBin = new WasteBin({
        binId: 'BIN001',
        owner: regularUser._id,
        deviceType: 'smart_sensor',
        deviceId: 'SENSOR001',
        binType: 'general',
        capacity: { total: 100, current: 50, unit: 'liters' },
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: '123 User St, Colombo'
        }
      });
      await wasteBin.save();
    });

    it('should update sensor data as admin', async () => {
      const sensorData = {
        fillLevel: 85,
        temperature: 25,
        humidity: 60
      };

      const response = await request(app)
        .patch(`/api/waste-bins/${wasteBin._id}/sensor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sensorData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Sensor data updated successfully');
      expect(response.body.wasteBin.fillLevel).toBe(85);
    });

    it('should not update sensor data without authorization', async () => {
      const sensorData = { fillLevel: 85 };

      const response = await request(app)
        .patch(`/api/waste-bins/${wasteBin._id}/sensor`)
        .send(sensorData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No valid token provided.');
    });

    it('should validate sensor data ranges', async () => {
      const invalidSensorData = { fillLevel: 150 };

      const response = await request(app)
        .patch(`/api/waste-bins/${wasteBin._id}/sensor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidSensorData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('POST /api/waste-bins/scan/:deviceId', () => {
    let wasteBin, collectorUser, collectorToken;

    beforeEach(async () => {
      collectorUser = new User({
        name: 'Collector User',
        email: 'collector@example.com',
        password: 'Password123',
        phone: '1234567890',
        userType: 'collector',
        accountStatus: 'active',
        address: {
          street: '123 Collector St',
          city: 'Colombo',
          postalCode: '10001',
          coordinates: { latitude: 6.9271, longitude: 79.8612 }
        }
      });
      await collectorUser.save();
      collectorToken = generateToken(collectorUser._id);

      wasteBin = new WasteBin({
        binId: 'BIN001',
        owner: regularUser._id,
        deviceType: 'rfid_tag',
        deviceId: 'RFID001',
        binType: 'general',
        capacity: { total: 100, current: 80, unit: 'liters' },
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271],
          address: '123 User St, Colombo'
        },
        status: 'full'
      });
      await wasteBin.save();
    });

    it('should scan device successfully as collector', async () => {
      const response = await request(app)
        .post('/api/waste-bins/scan/RFID001')
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({ scanType: 'collection' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Scan successful');
      expect(response.body).toHaveProperty('scanData');
      expect(response.body.scanData.binId).toBe('BIN001');
      expect(response.body).toHaveProperty('audioFeedback');
      expect(response.body).toHaveProperty('visualFeedback');
    });

    it('should not scan with non-existent device ID', async () => {
      const response = await request(app)
        .post('/api/waste-bins/scan/NONEXISTENT')
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({ scanType: 'collection' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Waste bin not found with this device ID');
    });

    it('should not scan without collector authorization', async () => {
      const response = await request(app)
        .post('/api/waste-bins/scan/RFID001')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ scanType: 'collection' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied. Insufficient permissions.');
    });
  });
});