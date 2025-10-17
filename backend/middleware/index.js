const { 
  authMiddleware, 
  authorize, 
  optionalAuth, 
  requireAccountStatus,
  generateToken,
  verifyToken
} = require('./auth');

const {
  handleValidationErrors,
  userValidation,
  wasteBinValidation,
  collectionValidation,
  paymentValidation,
  routeValidation,
  analyticsValidation,
  paramValidation,
  queryValidation
} = require('./validation');

module.exports = {
  authMiddleware,
  authorize,
  optionalAuth,
  requireAccountStatus,
  generateToken,
  verifyToken,
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