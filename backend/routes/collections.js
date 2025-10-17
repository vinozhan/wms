const express = require('express');
const { Collection, WasteBin, Route } = require('../models');
const { 
  authMiddleware, 
  authorize, 
  collectionValidation,
  paramValidation,
  queryValidation,
  handleValidationErrors
} = require('../middleware');

const router = express.Router();


router.post('/', 
  authMiddleware,
  authorize('admin', 'collector', 'resident', 'business'),
  collectionValidation.create,
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        wasteBin,
        collector,
        scheduledDate,
        wasteData,
        location,
        verification
      } = req.body;

      const bin = await WasteBin.findById(wasteBin);
      if (!bin) {
        return res.status(404).json({ 
          error: 'Waste bin not found' 
        });
      }

      // Check for duplicate requests (only for resident/business users)
      if (req.user.userType === 'resident' || req.user.userType === 'business') {
        const existingRequest = await Collection.findOne({
          wasteBin,
          requester: req.user._id,
          status: 'requested'
        });

        if (existingRequest) {
          return res.status(400).json({ 
            error: 'A collection request for this bin is already pending' 
          });
        }
      }

      // Generate a unique collection ID
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const collectionId = `COL-${timestamp}-${random}`;

      const collection = new Collection({
        collectionId,
        wasteBin,
        collector: req.user.userType === 'admin' 
          ? collector || req.user._id  // Admin can assign specific collector or defaults to self
          : req.user.userType === 'collector' 
          ? req.user._id 
          : null, // For resident/business requests, no collector assigned yet
        requester: req.user._id, // Always track who requested the collection
        scheduledDate,
        wasteData,
        location,
        verification,
        status: req.user.userType === 'admin' || req.user.userType === 'collector' 
          ? 'scheduled' 
          : 'requested' // Residents/business users create requests, not scheduled collections
      });

      await collection.save();

      const populatedCollection = await Collection.findById(collection._id)
        .populate('wasteBin', 'binId binType owner')
        .populate('collector', 'name')
        .populate('requester', 'name email');

      res.status(201).json({
        message: req.user.userType === 'admin' || req.user.userType === 'collector' 
          ? 'Collection scheduled successfully'
          : 'Collection request submitted successfully',
        collection: populatedCollection
      });

    } catch (error) {
      console.error('Create collection error:', error);
      res.status(500).json({ 
        error: 'Failed to create collection' 
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

      if (req.user.userType === 'collector') {
        filter.collector = req.user._id;
      }

      if (req.query.status) {
        filter.status = req.query.status;
      }
      if (req.query.wasteType) {
        filter['wasteData.wasteType'] = req.query.wasteType;
      }
      if (req.query.dateFrom) {
        filter.scheduledDate = { $gte: new Date(req.query.dateFrom) };
      }
      if (req.query.dateTo) {
        filter.scheduledDate = { 
          ...filter.scheduledDate, 
          $lte: new Date(req.query.dateTo) 
        };
      }

      const collections = await Collection.find(filter)
        .populate('wasteBin', 'binId binType location owner')
        .populate('collector', 'name')
        .populate('route', 'name routeId')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Collection.countDocuments(filter);

      res.json({
        collections,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCollections: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get collections error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch collections' 
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
      const collection = await Collection.findById(req.params.id)
        .populate('wasteBin')
        .populate('collector', 'name phone')
        .populate('route');

      if (!collection) {
        return res.status(404).json({ 
          error: 'Collection not found' 
        });
      }

      if (req.user.userType !== 'admin' && 
          req.user.userType !== 'collector' && 
          collection.wasteBin.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      res.json({ collection });

    } catch (error) {
      console.error('Get collection error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch collection' 
      });
    }
  }
);

router.patch('/:id/complete', 
  authMiddleware,
  authorize('collector'),
  paramValidation.mongoId,
  collectionValidation.complete,
  async (req, res) => {
    try {
      const { weight, volume, verification, contamination, notes } = req.body;

      const collection = await Collection.findById(req.params.id)
        .populate('wasteBin');

      if (!collection) {
        return res.status(404).json({ 
          error: 'Collection not found' 
        });
      }

      if (collection.collector.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Only assigned collector can complete this collection' 
        });
      }

      if (collection.status !== 'scheduled' && collection.status !== 'in_progress') {
        return res.status(400).json({ 
          error: 'Collection cannot be completed in current status' 
        });
      }

      await collection.markCompleted(weight, volume, verification);

      if (contamination) {
        collection.wasteData.contamination = contamination;
      }

      if (notes) {
        collection.notes.collectorNotes = notes;
      }

      await collection.save();

      await collection.wasteBin.recordCollection(req.user._id, weight, volume);

      // Auto-generate bill when collection is completed (Event-driven billing)
      try {
        const BillingService = require('../services/billingService');
        const bill = await BillingService.generateBillOnCollection(collection._id);
        
        if (bill) {
          console.log(`Auto-generated bill ${bill.invoiceNumber} for collection ${collection.collectionId}`);
        }
      } catch (billingError) {
        console.error('Failed to auto-generate bill:', billingError);
        // Don't fail the collection completion if billing fails
      }

      const updatedCollection = await Collection.findById(collection._id)
        .populate('wasteBin', 'binId binType')
        .populate('collector', 'name');

      res.json({
        message: 'Collection completed successfully',
        collection: updatedCollection,
        audioFeedback: 'Collection recorded successfully',
        visualFeedback: 'green'
      });

    } catch (error) {
      console.error('Complete collection error:', error);
      res.status(500).json({ 
        error: 'Failed to complete collection' 
      });
    }
  }
);

router.patch('/:id/start', 
  authMiddleware,
  authorize('collector'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.id);

      if (!collection) {
        return res.status(404).json({ 
          error: 'Collection not found' 
        });
      }

      if (collection.collector.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Only assigned collector can start this collection' 
        });
      }

      if (collection.status !== 'scheduled') {
        return res.status(400).json({ 
          error: 'Collection is not in scheduled status' 
        });
      }

      collection.status = 'in_progress';
      await collection.save();

      const updatedCollection = await Collection.findById(collection._id)
        .populate('wasteBin', 'binId binType location owner')
        .populate('collector', 'name')
        .populate('requester', 'name email');

      res.json({
        message: 'Collection started successfully',
        collection: updatedCollection
      });

    } catch (error) {
      console.error('Start collection error:', error);
      res.status(500).json({ 
        error: 'Failed to start collection' 
      });
    }
  }
);

router.patch('/:id/miss', 
  authMiddleware,
  authorize('collector'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { reason } = req.body;

      const collection = await Collection.findById(req.params.id);

      if (!collection) {
        return res.status(404).json({ 
          error: 'Collection not found' 
        });
      }

      if (collection.collector.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Only assigned collector can mark collection as missed' 
        });
      }

      await collection.markMissed(reason || 'No reason provided');

      res.json({
        message: 'Collection marked as missed',
        collection
      });

    } catch (error) {
      console.error('Mark collection missed error:', error);
      res.status(500).json({ 
        error: 'Failed to mark collection as missed' 
      });
    }
  }
);

// Approve/Schedule collection request (Admin only)
router.patch('/:id/approve', 
  authMiddleware,
  authorize('admin'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { collector, scheduledDate } = req.body;

      const collection = await Collection.findById(req.params.id);

      if (!collection) {
        return res.status(404).json({ 
          error: 'Collection not found' 
        });
      }

      if (collection.status !== 'requested') {
        return res.status(400).json({ 
          error: 'Only requested collections can be approved' 
        });
      }

      // Update collection to scheduled status
      collection.collector = collector;
      collection.status = 'scheduled';
      if (scheduledDate) {
        collection.scheduledDate = new Date(scheduledDate);
      }

      await collection.save();

      const updatedCollection = await Collection.findById(collection._id)
        .populate('wasteBin', 'binId binType')
        .populate('collector', 'name')
        .populate('requester', 'name email');

      res.json({
        message: 'Collection request approved and scheduled',
        collection: updatedCollection
      });

    } catch (error) {
      console.error('Approve collection error:', error);
      res.status(500).json({ 
        error: 'Failed to approve collection' 
      });
    }
  }
);

// Reject collection request (Admin only)
router.patch('/:id/reject', 
  authMiddleware,
  authorize('admin'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { reason } = req.body;

      const collection = await Collection.findById(req.params.id);

      if (!collection) {
        return res.status(404).json({ 
          error: 'Collection not found' 
        });
      }

      if (collection.status !== 'requested') {
        return res.status(400).json({ 
          error: 'Only requested collections can be rejected' 
        });
      }

      collection.status = 'cancelled';
      collection.notes = {
        ...collection.notes,
        adminNotes: reason || 'Request rejected by admin'
      };

      await collection.save();

      res.json({
        message: 'Collection request rejected',
        collection
      });

    } catch (error) {
      console.error('Reject collection error:', error);
      res.status(500).json({ 
        error: 'Failed to reject collection' 
      });
    }
  }
);

router.get('/stats/overview', 
  authMiddleware,
  authorize('admin', 'collector'),
  async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const filter = {};
      if (req.user.userType === 'collector') {
        filter.collector = req.user._id;
      }

      const totalCollections = await Collection.countDocuments(filter);
      const completedCollections = await Collection.countDocuments({
        ...filter,
        status: 'completed'
      });
      const missedCollections = await Collection.countDocuments({
        ...filter,
        status: 'missed'
      });
      const todayCollections = await Collection.countDocuments({
        ...filter,
        scheduledDate: { $gte: startOfDay, $lte: endOfDay }
      });

      const collectionsByStatus = await Collection.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const collectionsByWasteType = await Collection.aggregate([
        { $match: { ...filter, status: 'completed' } },
        {
          $group: {
            _id: '$wasteData.wasteType',
            count: { $sum: 1 },
            totalWeight: { $sum: '$wasteData.weight' },
            totalVolume: { $sum: '$wasteData.volume' }
          }
        }
      ]);

      const efficiency = totalCollections > 0 ? 
        (completedCollections / totalCollections) * 100 : 0;

      res.json({
        overview: {
          total: totalCollections,
          completed: completedCollections,
          missed: missedCollections,
          today: todayCollections,
          efficiency: Math.round(efficiency)
        },
        byStatus: collectionsByStatus,
        byWasteType: collectionsByWasteType
      });

    } catch (error) {
      console.error('Get collection stats error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch collection statistics' 
      });
    }
  }
);

module.exports = router;