"use client";

import { ReactNode, useEffect } from "react";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, AuthUser, useAuthStore } from "@/app/store/auth.store";

type AuthProviderProps = {
  children: ReactNode;
};

const readPersistedAuth = (): { token: string; user: AuthUser } | null => {
  if (typeof window === "undefined") return null;

  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  const serializedUser = window.localStorage.getItem(AUTH_USER_KEY);

  if (!token || !serializedUser) {
    return null;
  }

  try {
    const user = JSON.parse(serializedUser) as AuthUser;
    return { token, user };
  } catch (error) {
    console.warn("Не удалось распарсить пользователя из localStorage", error);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    const persistedAuth = readPersistedAuth();
    initialize(persistedAuth);
  }, [initialize]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Загрузка...
      </div>
    );
  }

  return <>{children}</>;
}
