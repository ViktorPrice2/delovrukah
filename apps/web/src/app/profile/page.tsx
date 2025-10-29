"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/app/store/auth.store";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isHydrated, logout } = useAuthStore((state) => ({
    user: state.user,
    token: state.token,
    isHydrated: state.isHydrated,
    logout: state.logout,
  }));

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace("/signin");
    }
  }, [isHydrated, token, router]);

  if (!isHydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 text-sm text-neutral-500">
        Загрузка профиля...
      </main>
    );
  }

  if (!token || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 text-sm text-neutral-500">
        Перенаправление...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <section className="flex w-full max-w-2xl flex-col gap-8 rounded-2xl border border-neutral-200 bg-white/80 p-10 shadow-sm backdrop-blur">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Ваш аккаунт
          </p>
          <h1 className="text-3xl font-semibold text-neutral-900">Профиль</h1>
          <p className="text-sm text-neutral-500">
            Здесь отображаются основные данные, полученные при аутентификации.
          </p>
        </header>

        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-neutral-50/60 p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Email
            </dt>
            <dd className="text-base font-medium text-neutral-900">{user.email}</dd>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-neutral-50/60 p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Роль
            </dt>
            <dd className="text-base font-medium text-neutral-900">
              {user.role ?? "Не указана"}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-neutral-500">
            Хотите выйти из аккаунта?
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/signin");
            }}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
          >
            Выйти
          </button>
        </div>
      </section>
    </main>
  );
}
