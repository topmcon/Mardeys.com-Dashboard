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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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

// WebSocket connection
export const connectWebSocket = (onMessage) => {
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Attempt to reconnect after 5 seconds
    setTimeout(() => connectWebSocket(onMessage), 5000);
  };

  return ws;
};

export default api;
