/**
 * Centralized Axios Instance
 * 
 * Configured with authentication interceptors using auth storage utilities.
 */

import axios from 'axios';
import { authStorage } from '@/features/auth/utils/storage';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
axiosInstance.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const fullUrl = error.config?.baseURL 
        ? `${error.config.baseURL}${url}` 
        : url;
      
      // Don't auto-redirect for login and change-password endpoints
      // These endpoints may return 401 for validation errors (wrong password, etc.)
      // and should be handled by the component, not the interceptor
      const shouldSkipRedirect = 
        fullUrl.includes('/auth/login') || 
        fullUrl.includes('/auth/change-password') || 
        fullUrl.includes('/change-password') ||
        url.includes('/auth/login') || 
        url.includes('/auth/change-password') || 
        url.includes('/change-password');
      
      if (shouldSkipRedirect) {
        // Let the component handle the error without auto-redirect
        return Promise.reject(error);
      }
      
      // For other 401 errors (token expired, etc.), auto-redirect to login
      authStorage.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

