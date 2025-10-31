"use client";

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

type StatusStyle = {
  label: string;
  badge: string;
  dot: string;
};

const statusStyles: Record<string, StatusStyle> = {
  NEW: {
    label: "Новый",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100",
    dot: "bg-sky-500",
  },
  IN_PROGRESS: {
    label: "В работе",
    badge: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100",
    dot: "bg-indigo-500",
  },
  COMPLETED: {
    label: "Завершен",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Отменен",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100",
    dot: "bg-rose-500",
  },
};

const resolveStatusStyle = (status?: string): StatusStyle => {
  if (!status) {
    return {
      label: "Без статуса",
      badge: "bg-neutral-100 text-neutral-500 ring-1 ring-inset ring-neutral-200",
      dot: "bg-neutral-400",
    };
  }

  return statusStyles[status] ?? {
    label: status,
    badge: "bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-200",
    dot: "bg-neutral-400",
  };
};

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

    if (user.role !== "CUSTOMER" && user.role !== "PROVIDER") {
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
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Ваши заказы
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">Центр управления заказами</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Следите за статусом заказов, узнавайте об обновлениях и мгновенно переходите к диалогам с исполнителями.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-col sm:items-end">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-xs uppercase text-slate-400">Всего</p>
              <p className="text-lg font-semibold text-slate-900">{sortedOrders.length}</p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 px-4 py-3 text-center shadow-sm">
              <p className="text-xs uppercase text-indigo-500">Активные</p>
              <p className="text-lg font-semibold text-indigo-700">
                {sortedOrders.filter((order) => order.status !== "COMPLETED" && order.status !== "CANCELLED").length}
              </p>
            </div>
          </div>
        </header>

        {isLoading || isFetching ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500 shadow-sm">
            Загрузка списка заказов...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        ) : null}

        {!isFetching && !error && sortedOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-12 text-center text-sm text-slate-500 shadow-sm">
            У вас пока нет заказов. Оформите первый заказ, чтобы увидеть его здесь.
          </div>
        ) : null}

        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sortedOrders.map((order) => {
            const createdAtLabel = order.createdAt
              ? new Date(order.createdAt).toLocaleString("ru-RU")
              : "Дата не указана";
            const amountLabel =
              order.totalPrice !== undefined ? `${order.totalPrice.toLocaleString("ru-RU")} ₽` : "—";
            const { badge, dot, label } = resolveStatusStyle(order.status);

            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="group flex h-full flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-600">
                        №
                      </span>
                      Заказ {order.id}
                    </span>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${badge}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                      {label}
                    </span>
                  </div>

                  <dl className="space-y-3 text-sm text-slate-600">
                    <div className="flex flex-col gap-1">
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Создан</dt>
                      <dd className="text-base font-medium text-slate-900">{createdAtLabel}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Сумма заказа</dt>
                      <dd className="text-base font-semibold text-slate-900">{amountLabel}</dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex items-center justify-between text-xs font-medium text-indigo-600">
                    <span className="inline-flex items-center gap-2">
                      Перейти к деталям
                      <span className="transition group-hover:translate-x-1">→</span>
                    </span>
                    <span className="text-slate-400">{label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
