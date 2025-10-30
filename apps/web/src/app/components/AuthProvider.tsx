// apps/web/src/app/components/AuthProvider.tsx
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/store/auth.store";

function AuthInitializer() {
  // Используем селектор, чтобы достать нужные методы из стора.
  // Это гарантирует, что мы получаем актуальные версии функций.
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    const initializeAuth = async () => {
      await useAuthStore.persist.rehydrate();
      
      // Мы можем обращаться к состоянию напрямую через getState(),
      // чтобы получить самые свежие данные без лишних ререндеров.
      const token = useAuthStore.getState().token;
      if (token) {
        await fetchUser();
      }
      setInitialized(true);
    };

    initializeAuth();
  }, [setInitialized, fetchUser]);

  return null;
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthInitializer />
      {children}
    </>
  );
}