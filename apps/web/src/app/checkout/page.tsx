"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { useAuth } from "@/app/store/auth.store";
import { useCartStore } from "@/app/store/cart.store";

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

    if (!token || !user || user.role !== "CUSTOMER") {
      router.replace("/signin");
    }
  }, [isLoading, token, user, router]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.provider.price * item.quantity, 0),
    [items],
  );

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>;
  }

  if (!token || !user || user.role !== "CUSTOMER") {
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

      const response = await api.post<CreateOrderResponse>("/orders", payload);
      const orderId = response.data?.id ?? response.data?.order?.id;

      if (!orderId) {
        throw new Error("Не удалось определить номер заказа.");
      }

      clearCart();
      router.push(`/orders/${orderId}`);
    } catch (error) {
      console.error("Failed to create order", error);
      setSubmitError("Не удалось оформить заказ. Попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Оформление заказа
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Подтверждение услуг</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Проверьте состав корзины, скорректируйте количество и переходите к подтверждению заказа.
          </p>
        </header>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-700">Ваша корзина пуста</p>
            <p className="mt-2 text-sm text-slate-500">
              Вернитесь в каталог и добавьте услуги, чтобы оформить заказ.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              К каталогу услуг
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="flex flex-col gap-5">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Состав заказа</h2>
                <p className="mt-1 text-sm text-slate-500">Измените количество или удалите услуги перед подтверждением.</p>
              </div>

              <ul className="space-y-5">
                {items.map((item) => (
                  <li
                    key={`${item.service.id}-${item.provider.id}`}
                    className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-slate-900">{item.service.name}</p>
                        <p className="text-sm text-slate-500">Исполнитель: {item.provider.displayName}</p>
                        <p className="text-sm text-slate-500">
                          Стоимость единицы: {item.provider.price.toLocaleString("ru-RU")} ₽
                        </p>
                      </div>
                      <div className="flex flex-col items-stretch gap-3 text-sm text-slate-500 md:items-end">
                        <label className="flex items-center justify-between gap-3 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 md:w-48">
                          Количество
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) =>
                              handleQuantityChange(item.service.id, item.provider.id, event.target.value)
                            }
                            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-base text-slate-900 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeItem(item.service.id, item.provider.id)}
                          className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          Удалить из заказа
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                      <span>Промежуточный итог</span>
                      <span className="text-lg font-semibold text-slate-900">
                        {(item.provider.price * item.quantity).toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="lg:sticky lg:top-8">
              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-lg font-semibold text-slate-900">Итоги заказа</h2>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Услуг в корзине</span>
                    <span className="font-medium text-slate-900">{items.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Общая стоимость</span>
                    <span className="text-lg font-semibold text-indigo-700">
                      {totalAmount.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                </div>
                {submitError ? (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700">
                    {submitError}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {isSubmitting ? "Оформляем..." : "Оформить заказ"}
                </button>
                <p className="text-xs text-slate-500">
                  Нажимая «Оформить заказ», вы подтверждаете корректность данных и переходите к финальному согласованию с исполнителем.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
