// apps/web/src/lib/api.ts

import axios from 'axios';

// Читаем ПРАВИЛЬНОЕ имя переменной
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  console.error("NEXT_PUBLIC_API_BASE_URL is not defined in .env.local");
}

export const api = axios.create({
  baseURL: baseURL,
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