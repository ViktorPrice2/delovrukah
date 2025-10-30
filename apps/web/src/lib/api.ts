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
    // Мы используем Zustand, поэтому будем брать токен из него, а не напрямую из localStorage.
    // Пока оставим так, но в будущем улучшим.
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth-token')
      : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);