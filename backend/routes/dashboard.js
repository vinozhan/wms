const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');

// Direct route handlers
router.get('/overview', DashboardController.getOverview);
router.get('/analytics', DashboardController.getAnalytics);

module.exports = router;