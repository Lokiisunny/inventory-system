import axios from 'axios';

// Resolve backend API URL from environment variables, fallback to local default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BASE_URL = `${API_URL}/api/v1`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productAPI = {
  getAll: (skip = 0, limit = 100) => apiClient.get(`/products?skip=${skip}&limit=${limit}`),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
};

export const customerAPI = {
  getAll: (skip = 0, limit = 100) => apiClient.get(`/customers?skip=${skip}&limit=${limit}`),
  getById: (id) => apiClient.get(`/customers/${id}`),
  create: (data) => apiClient.post('/customers', data),
  delete: (id) => apiClient.delete(`/customers/${id}`),
};

export const orderAPI = {
  getAll: (skip = 0, limit = 100) => apiClient.get(`/orders?skip=${skip}&limit=${limit}`),
  getById: (id) => apiClient.get(`/orders/${id}`),
  create: (data) => apiClient.post('/orders', data),
  delete: (id) => apiClient.delete(`/orders/${id}`),
};

export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
};

export default apiClient;
