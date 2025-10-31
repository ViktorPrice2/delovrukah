'use client';

import { useCallback } from 'react';

import type { Provider, ServiceDetail } from '@/app/types/catalog.types';
import { useCartStore } from '@/app/store/cart.store';

interface AddToCartButtonProps {
  service: ServiceDetail;
  provider: Provider;
  label?: string;
}

export function AddToCartButton({ service, provider, label = 'Добавить в заказ' }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = useCallback(() => {
    addItem(service, provider, 1);
  }, [addItem, service, provider]);

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="mt-3 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      {label}
    </button>
  );
}
