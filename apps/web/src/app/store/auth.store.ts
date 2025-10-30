// apps/web/src/app/store/auth.store.ts
"use client";

import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import { api } from '@/lib/api';

// Определяем, как выглядит объект пользователя
export interface AuthUser {
  email: string | null;
  role: 'CUSTOMER' | 'PROVIDER' | null;
}

// Определяем полное состояние нашего стора
export interface AuthState {
  user: AuthUser;
  token: string | null;
  isInitialized: boolean;
  login: (data: { token: string; user: AuthUser }) => void;
  logout: () => void;
  setInitialized: (isInitialized: boolean) => void;
  fetchUser: () => Promise<void>;
}

// Создаем тип для нашего creator'а, чтобы TypeScript не путался с get() и set()
// Это говорит, что наш creator совместим с middleware 'persist'
type AuthStateCreator = StateCreator<AuthState, [], [["zustand/persist", unknown]]>;

// Логика нашего стора
const authStoreCreator: AuthStateCreator = (set, get) => ({
  user: { email: null, role: null },
  token: null,
  isInitialized: false,

  login: (data) => {
    // Явно сохраняем токен, чтобы interceptor в api.ts мог его сразу подхватить
    localStorage.setItem('auth-token', data.token);
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem('auth-token');
    set({ token: null, user: { email: null, role: null } });
  },

  setInitialized: (isInitialized: boolean) => set({ isInitialized }),

  fetchUser: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const response = await api.get('/auth/me');
      const user = response.data;
      if (user && user.email && user.role) {
        set({ user: { email: user.email, role: user.role } });
      } else {
        // Если ответ от сервера некорректный, выходим
        get().logout();
      }
    } catch (error) {
      console.error("Failed to fetch user with stored token.", error);
      get().logout();
    }
  },
});

// Настройки для middleware 'persist'
const persistOptions: PersistOptions<AuthState> = {
  name: 'auth-storage', // ключ в localStorage
  storage: createJSONStorage(() => localStorage),

  // ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ:
  // Мы возвращаем полный объект состояния, как того требует новая версия Zustand,
  // но обнуляем все поля, кроме `token`.
  // Это гарантирует, что при восстановлении сессии будут загружены только доверенные данные.
  partialize: (state) => ({
    ...state,
    user: { email: null, role: null },
    isInitialized: false,
  }),
};

// Создаем и экспортируем наш стор
export const useAuthStore = create<AuthState>()(
  persist(authStoreCreator, persistOptions)
);