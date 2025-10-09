const { validationResult, body, param, query } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errorMessages
    });
  }
  
  next();
};

const userValidation = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('phone')
      .matches(/^[0-9]{10,15}$/)
      .withMessage('Phone number must be 10-15 digits'),
    
    body('address.street')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Street address must be between 5 and 200 characters'),
    
    body('address.city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    
    body('address.postalCode')
      .matches(/^[0-9]{5,10}$/)
      .withMessage('Postal code must be 5-10 digits'),
    
    body('address.coordinates.latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    
    body('address.coordinates.longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    
    body('userType')
      .optional()
      .isIn(['resident', 'business', 'collector', 'admin'])
      .withMessage('Invalid user type'),
    
    handleValidationErrors
  ],
  
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    handleValidationErrors
  ],
  
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('phone')
      .optional()
      .matches(/^[0-9]{10,15}$/)
      .withMessage('Phone number must be 10-15 digits'),
    
    body('address.street')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Street address must be between 5 and 200 characters'),
    
    handleValidationErrors
  ]
};

const wasteBinValidation = {
  create: [
    body('binId')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Bin ID must be between 3 and 50 characters'),
    
    body('deviceType')
      .isIn(['rfid_tag', 'barcode', 'smart_sensor', 'qr_code'])
      .withMessage('Invalid device type'),
    
    body('deviceId')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Device ID must be between 3 and 100 characters'),
    
    body('binType')
      .isIn(['general', 'recyclable', 'organic', 'hazardous', 'electronic'])
      .withMessage('Invalid bin type'),
    
    body('capacity.total')
      .isFloat({ min: 1 })
      .withMessage('Total capacity must be at least 1'),
    
    body('capacity.unit')
      .optional()
      .isIn(['liters', 'kg', 'cubic_meters'])
      .withMessage('Invalid capacity unit'),
    
    body('location.coordinates')
      .isArray({ min: 2, max: 2 })
      .withMessage('Coordinates must be an array of [longitude, latitude]'),
    
    body('location.coordinates.*')
      .isFloat()
      .withMessage('Coordinates must be valid numbers'),
    
    body('location.address')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters'),
    
    handleValidationErrors
  ],
  
  updateSensor: [
    body('fillLevel')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Fill level must be between 0 and 100'),
    
    body('temperature')
      .optional()
      .isFloat({ min: -50, max: 100 })
      .withMessage('Temperature must be between -50 and 100 degrees'),
    
    body('humidity')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Humidity must be between 0 and 100 percent'),
    
    handleValidationErrors
  ]
};

const collectionValidation = {
  create: [
    body('wasteBin')
      .isMongoId()
      .withMessage('Invalid waste bin ID'),
    
    body('scheduledDate')
      .isISO8601()
      .withMessage('Invalid scheduled date format'),
    
    body('wasteData.wasteType')
      .isIn(['general', 'recyclable', 'organic', 'hazardous', 'electronic'])
      .withMessage('Invalid waste type'),
    
    body('location.coordinates')
      .isArray({ min: 2, max: 2 })
      .withMessage('Coordinates must be an array of [longitude, latitude]'),
    
    body('verification.method')
      .isIn(['rfid_scan', 'barcode_scan', 'qr_scan', 'manual_entry', 'sensor_reading'])
      .withMessage('Invalid verification method'),
    
    handleValidationErrors
  ],
  
  complete: [
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    
    body('volume')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Volume must be a positive number'),
    
    body('verification.method')
      .isIn(['rfid_scan', 'barcode_scan', 'qr_scan', 'manual_entry', 'sensor_reading'])
      .withMessage('Invalid verification method'),
    
    handleValidationErrors
  ]
};

const paymentValidation = {
  create: [
    body('billingPeriod.startDate')
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    body('billingPeriod.endDate')
      .isISO8601()
      .withMessage('Invalid end date format'),
    
    body('collections')
      .isArray()
      .withMessage('Collections must be an array'),
    
    body('collections.*')
      .isMongoId()
      .withMessage('Invalid collection ID'),
    
    body('paymentDetails.method')
      .isIn(['credit_card', 'debit_card', 'bank_transfer', 'mobile_payment', 'cash', 'check'])
      .withMessage('Invalid payment method'),
    
    handleValidationErrors
  ],
  
  process: [
    body('transactionId')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Transaction ID must be between 3 and 100 characters'),
    
    body('provider')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Provider name must be between 2 and 50 characters'),
    
    handleValidationErrors
  ]
};

const routeValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Route name must be between 3 and 100 characters'),
    
    body('district')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('District must be between 2 and 100 characters'),
    
    body('assignedCollector')
      .isMongoId()
      .withMessage('Invalid collector ID'),
    
    body('vehicle.vehicleId')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Vehicle ID must be between 3 and 50 characters'),
    
    body('vehicle.type')
      .isIn(['truck', 'van', 'electric_vehicle', 'compactor'])
      .withMessage('Invalid vehicle type'),
    
    body('vehicle.capacity')
      .isFloat({ min: 1 })
      .withMessage('Vehicle capacity must be at least 1'),
    
    body('schedule.frequency')
      .isIn(['daily', 'weekly', 'bi_weekly', 'monthly'])
      .withMessage('Invalid schedule frequency'),
    
    body('schedule.startTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Start time must be in HH:MM format'),
    
    handleValidationErrors
  ]
};

const analyticsValidation = {
  generate: [
    body('reportType')
      .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom'])
      .withMessage('Invalid report type'),
    
    body('dateRange.startDate')
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    body('dateRange.endDate')
      .isISO8601()
      .withMessage('Invalid end date format'),
    
    body('scope.wasteTypes')
      .optional()
      .isArray()
      .withMessage('Waste types must be an array'),
    
    body('scope.wasteTypes.*')
      .optional()
      .isIn(['general', 'recyclable', 'organic', 'hazardous', 'electronic'])
      .withMessage('Invalid waste type'),
    
    handleValidationErrors
  ]
};

const paramValidation = {
  mongoId: param('id').isMongoId().withMessage('Invalid ID format'),
  binId: param('binId').trim().isLength({ min: 3, max: 50 }).withMessage('Invalid bin ID'),
  routeId: param('routeId').trim().isLength({ min: 3, max: 50 }).withMessage('Invalid route ID'),
  paymentId: param('paymentId').trim().isLength({ min: 3, max: 50 }).withMessage('Invalid payment ID')
};

const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sort')
      .optional()
      .isIn(['createdAt', '-createdAt', 'name', '-name', 'status', '-status'])
      .withMessage('Invalid sort parameter')
  ]
};

module.exports = {
  handleValidationErrors,
  userValidation,
  wasteBinValidation,
  collectionValidation,
  paymentValidation,
  routeValidation,
  analyticsValidation,
  paramValidation,
  queryValidation
};