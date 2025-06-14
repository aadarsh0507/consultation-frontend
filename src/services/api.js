import axios from 'axios';


export const API_URL = 'https://consultation-backend-nmyg.onrender.com/api';



// 'https://consultation-backend-nmyg.onrender.com/api'

// 'https://consultation-backend-nmyg.onrender.com/api'; // Replace with your backend URL

// 'https://consultation-backend-nmyg.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
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

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/doctor-login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    console.log('Making login request with credentials:', {
      doctorId: credentials.doctorId,
      password: '***' // Don't log the actual password
    });
    try {
      const response = await api.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      if (!response.data.success) {
        console.error('Login failed:', response.data.message);
        throw new Error(response.data.message || 'Login failed');
      }
      
      if (!response.data.token) {
        console.error('No token in response:', response.data);
        throw new Error('No authentication token received');
      }
      
      console.log('Storing token and user data');
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response;
    } catch (error) {
      console.error('Login API error:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return api.post('/auth/logout');
  },
};

// Consultation API
export const consultationAPI = {
  create: (data) => api.post('/consultations', data),
  getAll: async (filters = {}) => {
    try {
      console.log('Fetching consultations with filters:', filters);
      const response = await api.get('/consultations', { params: filters });
      console.log('Consultations response:', response.data);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching consultations:', error.response?.data || error.message);
      throw error;
    }
  },
  getById: (id) => api.get(`/consultations/${id}`),
  update: (id, data) => api.put(`/consultations/${id}`, data),
  delete: (id) => api.delete(`/consultations/${id}`),
  uploadVideo: (formData, onUploadProgress) =>
    api.post('/consultations/upload-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  getVideoUrl: (path) => api.get(`/consultations/video/${path}`),
};

export default api;
