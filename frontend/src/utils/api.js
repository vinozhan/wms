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

export default api;