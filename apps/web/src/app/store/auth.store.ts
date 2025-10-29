"use client";

import { create } from "zustand";

export interface AuthUser {
  id?: string;
  email: string;
  role?: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;
  login: (payload: { user: AuthUser; token: string; persist?: boolean }) => void;
  logout: () => void;
  initialize: (payload: { user: AuthUser; token: string } | null) => void;
}

export const AUTH_TOKEN_KEY = "delovrukah.auth.token";
export const AUTH_USER_KEY = "delovrukah.auth.user";

const persistToLocalStorage = (token: string, user: AuthUser) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

const clearLocalStorage = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  login: ({ user, token, persist = true }) => {
    if (persist) {
      persistToLocalStorage(token, user);
    }

    set({ user, token, isHydrated: true });
  },
  logout: () => {
    clearLocalStorage();
    set({ user: null, token: null, isHydrated: true });
  },
  initialize: (payload) => {
    if (payload) {
      set({ user: payload.user, token: payload.token, isHydrated: true });
      return;
    }

    set({ user: null, token: null, isHydrated: true });
  },
}));

export const selectAuth = (state: AuthState) => ({
  user: state.user,
  token: state.token,
  isHydrated: state.isHydrated,
  login: state.login,
  logout: state.logout,
});
