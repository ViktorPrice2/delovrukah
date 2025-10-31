"use client";

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import type { ProviderPriceCategory } from '@/app/store/provider.store';

export interface ProviderPriceUpdatePayload {
  serviceTemplateVersionId: string;
  price: number | null;
}

type PriceFormValues = Record<string, string>;

interface PriceManagementFormProps {
  catalog: ProviderPriceCategory[];
  isSubmitting: boolean;
  onSubmit: (updates: ProviderPriceUpdatePayload[]) => Promise<void> | void;
}

const mapCatalogToFields = (
  catalog: ProviderPriceCategory[],
): Record<string, string> => {
  const fields: Record<string, string> = {};

  catalog.forEach((category) => {
    category.services.forEach((service) => {
      fields[service.id] =
        service.providerPrice === undefined || service.providerPrice === null
          ? ''
          : String(service.providerPrice);
    });
  });

  return fields;
};

export function PriceManagementForm({
  catalog,
  isSubmitting,
  onSubmit,
}: PriceManagementFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isDirty, dirtyFields },
  } = useForm<PriceFormValues>({
    defaultValues: {},
    mode: 'onChange',
  });

  const fieldValues = useMemo(() => mapCatalogToFields(catalog), [catalog]);

  useEffect(() => {
    reset(fieldValues);
  }, [fieldValues, reset]);

  const submitHandler = handleSubmit(async () => {
    const currentValues = getValues();
    const dirtyEntries = Object.entries(dirtyFields) as Array<[string, boolean]>;
    const updates = dirtyEntries.reduce<ProviderPriceUpdatePayload[]>((acc, [serviceVersionId, isFieldDirty]) => {
      if (!isFieldDirty) {
        return acc;
      }

      const value = currentValues[serviceVersionId] ?? '';
      const initialValue = fieldValues[serviceVersionId] ?? '';

      const normalizedValue = value === '' ? null : Number(value);
      if (normalizedValue !== null && Number.isNaN(normalizedValue)) {
        return acc;
      }

      const normalizedInitial = initialValue === '' ? null : Number(initialValue);
      if (normalizedValue === normalizedInitial) {
        return acc;
      }

      acc.push({ serviceTemplateVersionId: serviceVersionId, price: normalizedValue });
      return acc;
    }, []);

    await onSubmit(updates);
  });

  const hasCatalog = catalog.length > 0;

  if (!hasCatalog) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Каталог услуг пока пуст. Добавьте услуги, чтобы задать цены.
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={submitHandler}>
      {catalog.map((category) => {
        const services = category.services;

        return (
          <section key={category.id} className="space-y-4">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                {category.name}
              </h2>
              <p className="text-sm text-slate-500">
                Установите стоимость для каждой услуги из категории.
              </p>
            </header>

            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">
                      {service.name}
                    </p>
                    {(service.minPrice !== undefined ||
                      service.maxPrice !== undefined) && (
                      <p className="text-xs text-slate-500">
                        {service.minPrice !== undefined && service.maxPrice !== undefined
                          ? `Диапазон: ${service.minPrice}–${service.maxPrice} ₽`
                          : service.minPrice !== undefined
                            ? `Минимум: ${service.minPrice} ₽`
                            : `Максимум: ${service.maxPrice} ₽`}
                      </p>
                    )}
                  </div>

                  <label className="flex w-full flex-col gap-2 text-sm text-slate-600 sm:w-56">
                    Цена исполнителя, ₽
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-base font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                      placeholder="—"
                      {...register(service.id)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 enabled:focus-visible:outline enabled:focus-visible:outline-2 enabled:focus-visible:outline-offset-2 enabled:focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? 'Сохранение…' : 'Сохранить изменения'}
        </button>
      </div>
    </form>
  );
}

