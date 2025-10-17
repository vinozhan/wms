const express = require('express');
const router = express.Router();
const {
  createTruck,
  getTrucks,
  getTruck,
  updateTruck,
  deleteTruck,
  assignTruckToCollector,
  getAvailableTrucks
} = require('../controllers/truckController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// All truck routes require authentication
router.use(authMiddleware);

// GET /api/trucks - Get all trucks
router.get('/', 
  authorize('admin', 'collector'),
  getTrucks
);

// GET /api/trucks/available - Get available trucks
router.get('/available', 
  authorize('admin'),
  getAvailableTrucks
);

// GET /api/trucks/:id - Get truck by ID
router.get('/:id', 
  authorize('admin', 'collector'),
  param('id').isMongoId().withMessage('Invalid truck ID'),
  handleValidationErrors,
  getTruck
);

// POST /api/trucks - Create new truck
router.post('/', 
  authorize('admin'),
  [
    body('truckNumber')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Truck number must be between 3 and 20 characters')
      .matches(/^[A-Za-z0-9-]+$/)
      .withMessage('Truck number can only contain letters, numbers, and hyphens'),
    
    body('vehicleType')
      .isIn(['truck', 'van', 'electric_vehicle', 'compactor'])
      .withMessage('Invalid vehicle type'),
    
    body('capacity.volume')
      .isFloat({ min: 1 })
      .withMessage('Volume capacity must be at least 1'),
    
    body('capacity.weight')
      .isFloat({ min: 1 })
      .withMessage('Weight capacity must be at least 1'),
    
    body('capacity.unit')
      .optional()
      .isIn(['cubic_meters', 'liters'])
      .withMessage('Invalid capacity unit'),
    
    body('specifications.year')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage('Invalid year'),
    
    body('specifications.engineType')
      .optional()
      .isIn(['diesel', 'petrol', 'electric', 'hybrid'])
      .withMessage('Invalid engine type')
  ],
  handleValidationErrors,
  createTruck
);

// PUT /api/trucks/:id - Update truck
router.put('/:id', 
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid truck ID'),
    
    body('truckNumber')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Truck number must be between 3 and 20 characters'),
    
    body('vehicleType')
      .optional()
      .isIn(['truck', 'van', 'electric_vehicle', 'compactor'])
      .withMessage('Invalid vehicle type'),
    
    body('status')
      .optional()
      .isIn(['active', 'maintenance', 'out_of_service', 'retired'])
      .withMessage('Invalid status')
  ],
  handleValidationErrors,
  updateTruck
);

// DELETE /api/trucks/:id - Delete truck
router.delete('/:id', 
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid truck ID'),
  handleValidationErrors,
  deleteTruck
);

// POST /api/trucks/assign - Assign truck to collector
router.post('/assign', 
  authorize('admin'),
  [
    body('truckId')
      .isMongoId()
      .withMessage('Invalid truck ID'),
    
    body('collectorId')
      .isMongoId()
      .withMessage('Invalid collector ID')
  ],
  handleValidationErrors,
  assignTruckToCollector
);

module.exports = router;