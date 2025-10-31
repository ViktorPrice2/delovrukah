'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { useAuth } from "@/app/store/auth.store";

interface OrderSummary {
  id: string;
  status?: string;
  createdAt?: string;
  totalPrice?: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth((state) => ({
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
  }));

  const [orders, setOrders] = useState<OrderSummary[]>([]);
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

    if (user.role !== "CUSTOMER") {
      router.replace("/");
      return;
    }

    const fetchOrders = async () => {
      setIsFetching(true);
      setError(null);

      try {
        const response = await api.get<OrderSummary[]>("/orders");
        setOrders(response.data ?? []);
      } catch (fetchError) {
        console.error("Failed to load orders", fetchError);
        setError("Не удалось загрузить список заказов. Попробуйте обновить страницу.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchOrders();
  }, [isLoading, router, token, user]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [orders]);

  return (
    <section className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Мои заказы</h1>
        <p className="text-sm text-neutral-500">
          Здесь отображаются все ваши активные и завершенные заказы.
        </p>
      </header>

      {isLoading || isFetching ? (
        <div className="rounded-lg border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
          Загрузка списка заказов...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {!isFetching && !error && sortedOrders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
          У вас пока нет заказов. Оформите первый заказ, чтобы увидеть его здесь.
        </div>
      ) : null}

      <ul className="space-y-3">
        {sortedOrders.map((order) => {
          const createdAtLabel = order.createdAt
            ? new Date(order.createdAt).toLocaleString("ru-RU")
            : "Дата не указана";

          return (
            <li key={order.id} className="rounded-lg border bg-white p-4 shadow-sm transition hover:border-indigo-200">
              <Link href={`/orders/${order.id}`} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Заказ № {order.id}</span>
                  <span className="text-sm text-neutral-500">{createdAtLabel}</span>
                </div>
                <div className="flex flex-col gap-1 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
                  <span>Статус: {order.status ?? "не указан"}</span>
                  <span>
                    Сумма: {order.totalPrice !== undefined ? `${order.totalPrice.toLocaleString("ru-RU")} ₽` : "не указана"}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
