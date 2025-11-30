import axios from 'axios';

// Force production API URL - ALWAYS use this, ignore environment variables
const API_URL = 'https://mardeys-dashboard-api.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 - just reject the promise
    // The AuthContext handles authentication state
    if (error.response?.status === 401) {
      console.log('API returned 401 - ignoring redirect');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verify: () => api.get('/auth/verify')
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getStatus: () => api.get('/dashboard/status')
};

// Metrics API
export const metricsAPI = {
  getMetrics: (params) => api.get('/metrics', { params }),
  getLatest: (type) => api.get('/metrics/latest', { params: { type } }),
  getStats: (params) => api.get('/metrics/stats', { params })
};

// Alerts API
export const alertsAPI = {
  getAlerts: (params) => api.get('/alerts', { params }),
  getAlert: (id) => api.get(`/alerts/${id}`),
  acknowledgeAlert: (id) => api.patch(`/alerts/${id}/acknowledge`),
  resolveAlert: (id) => api.patch(`/alerts/${id}/resolve`),
  getStats: (params) => api.get('/alerts/stats/summary', { params })
};

// Settings API
export const settingsAPI = {
  getSettings: (category) => api.get('/settings', { params: { category } }),
  getSetting: (key) => api.get(`/settings/${key}`),
  updateSetting: (key, data) => api.put(`/settings/${key}`, data),
  deleteSetting: (key) => api.delete(`/settings/${key}`)
};

// Services API - detailed data from each source
export const servicesAPI = {
  getWordPress: () => api.get('/services/wordpress'),
  getWooCommerce: () => api.get('/services/woocommerce'),
  getDigitalOcean: () => api.get('/services/digitalocean'),
  getCloudflare: () => api.get('/services/cloudflare')
};

// WebSocket connection - DISABLED to prevent loops
export const connectWebSocket = (onMessage) => {
  console.log('WebSocket disabled');
  return { close: () => {} };
};

export default api;
