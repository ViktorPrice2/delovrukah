'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { useAuth } from '@/app/store/auth.store';
import { useCartStore } from '@/app/store/cart.store';

interface CreateOrderPayload {
  services: Array<{
    providerId: string;
    serviceTemplateVersionId: string;
    quantity: number;
  }>;
}

interface CreateOrderResponse {
  id?: string;
  order?: {
    id: string;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth((state) => ({
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
  }));

  const { items, updateItemQuantity, removeItem, clearCart } = useCartStore((state) => ({
    items: state.items,
    updateItemQuantity: state.updateItemQuantity,
    removeItem: state.removeItem,
    clearCart: state.clearCart,
  }));

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!token || !user || user.role !== 'CUSTOMER') {
      router.replace('/signin');
    }
  }, [isLoading, token, user, router]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.provider.price * item.quantity, 0),
    [items],
  );

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>;
  }

  if (!token || !user || user.role !== 'CUSTOMER') {
    return null;
  }

  const handleQuantityChange = (serviceId: string, providerId: string, value: string) => {
    const quantity = Number.parseInt(value, 10);
    if (Number.isNaN(quantity)) {
      return;
    }
    updateItemQuantity(serviceId, providerId, quantity);
  };

  const handleSubmit = async () => {
    if (items.length === 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const servicesPayload = items.map((item) => {
        const serviceTemplateVersionId = item.service.latestVersion?.id;

        if (!serviceTemplateVersionId) {
          throw new Error(
            `Не удалось определить активную версию услуги "${item.service.name}".`,
          );
        }

        return {
          providerId: item.provider.id,
          serviceTemplateVersionId,
          quantity: item.quantity,
        };
      });

      const payload: CreateOrderPayload = {
        services: servicesPayload,
      };

      const response = await api.post<CreateOrderResponse>('/orders', payload);
      const orderId = response.data?.id ?? response.data?.order?.id;

      if (!orderId) {
        throw new Error('Не удалось определить номер заказа.');
      }

      clearCart();
      router.push(`/orders/${orderId}`);
    } catch (error) {
      console.error('Failed to create order', error);
      setSubmitError('Не удалось оформить заказ. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Оформление заказа</h1>
        <p className="text-sm text-muted-foreground">
          Проверьте состав заказа и укажите необходимое количество для каждой услуги.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Ваша корзина пуста.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Вернитесь в каталог и добавьте услуги в корзину.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            К каталогу услуг
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={`${item.service.id}-${item.provider.id}`}
                className="rounded-lg border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold">{item.service.name}</h2>
                    <p className="text-sm text-muted-foreground">Исполнитель: {item.provider.displayName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-base font-semibold">
                      {item.provider.price.toLocaleString('ru-RU')} ₽ за единицу
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      Количество:
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) =>
                          handleQuantityChange(item.service.id, item.provider.id, event.target.value)
                        }
                        className="w-20 rounded-md border px-2 py-1 text-base"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeItem(item.service.id, item.provider.id)}
                      className="text-sm text-red-600 transition hover:text-red-500"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm font-medium">
                  <span>Промежуточный итог</span>
                  <span>{(item.provider.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Итого к оплате</span>
              <span>{totalAmount.toLocaleString('ru-RU')} ₽</span>
            </div>
            {submitError ? (
              <p className="mt-3 text-sm text-red-600">{submitError}</p>
            ) : null}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-base font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Оформляем...' : 'Оформить заказ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
