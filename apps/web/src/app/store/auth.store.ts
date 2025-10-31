import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import { useNotificationsStore } from './notifications.store';

// 1. Определяем типы
interface AuthUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'PROVIDER';
}

interface AuthMeResponse {
  sub: string;
  email: string;
  role: 'CUSTOMER' | 'PROVIDER';
}

interface AuthState {
  user: AuthUser | undefined; // Может быть объектом или undefined
  token: string | undefined;
  isLoading: boolean; // <--- ДОБАВЛЯЕМ НОВОЕ ПОЛЕ В ИНТЕРФЕЙС
  login: (data: { user: AuthUser; token: string }) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  rehydrate: () => void;
}

// 2. Создаем store с исправленной логикой
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: undefined,
      token: undefined,
      isLoading: true, // <--- НАЧАЛЬНОЕ СОСТОЯНИЕ - ЗАГРУЗКА
      login: (data) => {
        set({ user: data.user, token: data.token, isLoading: false });
        void useNotificationsStore.getState().fetchNotifications();
      },

      logout: () => {
        useNotificationsStore.getState().clear();
        set({ user: undefined, token: undefined });
      },

      fetchUser: async () => {
        const token = get().token;

        if (!token) {
          useNotificationsStore.getState().clear();
          set({ isLoading: false, user: undefined }); // <-- ИСПРАВЛЕНО: undefined вместо null
          return;
        }

        // Не выставляем isLoading: true здесь, т.к. rehydrate уже это сделал
        try {
          const response = await api.get<AuthMeResponse>('/auth/me'); // Указываем тип ответа
          const user = response.data;
          if (user && user.email && user.role && user.sub) {
            set({
              user: { id: user.sub, email: user.email, role: user.role },
              isLoading: false,
            });
            await useNotificationsStore.getState().fetchNotifications();
          } else {
            get().logout();
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to fetch user, token might be invalid:', error);
          get().logout();
          set({ isLoading: false });
        }
      },

      rehydrate: () => {
        // Эта функция будет вызвана один раз при старте приложения.
        // Zustand persist middleware к этому моменту уже восстановит токен.
        // Ставим isLoading в true, т.к. сейчас начнется проверка токена.
        set({ isLoading: true });
        get().fetchUser();
      },
    }),
    {
      name: 'auth-storage', // Имя для localStorage
      storage: createJSONStorage(() => localStorage),
      // Мы хотим хранить в localStorage только токен
      partialize: (state) => ({ token: state.token }),
    }
  )
);
