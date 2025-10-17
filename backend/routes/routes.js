const express = require('express');
const { Route, User, WasteBin, Truck } = require('../models');
const { 
  authMiddleware, 
  authorize, 
  paramValidation,
  queryValidation,
  handleValidationErrors
} = require('../middleware');

const router = express.Router();

// GET /api/routes - Get all routes
router.get('/', 
  authMiddleware,
  authorize('admin', 'collector'),
  queryValidation.pagination,
  handleValidationErrors,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const sort = req.query.sort || '-createdAt';

      const filter = {};
      if (req.query.status) {
        filter.status = req.query.status;
      }
      if (req.query.district) {
        filter.district = req.query.district;
      }
      if (req.query.collector) {
        filter.assignedCollector = req.query.collector;
      }

      // If user is a collector, only show their routes
      if (req.user.userType === 'collector') {
        filter.assignedCollector = req.user._id;
      }

      const routes = await Route.find(filter)
        .populate('assignedCollector', 'name email')
        .populate('backupCollector', 'name email')
        .populate('wasteBins.bin', 'binId binType location')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Route.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.json({
        routes,
        pagination: {
          currentPage: page,
          totalPages,
          totalRoutes: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get routes error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch routes' 
      });
    }
  }
);

// POST /api/routes - Create new route
router.post('/', 
  authMiddleware,
  authorize('admin'),
  async (req, res) => {
    try {
      const {
        name,
        district,
        cities,
        assignedCollector,
        backupCollector,
        vehicle,
        wasteBins,
        schedule
      } = req.body;

      // Validate assigned collector exists and is a collector
      const collector = await User.findById(assignedCollector);
      if (!collector || collector.userType !== 'collector') {
        return res.status(400).json({
          success: false,
          message: 'Invalid collector assignment'
        });
      }

      // Validate waste bins exist
      if (wasteBins && wasteBins.length > 0) {
        const binIds = wasteBins.map(wb => wb.bin);
        const existingBins = await WasteBin.find({ _id: { $in: binIds } });
        if (existingBins.length !== binIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Some waste bins do not exist'
          });
        }
      }

      // Prepare route data, handling empty backupCollector
      const routeData = {
        name,
        district,
        cities,
        assignedCollector,
        vehicle,
        wasteBins: wasteBins || [],
        schedule
      };

      // Only add backupCollector if it's not empty
      if (backupCollector && backupCollector.trim() !== '') {
        routeData.backupCollector = backupCollector;
      }

      const route = new Route(routeData);

      await route.save();
      await route.calculateEstimates();

      // Update collector's assigned routes
      await User.findByIdAndUpdate(
        assignedCollector,
        { $addToSet: { 'collectorInfo.assignedRoutes': route._id } }
      );

      if (backupCollector) {
        await User.findByIdAndUpdate(
          backupCollector,
          { $addToSet: { 'collectorInfo.assignedRoutes': route._id } }
        );
      }

      const populatedRoute = await Route.findById(route._id)
        .populate('assignedCollector', 'name email')
        .populate('backupCollector', 'name email')
        .populate('wasteBins.bin', 'binId binType location');

      res.status(201).json({
        success: true,
        message: 'Route created successfully',
        route: populatedRoute
      });

    } catch (error) {
      console.error('Create route error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create route',
        error: error.message
      });
    }
  }
);

// GET /api/routes/:id - Get specific route
router.get('/:id', 
  authMiddleware,
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const route = await Route.findById(req.params.id)
        .populate('assignedCollector', 'name email phone collectorInfo')
        .populate('backupCollector', 'name email phone')
        .populate('wasteBins.bin', 'binId binType location capacity sensorData');

      if (!route) {
        return res.status(404).json({ 
          error: 'Route not found' 
        });
      }

      // Check permissions
      if (req.user.userType === 'collector' && 
          route.assignedCollector._id.toString() !== req.user._id.toString() &&
          (!route.backupCollector || route.backupCollector._id.toString() !== req.user._id.toString())) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      res.json({ route });

    } catch (error) {
      console.error('Get route error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch route' 
      });
    }
  }
);

// PUT /api/routes/:id - Update route
router.put('/:id', 
  authMiddleware,
  authorize('admin'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const routeId = req.params.id;
      const updateData = { ...req.body };

      // If updating assigned collector, validate
      if (updateData.assignedCollector) {
        const collector = await User.findById(updateData.assignedCollector);
        if (!collector || collector.userType !== 'collector') {
          return res.status(400).json({
            error: 'Invalid collector assignment'
          });
        }
      }

      const oldRoute = await Route.findById(routeId);
      if (!oldRoute) {
        return res.status(404).json({ 
          error: 'Route not found' 
        });
      }

      // Handle empty backupCollector in update data
      if (updateData.backupCollector === '') {
        delete updateData.backupCollector;
      }

      const route = await Route.findByIdAndUpdate(
        routeId,
        updateData,
        { new: true, runValidators: true }
      )
      .populate('assignedCollector', 'name email')
      .populate('backupCollector', 'name email')
      .populate('wasteBins.bin', 'binId binType location');

      // Update collector assignments if changed
      if (updateData.assignedCollector && 
          updateData.assignedCollector !== oldRoute.assignedCollector.toString()) {
        // Remove from old collector
        await User.findByIdAndUpdate(
          oldRoute.assignedCollector,
          { $pull: { 'collectorInfo.assignedRoutes': routeId } }
        );
        
        // Add to new collector
        await User.findByIdAndUpdate(
          updateData.assignedCollector,
          { $addToSet: { 'collectorInfo.assignedRoutes': routeId } }
        );
      }

      await route.calculateEstimates();

      res.json({
        message: 'Route updated successfully',
        route
      });

    } catch (error) {
      console.error('Update route error:', error);
      res.status(500).json({ 
        error: 'Failed to update route' 
      });
    }
  }
);

// DELETE /api/routes/:id - Delete route
router.delete('/:id', 
  authMiddleware,
  authorize('admin'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const route = await Route.findById(req.params.id);

      if (!route) {
        return res.status(404).json({ 
          error: 'Route not found' 
        });
      }

      // Remove route from assigned collectors
      if (route.assignedCollector) {
        await User.findByIdAndUpdate(
          route.assignedCollector,
          { $pull: { 'collectorInfo.assignedRoutes': req.params.id } }
        );
      }

      if (route.backupCollector) {
        await User.findByIdAndUpdate(
          route.backupCollector,
          { $pull: { 'collectorInfo.assignedRoutes': req.params.id } }
        );
      }

      await Route.findByIdAndDelete(req.params.id);

      res.json({
        message: 'Route deleted successfully'
      });

    } catch (error) {
      console.error('Delete route error:', error);
      res.status(500).json({ 
        error: 'Failed to delete route' 
      });
    }
  }
);

// POST /api/routes/:id/optimize - Optimize route
router.post('/:id/optimize', 
  authMiddleware,
  authorize('admin', 'collector'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { algorithm = 'dijkstra' } = req.body;
      
      const route = await Route.findById(req.params.id);
      if (!route) {
        return res.status(404).json({ 
          error: 'Route not found' 
        });
      }

      // Check permissions for collectors
      if (req.user.userType === 'collector' && 
          route.assignedCollector.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      await route.optimizeRoute(algorithm);
      await route.calculateEstimates();

      const optimizedRoute = await Route.findById(req.params.id)
        .populate('assignedCollector', 'name email')
        .populate('wasteBins.bin', 'binId binType location');

      res.json({
        message: 'Route optimized successfully',
        route: optimizedRoute
      });

    } catch (error) {
      console.error('Optimize route error:', error);
      res.status(500).json({ 
        error: 'Failed to optimize route' 
      });
    }
  }
);

// GET /api/routes/collector/:collectorId - Get routes for specific collector
router.get('/collector/:collectorId', 
  authMiddleware,
  authorize('admin', 'collector'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const collectorId = req.params.collectorId;

      // Check permissions
      if (req.user.userType === 'collector' && 
          req.user._id.toString() !== collectorId) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      const routes = await Route.find({
        $or: [
          { assignedCollector: collectorId },
          { backupCollector: collectorId }
        ]
      })
      .populate('assignedCollector', 'name email')
      .populate('backupCollector', 'name email')
      .populate('wasteBins.bin', 'binId binType location capacity sensorData')
      .sort('-createdAt');

      res.json({ routes });

    } catch (error) {
      console.error('Get collector routes error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch collector routes' 
      });
    }
  }
);

// GET /api/routes/stats/overview - Get route statistics
router.get('/stats/overview', 
  authMiddleware,
  authorize('admin'),
  async (req, res) => {
    try {
      const totalRoutes = await Route.countDocuments();
      const activeRoutes = await Route.countDocuments({ status: 'active' });
      const inactiveRoutes = await Route.countDocuments({ status: 'inactive' });
      const optimizedRoutes = await Route.countDocuments({ 'optimization.isOptimized': true });

      const routesByDistrict = await Route.aggregate([
        {
          $group: {
            _id: '$district',
            count: { $sum: 1 }
          }
        }
      ]);

      const routesByCollector = await Route.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'assignedCollector',
            foreignField: '_id',
            as: 'collector'
          }
        },
        {
          $unwind: '$collector'
        },
        {
          $group: {
            _id: '$collector.name',
            routes: { $sum: 1 },
            totalBins: { $sum: { $size: '$wasteBins' } }
          }
        }
      ]);

      res.json({
        overview: {
          total: totalRoutes,
          active: activeRoutes,
          inactive: inactiveRoutes,
          optimized: optimizedRoutes
        },
        byDistrict: routesByDistrict,
        byCollector: routesByCollector
      });

    } catch (error) {
      console.error('Get route stats error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch route statistics' 
      });
    }
  }
);

router.patch('/:routeId/bins/:binId/complete', authMiddleware, async (req, res) => {
  try {
    const { routeId, binId } = req.params;

    const route = await Route.findById(routeId).populate('wasteBins.bin');

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Case-insensitive & trimmed match
    const targetBin = route.wasteBins.find(
      b => b.bin?.binId?.trim().toUpperCase() === binId.trim().toUpperCase()
    );

    if (!targetBin) {
      console.warn('Bin not found. Available bins:', route.wasteBins.map(b => b.bin?.binId));
      return res.status(404).json({ error: 'Bin not found in this route' });
    }

    targetBin.status = 'completed';
    targetBin.completedAt = new Date();

    if (!route.lastCompleted) route.lastCompleted = {};
    route.lastCompleted.date = new Date();
    route.lastCompleted.collectionsCompleted =
      (route.lastCompleted.collectionsCompleted || 0) + 1;

    await route.save();

    res.json({
      success: true,
      message: `Bin ${binId} marked as completed`,
      route
    });

  } catch (error) {
    console.error('Error completing bin:', error);
    res.status(500).json({ error: 'Server error while completing bin' });
  }
});


router.patch('/:routeId/bins/:binId/revert', authMiddleware, authorize('collector', 'admin'), async (req, res) => {
  try {
    const { routeId, binId } = req.params;

    const route = await Route.findById(routeId).populate('wasteBins.bin');

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Find the bin to revert using a case-insensitive match
    const targetBin = route.wasteBins.find(
      b => b.bin?.binId?.trim().toUpperCase() === binId.trim().toUpperCase()
    );

    if (!targetBin) {
      return res.status(404).json({ error: 'Bin not found in this route' });
    }

    if (targetBin.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed bins can be reverted.' });
    }

    // Revert the status and clear the completion timestamp
    targetBin.status = 'pending';
    targetBin.completedAt = null;

    // Decrement the completion counter
    if (route.lastCompleted && route.lastCompleted.collectionsCompleted > 0) {
      route.lastCompleted.collectionsCompleted -= 1;
    }

    await route.save();

    res.json({
      success: true,
      message: `Bin ${binId} status reverted to pending`,
      route // Send back the updated route object
    });

  } catch (error) {
    console.error('Error reverting bin status:', error);
    res.status(500).json({ error: 'Server error while reverting bin status' });
  }
});


module.exports = router;