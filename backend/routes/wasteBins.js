const express = require('express');
const { WasteBin, User } = require('../models');
const { 
  authMiddleware, 
  authorize, 
  wasteBinValidation,
  paramValidation,
  queryValidation,
  handleValidationErrors
} = require('../middleware');

const router = express.Router();

router.post('/', 
  authMiddleware,
  authorize('admin', 'collector'),
  wasteBinValidation.create,
  async (req, res) => {
    try {
      const {
        binId,
        owner,
        deviceType,
        deviceId,
        binType,
        capacity,
        location
      } = req.body;

      const existingBin = await WasteBin.findOne({ binId });
      if (existingBin) {
        return res.status(400).json({ 
          error: 'Bin with this ID already exists' 
        });
      }

      const existingDevice = await WasteBin.findOne({ deviceId });
      if (existingDevice) {
        return res.status(400).json({ 
          error: 'Device with this ID already exists' 
        });
      }

      const user = await User.findById(owner);
      if (!user) {
        return res.status(404).json({ 
          error: 'Owner not found' 
        });
      }

      const wasteBin = new WasteBin({
        binId,
        owner,
        deviceType,
        deviceId,
        binType,
        capacity,
        location: {
          type: 'Point',
          coordinates: location.coordinates,
          address: location.address
        }
      });

      await wasteBin.save();

      user.wasteBins.push(wasteBin._id);
      await user.save();

      const populatedBin = await WasteBin.findById(wasteBin._id)
        .populate('owner', 'name email');

      res.status(201).json({
        message: 'Waste bin created successfully',
        wasteBin: populatedBin
      });

    } catch (error) {
      console.error('Create waste bin error:', error);
      res.status(500).json({ 
        error: 'Failed to create waste bin' 
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
      const sort = req.query.sort || '-createdAt';

      const filter = {};
      
      if (req.user.userType === 'resident' || req.user.userType === 'business') {
        filter.owner = req.user._id;
      }

      if (req.query.binType) {
        filter.binType = req.query.binType;
      }
      if (req.query.status) {
        filter.status = req.query.status;
      }
      if (req.query.search) {
        filter.$or = [
          { binId: { $regex: req.query.search, $options: 'i' } },
          { deviceId: { $regex: req.query.search, $options: 'i' } },
          { 'location.address': { $regex: req.query.search, $options: 'i' } }
        ];
      }

      if (req.query.needsCollection === 'true') {
        filter.$or = [
          { 'sensorData.fillLevel': { $gte: 80 } },
          { status: 'full' }
        ];
      }

      if (req.query.lat && req.query.lng && req.query.radius) {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radius = parseFloat(req.query.radius);
        
        filter.location = {
          $geoWithin: {
            $centerSphere: [[lng, lat], radius / 6378.1]
          }
        };
      }

      const wasteBins = await WasteBin.find(filter)
        .populate('owner', 'name email userType')
        .populate('lastCollection.collectedBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await WasteBin.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.json({
        wasteBins,
        pagination: {
          currentPage: page,
          totalPages,
          totalBins: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get waste bins error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch waste bins' 
      });
    }
  }
);

router.get('/:id', 
  authMiddleware,
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const wasteBin = await WasteBin.findById(req.params.id)
        .populate('owner', 'name email phone address')
        .populate('lastCollection.collectedBy', 'name')
        .populate('maintenanceHistory.performedBy', 'name');

      if (!wasteBin) {
        return res.status(404).json({ 
          error: 'Waste bin not found' 
        });
      }

      if (req.user.userType !== 'admin' && 
          req.user.userType !== 'collector' && 
          wasteBin.owner._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      res.json({ wasteBin });

    } catch (error) {
      console.error('Get waste bin error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch waste bin' 
      });
    }
  }
);

router.put('/:id', 
  authMiddleware,
  authorize('admin', 'collector'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const updateData = { ...req.body };
      delete updateData.binId;
      delete updateData.deviceId;
      delete updateData.owner;

      const wasteBin = await WasteBin.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('owner', 'name email');

      if (!wasteBin) {
        return res.status(404).json({ 
          error: 'Waste bin not found' 
        });
      }

      res.json({
        message: 'Waste bin updated successfully',
        wasteBin
      });

    } catch (error) {
      console.error('Update waste bin error:', error);
      res.status(500).json({ 
        error: 'Failed to update waste bin' 
      });
    }
  }
);

router.delete('/:id', 
  authMiddleware,
  authorize('admin'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const wasteBin = await WasteBin.findById(req.params.id);

      if (!wasteBin) {
        return res.status(404).json({ 
          error: 'Waste bin not found' 
        });
      }

      await User.findByIdAndUpdate(
        wasteBin.owner,
        { $pull: { wasteBins: wasteBin._id } }
      );

      await WasteBin.findByIdAndDelete(req.params.id);

      res.json({
        message: 'Waste bin deleted successfully'
      });

    } catch (error) {
      console.error('Delete waste bin error:', error);
      res.status(500).json({ 
        error: 'Failed to delete waste bin' 
      });
    }
  }
);

router.patch('/:id/sensor', 
  authMiddleware,
  paramValidation.mongoId,
  wasteBinValidation.updateSensor,
  async (req, res) => {
    try {
      const { fillLevel, temperature, humidity } = req.body;

      const wasteBin = await WasteBin.findById(req.params.id);
      if (!wasteBin) {
        return res.status(404).json({ 
          error: 'Waste bin not found' 
        });
      }

      // Check permissions: admin/collector can update any bin, residents/business can only update their own bins
      if (req.user.userType !== 'admin' && 
          req.user.userType !== 'collector' && 
          wasteBin.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Access denied. You can only update sensor data for bins you own.' 
        });
      }

      await wasteBin.updateSensorData({
        fillLevel,
        temperature,
        humidity
      });

      // Return the complete updated waste bin data
      const updatedWasteBin = await WasteBin.findById(wasteBin._id)
        .populate('owner', 'name email userType');

      res.json({
        message: 'Sensor data updated successfully',
        wasteBin: updatedWasteBin
      });

    } catch (error) {
      console.error('Update sensor data error:', error);
      res.status(500).json({ 
        error: 'Failed to update sensor data' 
      });
    }
  }
);

router.post('/:id/maintenance', 
  authMiddleware,
  authorize('admin', 'collector'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { type, description, cost } = req.body;

      if (!['repair', 'replacement', 'calibration', 'cleaning'].includes(type)) {
        return res.status(400).json({ 
          error: 'Invalid maintenance type' 
        });
      }

      const wasteBin = await WasteBin.findById(req.params.id);
      if (!wasteBin) {
        return res.status(404).json({ 
          error: 'Waste bin not found' 
        });
      }

      wasteBin.maintenanceHistory.push({
        type,
        description,
        performedBy: req.user._id,
        cost: cost || 0
      });

      if (type === 'repair' || type === 'replacement') {
        wasteBin.status = 'active';
      }

      await wasteBin.save();

      res.json({
        message: 'Maintenance record added successfully',
        maintenanceRecord: wasteBin.maintenanceHistory[wasteBin.maintenanceHistory.length - 1]
      });

    } catch (error) {
      console.error('Add maintenance record error:', error);
      res.status(500).json({ 
        error: 'Failed to add maintenance record' 
      });
    }
  }
);

router.get('/nearby/:lat/:lng', 
  authMiddleware,
  async (req, res) => {
    try {
      const lat = parseFloat(req.params.lat);
      const lng = parseFloat(req.params.lng);
      const radius = parseFloat(req.query.radius) || 5;

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ 
          error: 'Invalid coordinates' 
        });
      }

      const wasteBins = await WasteBin.find({
        location: {
          $geoWithin: {
            $centerSphere: [[lng, lat], radius / 6378.1]
          }
        },
        isActive: true
      })
        .populate('owner', 'name userType')
        .select('binId binType status sensorData location lastCollection')
        .limit(50);

      res.json({
        wasteBins,
        center: { lat, lng },
        radius
      });

    } catch (error) {
      console.error('Get nearby bins error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch nearby waste bins' 
      });
    }
  }
);

router.get('/stats/overview', 
  authMiddleware,
  authorize('admin', 'collector'),
  async (req, res) => {
    try {
      const totalBins = await WasteBin.countDocuments();
      const activeBins = await WasteBin.countDocuments({ status: 'active' });
      const fullBins = await WasteBin.countDocuments({ status: 'full' });
      const maintenanceBins = await WasteBin.countDocuments({ status: 'maintenance' });

      const binsByType = await WasteBin.aggregate([
        {
          $group: {
            _id: '$binType',
            count: { $sum: 1 }
          }
        }
      ]);

      const needsCollection = await WasteBin.countDocuments({
        $or: [
          { 'sensorData.fillLevel': { $gte: 80 } },
          { status: 'full' }
        ]
      });

      const avgFillLevel = await WasteBin.aggregate([
        {
          $group: {
            _id: null,
            averageFillLevel: { $avg: '$sensorData.fillLevel' }
          }
        }
      ]);

      res.json({
        overview: {
          total: totalBins,
          active: activeBins,
          full: fullBins,
          maintenance: maintenanceBins,
          needsCollection
        },
        byType: binsByType,
        averageFillLevel: avgFillLevel[0]?.averageFillLevel || 0
      });

    } catch (error) {
      console.error('Get bin stats error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch waste bin statistics' 
      });
    }
  }
);

router.post('/scan/:deviceId', 
  authMiddleware,
  authorize('collector'),
  async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { scanType, location } = req.body;

      const wasteBin = await WasteBin.findOne({ deviceId })
        .populate('owner', 'name phone');

      if (!wasteBin) {
        return res.status(404).json({ 
          error: 'Waste bin not found with this device ID' 
        });
      }

      const scanData = {
        binId: wasteBin.binId,
        owner: wasteBin.owner,
        binType: wasteBin.binType,
        fillLevel: wasteBin.sensorData.fillLevel,
        status: wasteBin.status,
        location: wasteBin.location,
        lastCollection: wasteBin.lastCollection,
        scanTimestamp: new Date(),
        scannedBy: req.user._id
      };

      res.json({
        message: 'Scan successful',
        scanData,
        audioFeedback: 'Bin scanned successfully',
        visualFeedback: wasteBin.status === 'full' ? 'red' : 'green'
      });

    } catch (error) {
      console.error('Scan device error:', error);
      res.status(500).json({ 
        error: 'Failed to scan device' 
      });
    }
  }
);

module.exports = router;