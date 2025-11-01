'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CurrentCityDisplay from './CurrentCityDisplay';
import { useAuth } from '../store/auth.store';
import { useCartStore } from '../store/cart.store';
import { useNotificationsStore } from '../store/notifications.store';

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

function MessagesIcon() {
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
        d="M3 6.75A2.75 2.75 0 0 1 5.75 4h12.5A2.75 2.75 0 0 1 21 6.75v10.5A2.75 2.75 0 0 1 18.25 20H5.75A2.75 2.75 0 0 1 3 17.25z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
    </svg>
  );
}

export default function Header() {
  const { user, isLoading, logout } = useAuth((state) => ({
    user: state.user,
    isLoading: state.isLoading,
    logout: state.logout,
  }));
  const { summary, fetchNotifications } = useNotificationsStore((state) => ({
    summary: state.data,
    fetchNotifications: state.fetchNotifications,
  }));
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

  const [isDropdownExpanded, setIsDropdownExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const isDropdownOpen = Boolean(user) && isDropdownExpanded;

  const closeDropdown = useCallback(() => {
    setIsDropdownExpanded(false);
  }, []);

  const toggleDropdown = useCallback(() => {
    if (!user) {
      return;
    }

    setIsDropdownExpanded((prev) => !prev);
  }, [user]);

  useEffect(() => {
    if (!user || summary) {
      return;
    }

    void fetchNotifications();
  }, [user, summary, fetchNotifications]);

  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }

      closeDropdown();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen, closeDropdown]);

  const notificationsSummary = summary ?? {
    totalUnreadCount: 0,
    ordersWithUnread: [],
  };
  const totalUnreadCount = notificationsSummary.totalUnreadCount;
  const ordersWithUnread = notificationsSummary.ordersWithUnread;

  const profileHref = useMemo(() => {
    if (!user) {
      return '/profile';
    }

    if (user.role === 'PROVIDER') {
      return '/profile';
    }

    if (user.role === 'ADMIN') {
      return '/admin';
    }

    return '/orders';
  }, [user]);
  const isProvider = user?.role === 'PROVIDER';
  const isAdmin = user?.role === 'ADMIN';

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
          {user ? (
            <div className="relative">
              <button
                ref={triggerRef}
                type="button"
                onClick={toggleDropdown}
                className="relative inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-slate-100"
                aria-label="Сообщения"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
              >
                <span className="relative inline-flex items-center">
                  <MessagesIcon />
                  {totalUnreadCount > 0 ? (
                    <span className="absolute -right-2 -top-2 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[0.625rem] font-semibold leading-none text-white">
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                  ) : null}
                </span>
                <span className="hidden sm:inline">Сообщения</span>
              </button>

              {isDropdownOpen ? (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                >
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-medium text-slate-700">
                      Всего непрочитанных:{' '}
                      <span className="font-semibold text-slate-900">
                        {totalUnreadCount}
                      </span>
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {ordersWithUnread.length > 0 ? (
                      <ul className="divide-y divide-slate-100">
                        {ordersWithUnread.map((order) => (
                          <li key={order.orderId}>
                            <Link
                              href={`/orders/${order.orderId}`}
                              className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-slate-50"
                              onClick={closeDropdown}
                            >
                              <span className="font-medium text-slate-800">
                                {order.orderNumber}
                              </span>
                              <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                {order.unreadInOrder}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-4 py-3 text-sm text-slate-500">
                        Нет непрочитанных сообщений
                      </p>
                    )}
                  </div>
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-right">
                    <Link
                      href="/orders"
                      className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500"
                      onClick={closeDropdown}
                    >
                      Все чаты
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/signin"
              className="relative inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-slate-100"
              aria-label="Сообщения"
            >
              <span className="relative inline-flex items-center">
                <MessagesIcon />
              </span>
              <span className="hidden sm:inline">Сообщения</span>
            </Link>
          )}
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
              {isProvider ? (
                <Link
                  href="/orders"
                  className="rounded-md border border-transparent px-4 py-2 transition hover:border-slate-200 hover:bg-slate-100"
                >
                  Мои заказы
                </Link>
              ) : null}
              {isAdmin ? (
                <Link
                  href="/admin/services"
                  className="rounded-md border border-transparent px-4 py-2 transition hover:border-slate-200 hover:bg-slate-100"
                >
                  Панель
                </Link>
              ) : null}
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
