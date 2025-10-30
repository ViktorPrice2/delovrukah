// apps/web/src/app/profile/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/auth.store";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout, isInitialized } = useAuthStore();

  useEffect(() => {
    // Ждем, пока состояние не будет восстановлено из localStorage
    if (isInitialized && !token) {
      router.replace("/signin");
    }
  }, [token, isInitialized, router]);

  // Пока идет проверка, показываем заглушку
  if (!isInitialized) {
    return <div>Загрузка...</div>;
  }

  // Если после инициализации токена все еще нет, пользователь увидит редирект
  if (!token) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.replace("/signin");
  };

  return (
    <div className="container mx-auto mt-10 max-w-md text-center">
      <h1 className="text-2xl font-bold">Профиль пользователя</h1>
      <div className="mt-4 rounded-lg border bg-white p-4 text-left shadow-sm">
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Роль:</strong> {user.role}
        </p>
      </div>
      <button
        onClick={handleLogout}
        className="mt-6 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600"
      >
        Выйти
      </button>
    </div>
  );
}