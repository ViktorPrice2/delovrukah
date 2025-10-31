"use client";

import { useEffect, useMemo, useState } from 'react';

import { PriceManagementForm } from '@/app/components/profile/PriceManagementForm';
import type { ProviderPriceUpdatePayload } from '@/app/components/profile/PriceManagementForm';
import { useProviderStore } from '@/app/store/provider.store';
import { api } from '@/lib/api';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  type: ToastType;
  message: string;
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-emerald-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-slate-900 text-white',
};

const skeletonServices = Array.from({ length: 3 });

function CatalogSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, index) => (
        <section key={index} className="space-y-4">
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-slate-200" />
            <div className="h-4 w-72 rounded bg-slate-200" />
          </div>

          <div className="space-y-3">
            {skeletonServices.map((__, serviceIndex) => (
              <div
                key={serviceIndex}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-slate-200" />
                  <div className="h-3 w-32 rounded bg-slate-100" />
                </div>
                <div className="h-11 w-full rounded-lg bg-slate-100 sm:w-56" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function ProviderPricesPage() {
  const priceCatalog = useProviderStore((state) => state.priceCatalog);
  const fetchPriceCatalog = useProviderStore((state) => state.fetchPriceCatalog);
  const isPriceCatalogLoading = useProviderStore((state) => state.isPriceCatalogLoading);
  const priceCatalogError = useProviderStore((state) => state.priceCatalogError);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    fetchPriceCatalog();
  }, [fetchPriceCatalog]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const isInitialLoading = isPriceCatalogLoading && priceCatalog.length === 0 && !priceCatalogError;
  const isRefreshing = isPriceCatalogLoading && priceCatalog.length > 0;

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
  };

  const handleSubmit = async (updates: ProviderPriceUpdatePayload[]) => {
    if (updates.length === 0) {
      showToast('info', 'Изменений не обнаружено');
      return;
    }

    setIsSaving(true);
    try {
      await api.put('/provider/prices', { prices: updates });
      showToast('success', 'Цены успешно сохранены');
      await fetchPriceCatalog();
    } catch (error) {
      console.error('Failed to save provider prices', error);
      showToast('error', 'Не удалось сохранить цены');
    } finally {
      setIsSaving(false);
    }
  };

  const errorCard = useMemo(() => {
    if (!priceCatalogError) {
      return null;
    }

    if (priceCatalog.length > 0) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {priceCatalogError}
        </div>
      );
    }

    return (
      <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-red-700">Не удалось загрузить каталог цен</h2>
          <p className="text-sm text-red-600">Проверьте соединение с интернетом и попробуйте снова.</p>
        </div>
        <button
          type="button"
          onClick={() => fetchPriceCatalog()}
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          Повторить попытку
        </button>
      </div>
    );
  }, [fetchPriceCatalog, priceCatalog.length, priceCatalogError]);

  return (
    <div className="relative space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Управление ценами</h1>
        <p className="text-sm text-slate-600">
          Настройте собственные цены на услуги, чтобы клиенты видели актуальную стоимость ваших работ.
        </p>
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

      {!isInitialLoading && priceCatalog.length > 0 && (
        <div className="space-y-4">
          {isRefreshing && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Обновляем каталог услуг…
            </div>
          )}

          <PriceManagementForm
            catalog={priceCatalog}
            isSubmitting={isSaving}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {!isInitialLoading && priceCatalog.length === 0 && !priceCatalogError && (
        <PriceManagementForm catalog={priceCatalog} isSubmitting={isSaving} onSubmit={handleSubmit} />
      )}
    </div>
  );
}

