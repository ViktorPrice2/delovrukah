"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProviderPriceCategory } from "@/app/store/provider.store";
import { useProviderStore } from "@/app/store/provider.store";
import { api } from "@/lib/api";

type ToastType = "success" | "error" | "info";

type ToastState = {
  type: ToastType;
  message: string;
};

const toastStyles: Record<ToastType, string> = {
  success: "bg-emerald-500 text-white",
  error: "bg-red-500 text-white",
  info: "bg-slate-900 text-white",
};

const skeletonServices = ["first", "second", "third", "fourth"];

function CatalogSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
      <div className="space-y-4">
        <div className="h-11 rounded-3xl bg-slate-200" />
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {skeletonServices.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-4 py-3"
            >
              <div className="h-3 w-32 rounded bg-slate-200" />
              <div className="h-3 w-16 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-56 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-3/4 rounded bg-slate-100" />
        <div className="h-12 w-full rounded-xl bg-slate-100" />
        <div className="flex gap-3">
          <div className="h-11 flex-1 rounded-xl bg-slate-200" />
          <div className="h-11 flex-1 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

type ServiceNavItem = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  providerPrice: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
};

const formatPrice = (value: number | null | undefined) => {
  if (value == null) {
    return "—";
  }

  return new Intl.NumberFormat("ru-RU").format(value);
};

const parsePriceInput = (value: string): { value: number | null; isValid: boolean } => {
  const normalized = value.replace(",", ".").trim();

  if (normalized.length === 0) {
    return { value: null, isValid: true };
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, isValid: false };
  }

  return { value: parsed, isValid: true };
};

function mapCatalogToNavItems(catalog: ProviderPriceCategory[]): ServiceNavItem[] {
  return catalog.flatMap((category) =>
    category.services.map((service) => ({
      id: service.id,
      name: service.name,
      categoryId: category.id,
      categoryName: category.name,
      providerPrice: service.providerPrice ?? null,
      minPrice: service.minPrice ?? null,
      maxPrice: service.maxPrice ?? null,
    })),
  );
}

export default function ProviderPricesPage() {
  const priceCatalog = useProviderStore((state) => state.priceCatalog);
  const fetchPriceCatalog = useProviderStore((state) => state.fetchPriceCatalog);
  const isPriceCatalogLoading = useProviderStore((state) => state.isPriceCatalogLoading);
  const priceCatalogError = useProviderStore((state) => state.priceCatalogError);

  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState("");

  useEffect(() => {
    fetchPriceCatalog();
  }, [fetchPriceCatalog]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const isInitialLoading =
    isPriceCatalogLoading && priceCatalog.length === 0 && !priceCatalogError;
  const isRefreshing = isPriceCatalogLoading && priceCatalog.length > 0;

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
  };

  const navItems = useMemo(() => mapCatalogToNavItems(priceCatalog), [priceCatalog]);

  useEffect(() => {
    if (navItems.length === 0) {
      setSelectedServiceId(null);
      return;
    }

    setSelectedServiceId((current) => {
      if (current && navItems.some((item) => item.id === current)) {
        return current;
      }

      return navItems[0]?.id ?? null;
    });
  }, [navItems]);

  const currentService = useMemo(() => {
    if (!selectedServiceId) {
      return null;
    }

    return navItems.find((item) => item.id === selectedServiceId) ?? null;
  }, [navItems, selectedServiceId]);

  useEffect(() => {
    if (!currentService) {
      setPriceValue("");
      return;
    }

    setPriceValue(
      currentService.providerPrice == null
        ? ""
        : String(currentService.providerPrice),
    );
  }, [currentService]);

  const originalValue = currentService?.providerPrice == null
    ? ""
    : String(currentService.providerPrice);

  const { value: parsedPrice, isValid: isPriceValid } = useMemo(
    () => parsePriceInput(priceValue),
    [priceValue],
  );

  const initialPrice = currentService?.providerPrice ?? null;
  const isPriceChanged =
    currentService != null &&
    isPriceValid &&
    ((parsedPrice === null && initialPrice !== null) ||
      (parsedPrice !== null && initialPrice === null) ||
      (parsedPrice !== null && initialPrice !== null && parsedPrice !== initialPrice));

  const isResetDisabled = !currentService || priceValue === originalValue;
  const isSaveDisabled = isSaving || !currentService || !isPriceValid || !isPriceChanged;
  const priceError = isPriceValid ? null : "Введите корректную неотрицательную цену";

  const filteredCatalog = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return priceCatalog;
    }

    return priceCatalog
      .map((category) => {
        const services = category.services.filter((service) =>
          service.name.toLowerCase().includes(query),
        );

        if (services.length === 0) {
          return null;
        }

        return {
          ...category,
          services,
        } satisfies ProviderPriceCategory;
      })
      .filter((category): category is ProviderPriceCategory => Boolean(category));
  }, [priceCatalog, searchTerm]);

  const totalServicesCount = navItems.length;

  const errorCard = useMemo(() => {
    if (!priceCatalogError) {
      return null;
    }

    if (priceCatalog.length > 0) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {priceCatalogError}
        </div>
      );
    }

    return (
      <div className="space-y-4 rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-red-700">Не удалось загрузить каталог цен</h2>
          <p className="text-sm text-red-600">Проверьте соединение с интернетом и попробуйте снова.</p>
        </div>
        <button
          type="button"
          onClick={() => fetchPriceCatalog()}
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          Повторить попытку
        </button>
      </div>
    );
  }, [fetchPriceCatalog, priceCatalog.length, priceCatalogError]);

  const handleSavePrice = async () => {
    if (!currentService || !isPriceValid) {
      showToast("error", "Введите корректную цену");
      return;
    }

    if (!isPriceChanged) {
      showToast("info", "Изменений не обнаружено");
      return;
    }

    setIsSaving(true);
    try {
      await api.put("/provider/prices", {
        prices: [
          {
            serviceTemplateVersionId: currentService.id,
            price: parsedPrice,
          },
        ],
      });

      showToast("success", "Цена успешно обновлена");
      await fetchPriceCatalog();
    } catch (error) {
      console.error("Failed to save provider price", error);
      showToast("error", "Не удалось сохранить цену");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPrice = () => {
    if (!currentService) {
      return;
    }

    setPriceValue(originalValue);
  };

  return (
    <div className="relative space-y-6 pb-10">
      <header className="space-y-3">
        <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          личный кабинет мастера
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Управление ценами</h1>
          <p className="text-sm text-slate-600">
            Настройте стоимость услуг из каталога — мы покажем клиентам актуальные цены и поможем выделиться среди конкурентов.
          </p>
        </div>
        {totalServicesCount > 0 && (
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
            доступных услуг: {totalServicesCount}
          </p>
        )}
      </header>

      {toast && (
        <div
          className={`fixed right-6 top-24 z-50 flex max-w-sm items-start gap-3 rounded-xl px-4 py-3 shadow-lg ${toastStyles[toast.type]}`}
        >
          <span className="text-sm font-medium leading-5">{toast.message}</span>
          <button
            type="button"
            className="ml-auto text-sm font-semibold opacity-70 transition hover:opacity-100"
            onClick={() => setToast(null)}
            aria-label="Закрыть уведомление"
          >
            ×
          </button>
        </div>
      )}

      {isInitialLoading && (
        <div className="animate-pulse">
          <CatalogSkeleton />
        </div>
      )}

      {!isInitialLoading && errorCard}

      {!isInitialLoading && priceCatalog.length === 0 && !priceCatalogError && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Каталог пока пуст</h2>
          <p className="mt-2 text-sm text-slate-600">
            Добавьте услуги в свой профиль, чтобы указать индивидуальные цены и начать получать заказы.
          </p>
        </div>
      )}

      {!isInitialLoading && priceCatalog.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <label htmlFor="price-search" className="text-sm font-medium text-slate-700">
                Быстрый поиск услуги
              </label>
              <input
                id="price-search"
                type="search"
                placeholder="Например, монтаж розеток"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="max-h-[28rem] space-y-5 overflow-y-auto pr-1">
              {filteredCatalog.map((category) => (
                <div key={category.id} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    {category.name}
                  </p>
                  <div className="space-y-2">
                    {category.services.map((service) => {
                      const isActive = currentService?.id === service.id;
                      const servicePrice = service.providerPrice ?? null;

                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => setSelectedServiceId(service.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                            isActive
                              ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <span className="font-medium leading-5">{service.name}</span>
                          <span
                            className={`whitespace-nowrap text-xs font-semibold ${
                              isActive ? "text-white/80" : "text-slate-500"
                            }`}
                          >
                            {servicePrice == null ? "—" : `${formatPrice(servicePrice)} ₽`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredCatalog.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Услуги по запросу «{searchTerm}» не найдены.
                </div>
              )}
            </div>
          </aside>

          <section className="space-y-4">
            {isRefreshing && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Обновляем каталог услуг…
              </div>
            )}

            {currentService ? (
              <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
                    {currentService.categoryName}
                  </span>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-slate-900">{currentService.name}</h2>
                    <p className="text-sm text-slate-600">
                      Укажите стоимость, которую увидят клиенты на странице услуги. Вы всегда можете изменить её или сбросить к пустому значению.
                    </p>
                  </div>
                </div>

                <dl className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="space-y-1 rounded-2xl bg-slate-900/5 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Текущая цена
                    </dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      {initialPrice == null ? "Не указана" : `${formatPrice(initialPrice)} ₽`}
                    </dd>
                  </div>
                  <div className="space-y-1 rounded-2xl bg-slate-900/5 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Рекомендованный диапазон
                    </dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      {currentService.minPrice || currentService.maxPrice
                        ? `${currentService.minPrice ? `от ${formatPrice(currentService.minPrice)} ₽` : ""}${
                            currentService.minPrice && currentService.maxPrice ? " • " : ""
                          }${currentService.maxPrice ? `до ${formatPrice(currentService.maxPrice)} ₽` : ""}`
                        : "Скоро появится"}
                    </dd>
                  </div>
                </dl>

                <div className="space-y-2">
                  <label htmlFor="service-price" className="text-sm font-medium text-slate-900">
                    Ваша цена, ₽
                  </label>
                  <input
                    id="service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={priceValue}
                    onChange={(event) => setPriceValue(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-base font-semibold text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Например, 2500"
                  />
                  {priceError && <p className="text-xs text-red-600">{priceError}</p>}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSavePrice}
                    disabled={isSaveDisabled}
                    className="inline-flex flex-1 min-w-[160px] items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-300 enabled:hover:bg-slate-800 enabled:focus-visible:outline enabled:focus-visible:outline-2 enabled:focus-visible:outline-offset-2 enabled:focus-visible:outline-slate-900"
                  >
                    {isSaving ? "Сохранение…" : "Сохранить изменения"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceValue("")}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                  >
                    Очистить цену
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPrice}
                    disabled={isResetDisabled}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    Отменить изменения
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
                Выберите услугу слева, чтобы настроить её цену.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

