const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  generateBinId,
  generateDeviceId,
  previewNextIds
} = require('../controllers/settingsController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All settings routes require admin authentication
router.use(authMiddleware);
router.use(authorize('admin'));

// GET /api/settings - Get current settings
router.get('/', getSettings);

// PUT /api/settings - Update settings
router.put('/', updateSettings);

// POST /api/settings/generate-bin-id - Generate next bin ID
router.post('/generate-bin-id', generateBinId);

// POST /api/settings/generate-device-id - Generate next device ID
router.post('/generate-device-id', generateDeviceId);

// GET /api/settings/preview-ids - Preview next IDs without incrementing
router.get('/preview-ids', previewNextIds);

module.exports = router;