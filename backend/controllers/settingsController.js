const Settings = require('../models/Settings');

// Get current settings
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

// Update settings
const updateSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Update payment rates if provided
    if (req.body.paymentRates) {
      Object.assign(settings.paymentRates, req.body.paymentRates);
    }
    
    // Update ID counters if provided
    if (req.body.idCounters) {
      Object.assign(settings.idCounters, req.body.idCounters);
    }
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

// Generate next bin ID
const generateBinId = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const binId = await settings.generateNextBinId();
    
    res.status(200).json({
      success: true,
      binId
    });
  } catch (error) {
    console.error('Error generating bin ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bin ID',
      error: error.message
    });
  }
};

// Generate next device ID
const generateDeviceId = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const deviceId = await settings.generateNextDeviceId();
    
    res.status(200).json({
      success: true,
      deviceId
    });
  } catch (error) {
    console.error('Error generating device ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate device ID',
      error: error.message
    });
  }
};

// Preview next IDs without incrementing
const previewNextIds = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    const nextBinId = `${settings.idCounters.binIdPrefix}-${settings.idCounters.binIdYear}-${String(settings.idCounters.binIdCounter).padStart(3, '0')}`;
    const nextDeviceId = `${settings.idCounters.deviceIdPrefix}-${String(settings.idCounters.deviceIdCounter).padStart(3, '0')}`;
    
    res.status(200).json({
      success: true,
      nextIds: {
        binId: nextBinId,
        deviceId: nextDeviceId
      }
    });
  } catch (error) {
    console.error('Error previewing next IDs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview next IDs',
      error: error.message
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  generateBinId,
  generateDeviceId,
  previewNextIds
};