'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { useAuth } from '@/app/store/auth.store';

interface OrderItem {
  id?: string;
  quantity: number;
  price?: number;
  service?: {
    id?: string;
    name?: string;
  };
  provider?: {
    id?: string;
    displayName?: string;
    price?: number;
  };
}

interface OrderDetails {
  id: string;
  status?: string;
  customerId?: string;
  customer?: {
    id?: string;
    email?: string;
    displayName?: string;
  };
  totalPrice?: number;
  items?: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

interface OrderDetailsClientProps {
  orderId: string;
}

export function OrderDetailsClient({ orderId }: OrderDetailsClientProps) {
  const router = useRouter();
  const { user, token, isLoading } = useAuth((state) => ({
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
  }));

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!token || !user) {
      router.replace('/signin');
      return;
    }

    if (user.role !== 'CUSTOMER') {
      router.replace('/');
      return;
    }

    const fetchOrder = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const response = await api.get<OrderDetails>(`/orders/${orderId}`);
        const fetchedOrder = response.data;

        if (fetchedOrder.customer?.email && fetchedOrder.customer.email !== user.email) {
          setError('У вас нет доступа к этому заказу.');
          router.replace('/');
          return;
        }

        setOrder({ ...fetchedOrder, items: fetchedOrder.items ?? [] });
      } catch (fetchError) {
        console.error('Failed to load order', fetchError);
        setError('Не удалось загрузить заказ. Попробуйте обновить страницу.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchOrder();
  }, [isLoading, token, user, router, orderId]);

  const totalAmount = useMemo(() => {
    if (order?.totalPrice !== undefined) {
      return order.totalPrice;
    }

    if (!order?.items) {
      return 0;
    }

    return order.items.reduce((sum, item) => {
      const unitPrice = item.price ?? item.provider?.price ?? 0;
      return sum + unitPrice * item.quantity;
    }, 0);
  }, [order]);

  if (isLoading || isFetching) {
    return <div className="p-6">Загрузка данных заказа...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <p className="text-red-600">{error}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          На главную
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-red-600">Информация о заказе недоступна.</div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Заказ № {order.id}</h1>
        <div className="text-sm text-muted-foreground">
          <p>Статус: {order.status ?? 'не указан'}</p>
          {order.createdAt ? <p>Создан: {new Date(order.createdAt).toLocaleString('ru-RU')}</p> : null}
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Состав заказа</h2>
        <ul className="space-y-3">
          {(order.items ?? []).map((item) => (
            <li
              key={item.id ?? `${item.service?.id}-${item.provider?.id}`}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-base font-semibold">{item.service?.name ?? 'Услуга'}</p>
                  <p className="text-sm text-muted-foreground">
                    Исполнитель: {item.provider?.displayName ?? '—'}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>Количество: {item.quantity}</p>
                  <p>
                    Цена за единицу:{' '}
                    {(item.price ?? item.provider?.price ?? 0).toLocaleString('ru-RU')} ₽
                  </p>
                  <p className="font-semibold">
                    Сумма: {((item.price ?? item.provider?.price ?? 0) * item.quantity).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Итоговая стоимость</span>
          <span>{totalAmount.toLocaleString('ru-RU')} ₽</span>
        </div>
      </section>

      <div>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium transition hover:border-slate-300 hover:bg-slate-100"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
