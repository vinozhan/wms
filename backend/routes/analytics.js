const express = require('express');
const { Analytics, Collection, WasteBin, Payment } = require('../models');
const { 
  authMiddleware, 
  authorize, 
  analyticsValidation,
  handleValidationErrors
} = require('../middleware');

const router = express.Router();

router.post('/generate', 
  authMiddleware,
  authorize('admin'),
  analyticsValidation.generate,
  async (req, res) => {
    try {
      const {
        reportType,
        dateRange,
        scope
      } = req.body;

      const analytics = new Analytics({
        reportType,
        generatedBy: req.user._id,
        dateRange,
        scope
      });

      const startTime = Date.now();

      const collectionsData = await Collection.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(dateRange.startDate),
              $lte: new Date(dateRange.endDate)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalCollections: { $sum: 1 },
            completedCollections: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalWeight: { $sum: '$wasteData.weight' },
            totalVolume: { $sum: '$wasteData.volume' }
          }
        }
      ]);

      const wasteByType = await Collection.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: {
              $gte: new Date(dateRange.startDate),
              $lte: new Date(dateRange.endDate)
            }
          }
        },
        {
          $group: {
            _id: '$wasteData.wasteType',
            weight: { $sum: '$wasteData.weight' },
            volume: { $sum: '$wasteData.volume' },
            count: { $sum: 1 }
          }
        }
      ]);

      analytics.collectionMetrics = {
        totalCollections: collectionsData[0]?.totalCollections || 0,
        completedCollections: collectionsData[0]?.completedCollections || 0,
        collectionEfficiency: collectionsData[0]?.totalCollections > 0 ? 
          (collectionsData[0].completedCollections / collectionsData[0].totalCollections) * 100 : 0
      };

      analytics.wasteMetrics = {
        totalWeight: collectionsData[0]?.totalWeight || 0,
        totalVolume: collectionsData[0]?.totalVolume || 0,
        wasteByType: wasteByType
      };

      analytics.generationTime = Date.now() - startTime;
      analytics.status = 'completed';

      await analytics.save();

      res.status(201).json({
        message: 'Analytics report generated successfully',
        report: analytics
      });

    } catch (error) {
      console.error('Generate analytics error:', error);
      res.status(500).json({ 
        error: 'Failed to generate analytics report' 
      });
    }
  }
);

router.get('/', 
  authMiddleware,
  authorize('admin'),
  async (req, res) => {
    try {
      const reports = await Analytics.find()
        .populate('generatedBy', 'name')
        .sort('-createdAt')
        .limit(20);

      res.json({ reports });

    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch analytics reports' 
      });
    }
  }
);

module.exports = router;