const sriLankaLocations = require('../data/sriLankaLocations');

// Get all districts
const getDistricts = async (req, res) => {
  try {
    const districts = sriLankaLocations.getDistrictOptions();
    res.status(200).json({
      success: true,
      districts
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch districts',
      error: error.message
    });
  }
};

// Get cities by district
const getCitiesByDistrict = async (req, res) => {
  try {
    const { district } = req.params;
    const cities = sriLankaLocations.getCityOptions(district);
    
    if (cities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'District not found or no cities available'
      });
    }
    
    res.status(200).json({
      success: true,
      district,
      cities
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
};

// Validate location (district + city combination)
const validateLocation = async (req, res) => {
  try {
    const { district, city } = req.body;
    
    if (!district || !city) {
      return res.status(400).json({
        success: false,
        message: 'District and city are required'
      });
    }
    
    const isValid = sriLankaLocations.validateLocation(district, city);
    
    res.status(200).json({
      success: true,
      valid: isValid,
      message: isValid ? 'Valid location' : 'Invalid district/city combination'
    });
  } catch (error) {
    console.error('Error validating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate location',
      error: error.message
    });
  }
};

module.exports = {
  getDistricts,
  getCitiesByDistrict,
  validateLocation
};