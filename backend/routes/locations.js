const express = require('express');
const router = express.Router();
const {
  getDistricts,
  getCitiesByDistrict,
  validateLocation
} = require('../controllers/locationsController');

// GET /api/locations/districts - Get all districts
router.get('/districts', getDistricts);

// GET /api/locations/districts/:district/cities - Get cities by district
router.get('/districts/:district/cities', getCitiesByDistrict);

// POST /api/locations/validate - Validate district/city combination
router.post('/validate', validateLocation);

module.exports = router;