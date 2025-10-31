"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { useAuth } from "@/app/store/auth.store";

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
  className?: string;
}

const statusLabelMap: Record<string, string> = {
  NEW: "Новый",
  IN_PROGRESS: "В работе",
  COMPLETED: "Завершен",
  CANCELLED: "Отменен",
};

export function OrderDetailsClient({ orderId, className }: OrderDetailsClientProps) {
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
      router.replace("/signin");
      return;
    }

    const isCustomerOrProvider =
      user.role === "CUSTOMER" || user.role === "PROVIDER";

    if (!isCustomerOrProvider) {
      router.replace("/");
      return;
    }

    const fetchOrder = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const response = await api.get<OrderDetails>(`/orders/${orderId}`);
        const fetchedOrder = response.data;

        if (
          user.role === "CUSTOMER" &&
          fetchedOrder.customer?.email &&
          fetchedOrder.customer.email !== user.email
        ) {
          setError("У вас нет доступа к этому заказу.");
          router.replace("/");
          return;
        }

        setOrder({ ...fetchedOrder, items: fetchedOrder.items ?? [] });
      } catch (fetchError) {
        console.error("Failed to load order", fetchError);
        setError("Не удалось загрузить заказ. Попробуйте обновить страницу.");
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

  const wrapperClassName = className
    ? `${className} flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5`
    : "flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5";

  if (isLoading || isFetching) {
    return (
      <div className={wrapperClassName}>
        <div className="h-6 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={wrapperClassName}>
        <p className="text-sm text-rose-600">{error}</p>
        <Link
          href="/orders"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Вернуться к списку заказов
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={wrapperClassName}>
        <p className="text-sm text-rose-600">Информация о заказе недоступна.</p>
      </div>
    );
  }

  const statusLabel = statusLabelMap[order.status ?? ""] ?? order.status ?? "Без статуса";
  const createdAtLabel = order.createdAt
    ? new Date(order.createdAt).toLocaleString("ru-RU")
    : "Дата не указана";
  const updatedAtLabel = order.updatedAt
    ? new Date(order.updatedAt).toLocaleString("ru-RU")
    : null;

  return (
    <article className={wrapperClassName}>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Заказ</p>
        <h1 className="text-2xl font-semibold text-slate-900">Заказ № {order.id}</h1>
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 px-3 py-1 text-xs font-medium text-indigo-700">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          {statusLabel}
        </div>
      </header>

      <dl className="grid gap-4 text-sm text-slate-600">
        <div className="flex flex-col gap-1">
          <dt className="text-xs uppercase tracking-wide text-slate-400">Создан</dt>
          <dd className="text-base font-medium text-slate-900">{createdAtLabel}</dd>
        </div>
        {updatedAtLabel ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-slate-400">Обновлен</dt>
            <dd className="text-base font-medium text-slate-900">{updatedAtLabel}</dd>
          </div>
        ) : null}
        {order.customer?.displayName || order.customer?.email ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-slate-400">Клиент</dt>
            <dd className="text-base font-medium text-slate-900">
              {order.customer?.displayName ?? order.customer?.email}
            </dd>
          </div>
        ) : null}
      </dl>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Состав заказа</h2>
        <ul className="flex flex-col gap-3">
          {(order.items ?? []).map((item) => {
            const unitPrice = item.price ?? item.provider?.price ?? 0;
            const totalPrice = unitPrice * item.quantity;
            const itemKey = item.id ?? `${item.service?.id}-${item.provider?.id}`;

            return (
              <li
                key={itemKey}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {item.service?.name ?? "Услуга"}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Исполнитель
                      </p>
                      <p className="text-sm text-slate-600">
                        {item.provider?.displayName ?? "—"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Количество</p>
                      <p className="text-base font-semibold text-slate-900">{item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                      Цена за единицу: {unitPrice.toLocaleString("ru-RU")} ₽
                    </span>
                    <span className="text-base font-semibold text-slate-900">
                      Сумма: {totalPrice.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {order.items?.length === 0 ? (
          <p className="text-sm text-slate-500">Позиции заказа отсутствуют.</p>
        ) : null}
      </section>

      <footer className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-indigo-600/10 px-4 py-3 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Итоговая стоимость</span>
          <span className="text-lg font-semibold text-indigo-700">
            {totalAmount.toLocaleString("ru-RU")} ₽
          </span>
        </div>
        <Link
          href="/orders"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
        >
          Вернуться к заказам
        </Link>
      </footer>
    </article>
  );
}
