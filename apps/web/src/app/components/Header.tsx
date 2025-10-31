'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import CurrentCityDisplay from './CurrentCityDisplay';
import { useAuth } from '../store/auth.store';
import { useCartStore } from '../store/cart.store';

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l1.68 10.04a2 2 0 0 0 1.99 1.71h8.66a2 2 0 0 0 1.98-1.65l1.02-5.66H7.16"
      />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </svg>
  );
}

export default function Header() {
  const { user, isLoading, logout } = useAuth((state) => ({
    user: state.user,
    isLoading: state.isLoading,
    logout: state.logout,
  }));
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

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
          <Link
            href="/checkout"
            className="relative inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-slate-100"
            aria-label="Корзина"
          >
            <span className="relative inline-flex items-center">
              <CartIcon />
              {cartCount > 0 ? (
                <span className="ml-1 inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full bg-indigo-600 px-2 text-xs font-semibold text-white">
                  {cartCount}
                </span>
              ) : null}
            </span>
            <span className="hidden sm:inline">Корзина</span>
          </Link>
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
