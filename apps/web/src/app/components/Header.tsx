'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import CurrentCityDisplay from './CurrentCityDisplay';
import { useAuth } from '../store/auth.store';

export default function Header() {
  const { user, isLoading, logout } = useAuth((state) => ({
    user: state.user,
    isLoading: state.isLoading,
    logout: state.logout,
  }));

  const profileHref = useMemo(() => {
    if (!user) {
      return '/profile';
    }

    switch (user.role) {
      case 'CUSTOMER':
      case 'PROVIDER':
        return '/profile';
      default:
        return '/profile';
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="text-xl font-semibold">
            Delovrukah.ru
          </Link>
          <CurrentCityDisplay />
        </div>
        <nav className="flex items-center gap-3 text-sm font-medium">
          {!isLoading && !user ? (
            <>
              <Link
                href="/signin"
                className="rounded-md border border-slate-200 px-4 py-2 transition hover:border-slate-300 hover:bg-slate-100"
              >
                Войти
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-500"
              >
                Регистрация
              </Link>
            </>
          ) : null}

          {!isLoading && user ? (
            <>
              <Link
                href={profileHref}
                className="rounded-md border border-transparent px-4 py-2 transition hover:border-slate-200 hover:bg-slate-100"
              >
                Профиль
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-slate-200 px-4 py-2 transition hover:border-slate-300 hover:bg-slate-100"
              >
                Выйти
              </button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
