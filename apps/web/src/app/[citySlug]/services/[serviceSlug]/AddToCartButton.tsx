'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Provider, ServiceDetail } from '@/app/types/catalog.types';
import { useCartStore } from '@/app/store/cart.store';

interface AddToCartButtonProps {
  service: ServiceDetail;
  provider: Provider;
  label?: string;
}

type ToastState = {
  id: string;
  message: string;
};

const TOAST_DURATION = 3200;

export function AddToCartButton({ service, provider, label = 'Добавить в заказ' }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canRenderPortal = typeof document !== 'undefined';

  const isAlreadyInCart = useMemo(
    () => cartItems.some((item) => item.service.id === service.id && item.provider.id === provider.id),
    [cartItems, provider.id, service.id],
  );

  const showToast = useCallback((message: string) => {
    setToast({ id: `${provider.id}-${Date.now()}`, message });
  }, [provider.id]);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const handleAdd = useCallback(() => {
    if (isAlreadyInCart) {
      return;
    }

    addItem(service, provider, 1);
    showToast(`«${provider.displayName || 'Исполнитель'}» добавлен в заказ`);
  }, [addItem, isAlreadyInCart, provider, service, showToast]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, TOAST_DURATION);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hideToast, toast]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const buttonLabel = isAlreadyInCart ? '✓ В заказе' : label;

  const buttonClassName = useMemo(() => {
    if (isAlreadyInCart) {
      return 'mt-3 inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition';
    }

    return 'mt-3 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';
  }, [isAlreadyInCart]);

  return (
    <>
      <button
        type="button"
        onClick={handleAdd}
        disabled={isAlreadyInCart}
        aria-disabled={isAlreadyInCart}
        className={`${buttonClassName} disabled:cursor-not-allowed disabled:opacity-90`}
      >
        {buttonLabel}
      </button>

      {toast && canRenderPortal
        ? createPortal(
            <div
              className="fixed right-6 top-24 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-lg"
              role="status"
              aria-live="polite"
            >
              <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">✓</span>
              <span className="leading-5">{toast.message}</span>
              <button
                type="button"
                onClick={hideToast}
                className="ml-auto text-base font-semibold text-slate-400 transition hover:text-slate-600"
                aria-label="Закрыть уведомление"
              >
                ×
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
