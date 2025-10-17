import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  verifyToken: (token) => api.post('/auth/verify-token', { token }),
  refreshToken: () => api.post('/auth/refresh-token'),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
};

export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  updateUserStatus: (id, status) => api.patch(`/users/${id}/status`, { accountStatus: status }),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserWasteBins: (id) => api.get(`/users/${id}/waste-bins`),
  getUserCollections: (id, params) => api.get(`/users/${id}/collections`, { params }),
  getUserPayments: (id, params) => api.get(`/users/${id}/payments`, { params }),
  getUserStats: () => api.get('/users/stats/overview'),
};

export const wasteBinAPI = {
  createWasteBin: (binData) => api.post('/waste-bins', binData),
  getWasteBins: (params) => api.get('/waste-bins', { params }),
  getWasteBin: (id) => api.get(`/waste-bins/${id}`),
  updateWasteBin: (id, binData) => api.put(`/waste-bins/${id}`, binData),
  deleteWasteBin: (id) => api.delete(`/waste-bins/${id}`),
  updateSensorData: (id, sensorData) => api.patch(`/waste-bins/${id}/sensor`, sensorData),
  addMaintenanceRecord: (id, maintenanceData) => api.post(`/waste-bins/${id}/maintenance`, maintenanceData),
  getNearbyBins: (lat, lng, radius) => api.get(`/waste-bins/nearby/${lat}/${lng}`, { params: { radius } }),
  getBinStats: () => api.get('/waste-bins/stats/overview'),
  scanDevice: (deviceId, scanData) => api.post(`/waste-bins/scan/${deviceId}`, scanData),
};

export const collectionAPI = {
  createCollection: (collectionData) => api.post('/collections', collectionData),
  getCollections: (params) => api.get('/collections', { params }),
  getCollection: (id) => api.get(`/collections/${id}`),
  completeCollection: (id, completionData) => api.patch(`/collections/${id}/complete`, completionData),
  startCollection: (id) => api.patch(`/collections/${id}/start`),
  markCollectionMissed: (id, reason) => api.patch(`/collections/${id}/miss`, { reason }),
  approveCollection: (id, approvalData) => api.patch(`/collections/${id}/approve`, approvalData),
  rejectCollection: (id, reason) => api.patch(`/collections/${id}/reject`, { reason }),
  getCollectionStats: () => api.get('/collections/stats/overview'),
};

export const paymentAPI = {
  createPayment: (paymentData) => api.post('/payments', paymentData),
  getPayments: (params) => api.get('/payments', { params }),
  getPayment: (id) => api.get(`/payments/${id}`),
  processPayment: (id, transactionData) => api.post(`/payments/${id}/process`, transactionData),
  paymentPayHere: (paymentId) => api.post('/payments/payment-payhere', { paymentId }),
};

export const analyticsAPI = {
  generateReport: (reportData) => api.post('/analytics/generate', reportData),
  getReports: () => api.get('/analytics'),
  getReport: (id) => api.get(`/analytics/${id}`),
};

export const binRequestAPI = {
  createBinRequest: (requestData) => api.post('/bin-requests', requestData),
  getBinRequests: (params) => api.get('/bin-requests', { params }),
  getBinRequest: (id) => api.get(`/bin-requests/${id}`),
  updateBinRequest: (id, data) => api.put(`/bin-requests/${id}`, data),
  deleteBinRequest: (id) => api.delete(`/bin-requests/${id}`),
  approveBinRequest: (id, data) => api.patch(`/bin-requests/${id}/approve`, data),
  rejectBinRequest: (id, data) => api.patch(`/bin-requests/${id}/reject`, data),
  completeBinRequest: (id, data) => api.patch(`/bin-requests/${id}/complete`, data),
  getBinRequestStats: () => api.get('/bin-requests/stats/overview'),
};

export const billingAPI = {
  generateMyBill: (params) => api.post('/billing/generate-my-bill', {}, { params }),
  generateUserBill: (userId, params) => api.post(`/billing/generate-user-bill/${userId}`, {}, { params }),
  generateAllBills: (params) => api.post('/billing/generate-all-bills', {}, { params }),
  createManualBill: (userId, billingData) => api.post(`/billing/manual-bill/${userId}`, billingData),
  getBillingRates: (params) => api.get('/billing/rates', { params }),
  getMySummary: () => api.get('/billing/my-summary'),
  getUserSummary: (userId) => api.get(`/billing/summary/${userId}`),
};

// PAYT (Pay-As-You-Throw) API
export const paytAPI = {
  calculateBill: (userId, billingPeriod, options) => api.post('/payt/calculate-bill', { userId, billingPeriod, options }),
  generateInvoice: (billData, options) => api.post('/payt/generate-invoice', { billData, options }),
  getWasteStatistics: (userId, period) => api.get(`/payt/waste-statistics/${userId}`, { params: { period } }),
  getOptimizationRecommendations: (userId) => api.get(`/payt/optimization-recommendations/${userId}`),
  getBillingRates: (district) => api.get('/payt/billing-rates', { params: { district } }),
  createBillingRate: (rateData) => api.post('/payt/billing-rates', rateData),
  updateBillingRate: (id, rateData) => api.put(`/payt/billing-rates/${id}`, rateData),
};

// Route Optimization API
export const routeOptimizationAPI = {
  optimizeRoute: (routeId, algorithm, options) => api.post('/route-optimization/optimize', { routeId, algorithm, options }),
  optimizeMultipleRoutes: (routeIds, algorithm, options) => api.post('/route-optimization/optimize-multiple', { routeIds, algorithm, options }),
  getOptimizationRecommendations: (routeId) => api.get(`/route-optimization/recommendations/${routeId}`),
  getOptimizationHistory: (routeId) => api.get(`/route-optimization/history/${routeId}`),
  createRoute: (routeData) => api.post('/routes', routeData),
  getRoutes: (params) => api.get('/routes', { params }),
  getRoute: (id) => api.get(`/routes/${id}`),
  updateRoute: (id, routeData) => api.put(`/routes/${id}`, routeData),
  deleteRoute: (id) => api.delete(`/routes/${id}`),
};

// Recycling Credits API
export const recyclingCreditsAPI = {
  processCollectionCredits: (collectionId, verifierId) => api.post('/recycling-credits/process', { collectionId, verifierId }),
  getUserCreditSummary: (userId, period) => api.get(`/recycling-credits/summary/${userId}`, { params: { period } }),
  processCreditPayout: (creditId, paymentMethod, processedBy) => api.post('/recycling-credits/payout', { creditId, paymentMethod, processedBy }),
  getUserCredits: (userId, params) => api.get(`/recycling-credits/user/${userId}`, { params }),
  getCreditDetails: (creditId) => api.get(`/recycling-credits/${creditId}`),
  disputeCredit: (creditId, reason, disputedBy) => api.post(`/recycling-credits/${creditId}/dispute`, { reason, disputedBy }),
  generateCreditReport: (scope, scopeId, period) => api.post('/recycling-credits/report', { scope, scopeId, period }),
  getUserAchievements: (userId) => api.get(`/recycling-credits/achievements/${userId}`),
};

// Feedback System API
export const feedbackAPI = {
  generateCollectionFeedback: (collectionId, scanResult, options) => api.post('/feedback/generate', { collectionId, scanResult, options }),
  generateBulkFeedback: (collectionIds, scanResults, options) => api.post('/feedback/generate-bulk', { collectionIds, scanResults, options }),
  streamFeedback: (collectionId, options) => api.post('/feedback/stream', { collectionId, options }),
  updateDeviceSettings: (deviceId, settings) => api.put(`/feedback/device-settings/${deviceId}`, settings),
  getFeedbackHistory: (collectionId) => api.get(`/feedback/history/${collectionId}`),
};

// Environmental Impact API
export const environmentalAPI = {
  calculateCollectionImpact: (collectionId) => api.post('/environmental/calculate-impact', { collectionId }),
  aggregateImpacts: (query, period) => api.post('/environmental/aggregate', { query, period }),
  generateEnvironmentalReport: (scope, scopeId, period) => api.post('/environmental/report', { scope, scopeId, period }),
  calculateCarbonCredits: (impactIds) => api.post('/environmental/carbon-credits', { impactIds }),
  getUserImpactSummary: (userId, period) => api.get(`/environmental/user-impact/${userId}`, { params: { period } }),
  getDistrictImpact: (district, period) => api.get(`/environmental/district-impact/${district}`, { params: { period } }),
  getSystemImpact: (period) => api.get('/environmental/system-impact', { params: { period } }),
  getImpactDetails: (impactId) => api.get(`/environmental/impact/${impactId}`),
  getSustainabilityMetrics: (scope, scopeId) => api.get('/environmental/sustainability', { params: { scope, scopeId } }),
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),
  generateBinId: () => api.post('/settings/generate-bin-id'),
  generateDeviceId: () => api.post('/settings/generate-device-id'),
  previewNextIds: () => api.get('/settings/preview-ids'),
};

// Truck API
export const truckAPI = {
  getTrucks: (params) => api.get('/trucks', { params }),
  getTruck: (id) => api.get(`/trucks/${id}`),
  createTruck: (truckData) => api.post('/trucks', truckData),
  updateTruck: (id, truckData) => api.put(`/trucks/${id}`, truckData),
  deleteTruck: (id) => api.delete(`/trucks/${id}`),
  getAvailableTrucks: () => api.get('/trucks/available'),
  assignTruckToCollector: (truckId, collectorId) => api.post('/trucks/assign', { truckId, collectorId }),
};

// Location API
export const locationAPI = {
  getDistricts: () => api.get('/locations/districts'),
  getCitiesByDistrict: (district) => api.get(`/locations/districts/${district}/cities`),
  validateLocation: (district, city) => api.post('/locations/validate', { district, city }),
};

// Route API
export const routeAPI = {
  getRoutes: (params) => api.get('/routes', { params }),
  getRoute: (id) => api.get(`/routes/${id}`),
  createRoute: (routeData) => api.post('/routes', routeData),
  updateRoute: (id, routeData) => api.put(`/routes/${id}`, routeData),
  deleteRoute: (id) => api.delete(`/routes/${id}`),
  optimizeRoute: (id, algorithm) => api.post(`/routes/${id}/optimize`, { algorithm }),
  getCollectorRoutes: (collectorId) => api.get(`/routes/collector/${collectorId}`),
  getRouteStats: () => api.get('/routes/stats/overview'),
  markBinAsCollected: (routeId, binId) => api.patch(`/routes/${routeId}/bins/${binId}/complete`),
  revertBinStatus: (routeId, binId) => api.patch(`/routes/${routeId}/bins/${binId}/revert`),
};

export default api;