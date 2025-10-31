import axios from 'axios';

import { getApiBaseUrl } from './get-api-base-url';

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        const persistedAuth = localStorage.getItem('auth-storage');
        if (persistedAuth) {
          const parsed = JSON.parse(persistedAuth);
          const token = parsed?.state?.token as string | undefined;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.warn('Failed to read auth token from storage', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);