import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../config/apiConfig';

export const TOKEN_STORAGE_KEY = '@tms_auth_token';

// Create base axios instance
const api = axios.create({
  timeout: 15000,
});

// Dynamic baseURL interceptor + JWT Authorization header
api.interceptors.request.use(
  async (config) => {
    // Dynamically retrieve base URL if not explicitly set
    if (!config.baseURL) {
      config.baseURL = await getBaseUrl();
    }

    try {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Error reading auth token:', err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Helpful log for debugging network or auth issues
    if (error.response) {
      console.log(`[API Error ${error.response.status}]:`, error.response.data?.message || error.message);
    } else if (error.request) {
      console.log('[API Network Error]: No response received from server. Check base URL.');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

export const departmentService = {
  create: (data) => api.post('/departments', data),
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export const programmeService = {
  create: (data) => api.post('/programmes', data),
  getAll: (params) => api.get('/programmes', { params }),
  getById: (id) => api.get(`/programmes/${id}`),
  update: (id, data) => api.put(`/programmes/${id}`, data),
  delete: (id) => api.delete(`/programmes/${id}`),
};

export const blockService = {
  create: (data) => api.post('/blocks', data),
  getAll: (params) => api.get('/blocks', { params }),
  getById: (id) => api.get(`/blocks/${id}`),
  update: (id, data) => api.put(`/blocks/${id}`, data),
  delete: (id) => api.delete(`/blocks/${id}`),
};

export const roomService = {
  create: (data) => api.post('/rooms', data),
  getAll: (params) => api.get('/rooms', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
};

export const roleService = {
  create: (data) => api.post('/roles', data),
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
};

export const userService = {
  create: (data) => api.post('/users', data),
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const complaintService = {
  create: (formData) =>
    api.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getAll: (params) => api.get('/complaints', { params }),
  getById: async (id) => {
    try {
      return await api.get(`/complaints/${id}`);
    } catch (err) {
      // Backend may not have GET /complaints/:id route; fallback to getAll filter
      const res = await api.get('/complaints');
      const item = (res.data || []).find((c) => String(c._id) === String(id));
      if (item) return { data: item };
      throw err;
    }
  },
  getStats: () => api.get('/complaints/stats'),
  assign: (id, assignedTo) => api.patch(`/complaints/${id}/assign`, { assignedTo }),
  updateStatus: (id, status) => api.patch(`/complaints/${id}/status`, { status }),
  report: (params) => api.get('/complaints/report', { params }),
};

export default api;
