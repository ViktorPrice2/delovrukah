import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';

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
  unreadCount: number;
  login: (data: { user: AuthUser; token: string }) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  incrementUnreadCount: (delta?: number) => void;
  decrementUnreadCount: (delta?: number) => void;
  rehydrate: () => void;
}

// 2. Создаем store с исправленной логикой
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: undefined,
      token: undefined,
      isLoading: true, // <--- НАЧАЛЬНОЕ СОСТОЯНИЕ - ЗАГРУЗКА
      unreadCount: 0,

      login: (data) => {
        set({ user: data.user, token: data.token, isLoading: false });
        void get().fetchUnreadCount();
      },

      logout: () => set({ user: undefined, token: undefined, unreadCount: 0 }),

      fetchUser: async () => {
        const token = get().token;

        if (!token) {
          set({ isLoading: false, user: undefined, unreadCount: 0 }); // <-- ИСПРАВЛЕНО: undefined вместо null
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
            await get().fetchUnreadCount();
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

      fetchUnreadCount: async () => {
        const token = get().token;

        if (!token) {
          set({ unreadCount: 0 });
          return;
        }

        try {
          const response = await api.get<{ unreadCount: number }>(
            '/auth/me/notifications/unread-count',
          );
          const unreadCount = Number(response.data?.unreadCount ?? 0);
          set({ unreadCount: unreadCount >= 0 ? unreadCount : 0 });
        } catch (error) {
          console.error('Failed to fetch unread notifications count:', error);
        }
      },

      incrementUnreadCount: (delta = 1) =>
        set((state) => ({ unreadCount: state.unreadCount + Math.max(delta, 0) })),

      decrementUnreadCount: (delta = 1) =>
        set((state) => ({
          unreadCount: Math.max(0, state.unreadCount - Math.max(delta, 0)),
        })),

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
