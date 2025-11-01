"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { AdminCategory, AdminServiceTemplate, ServiceFormPayload } from "../types";

type ServiceFormProps = {
  categories: AdminCategory[];
  initialService?: AdminServiceTemplate;
  submitLabel: string;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onSubmit: (payload: ServiceFormPayload) => Promise<void>;
};

type ServiceFormState = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  medianPrice: string;
  authorId: string;
  keeperId: string;
  versionTitle: string;
  versionDescription: string;
  whatsIncludedText: string;
  whatsNotIncludedText: string;
  unitOfMeasure: string;
  requiredToolsText: string;
  customerRequirementsText: string;
  estimatedTime: string;
  maxTimeIncluded: string;
  mediaJson: string;
};

const emptyState: ServiceFormState = {
  categoryId: "",
  name: "",
  slug: "",
  description: "",
  medianPrice: "",
  authorId: "",
  keeperId: "",
  versionTitle: "",
  versionDescription: "",
  whatsIncludedText: "",
  whatsNotIncludedText: "",
  unitOfMeasure: "",
  requiredToolsText: "",
  customerRequirementsText: "",
  estimatedTime: "",
  maxTimeIncluded: "",
  mediaJson: "[]",
};

function toListText(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  return value.map((item) => String(item)).join("\n");
}

function toStringArray(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toMediaJson(value: unknown): string {
  if (!value) {
    return "[]";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[]";
  }
}

export function ServiceForm({
  categories,
  initialService,
  submitLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
}: ServiceFormProps) {
  const [state, setState] = useState<ServiceFormState>(emptyState);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialService) {
      return;
    }

    const version = initialService.latestVersion ?? initialService.versions[0];

    startTransition(() => {
      setState({
        categoryId: initialService.categoryId,
        name: initialService.name,
        slug: initialService.slug,
        description: initialService.description ?? "",
        medianPrice: initialService.medianPrice
          ? String(initialService.medianPrice)
          : "",
        authorId: initialService.authorId ?? "",
        keeperId: initialService.keeperId ?? "",
        versionTitle: version?.title ?? "",
        versionDescription: version?.description ?? "",
        whatsIncludedText: toListText(version?.whatsIncluded ?? []),
        whatsNotIncludedText: toListText(version?.whatsNotIncluded ?? []),
        unitOfMeasure: version?.unitOfMeasure ?? "",
        requiredToolsText: toListText(version?.requiredTools ?? []),
        customerRequirementsText: toListText(
          version?.customerRequirements ?? [],
        ),
        estimatedTime: version?.estimatedTime ?? "",
        maxTimeIncluded: version?.maxTimeIncluded
          ? String(version.maxTimeIncluded)
          : "",
        mediaJson: toMediaJson(version?.media ?? []),
      });
    });
  }, [initialService]);

  useEffect(() => {
    if (initialService) {
      return;
    }

    if (categories.length === 0) {
      return;
    }

    startTransition(() => {
      setState((prev) => {
        if (prev.categoryId) {
          return prev;
        }

        return { ...prev, categoryId: categories[0].id };
      });
    });
  }, [categories, initialService]);

  const handleChange = (field: keyof ServiceFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setState((prev) => ({ ...prev, [field]: value }));
    };

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.id,
      label: category.name,
    }));
  }, [categories]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!state.categoryId) {
      setFormError("Выберите категорию услуги.");
      return;
    }

    if (!state.name.trim()) {
      setFormError("Укажите название услуги.");
      return;
    }

    if (!state.slug.trim()) {
      setFormError("Укажите slug услуги.");
      return;
    }

    if (!state.versionTitle.trim()) {
      setFormError("Введите заголовок версии услуги.");
      return;
    }

    if (!state.versionDescription.trim()) {
      setFormError("Добавьте описание версии услуги.");
      return;
    }

    if (!state.unitOfMeasure.trim()) {
      setFormError("Укажите единицу измерения.");
      return;
    }

    let medianPrice: number | null | undefined;
    if (state.medianPrice.trim().length === 0) {
      medianPrice = null;
    } else {
      const parsed = Number(state.medianPrice);
      if (Number.isNaN(parsed)) {
        setFormError("Укажите корректное среднее значение цены.");
        return;
      }
      medianPrice = parsed;
    }

    let maxTimeIncluded: number | null | undefined;
    if (state.maxTimeIncluded.trim().length === 0) {
      maxTimeIncluded = null;
    } else {
      const parsed = Number(state.maxTimeIncluded);
      if (Number.isNaN(parsed)) {
        setFormError("Укажите корректное значение максимального времени.");
        return;
      }
      maxTimeIncluded = parsed;
    }

    let media: unknown[] = [];
    const mediaText = state.mediaJson.trim();
    if (mediaText.length > 0) {
      try {
        const parsed = JSON.parse(mediaText);
        if (!Array.isArray(parsed)) {
          setFormError("Поле медиа должно содержать JSON-массив.");
          return;
        }
        media = parsed;
      } catch {
        setFormError("Не удалось разобрать JSON с медиа.");
        return;
      }
    }

    const payload: ServiceFormPayload = {
      categoryId: state.categoryId,
      name: state.name.trim(),
      slug: state.slug.trim(),
      description: state.description.trim() || null,
      medianPrice,
      authorId: state.authorId.trim() || null,
      keeperId: state.keeperId.trim() || null,
      version: {
        title: state.versionTitle.trim(),
        description: state.versionDescription.trim(),
        whatsIncluded: toStringArray(state.whatsIncludedText),
        whatsNotIncluded: toStringArray(state.whatsNotIncludedText),
        unitOfMeasure: state.unitOfMeasure.trim(),
        requiredTools: toStringArray(state.requiredToolsText),
        customerRequirements: toStringArray(state.customerRequirementsText),
        estimatedTime: state.estimatedTime.trim() || null,
        maxTimeIncluded,
        media,
      },
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      if (error instanceof Error && error.message) {
        setFormError(error.message);
      } else {
        setFormError("Не удалось сохранить услугу. Попробуйте еще раз.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Основная информация</h2>
        <p className="mt-1 text-sm text-slate-500">
          Эти данные описывают карточку услуги и используются на витрине каталога.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Категория
            <select
              value={state.categoryId}
              onChange={handleChange("categoryId")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="" disabled>
                Выберите категорию
              </option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Название услуги
            <input
              type="text"
              value={state.name}
              onChange={handleChange("name")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Например, Установка смесителя"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Slug
            <input
              type="text"
              value={state.slug}
              onChange={handleChange("slug")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="ustanovka-smesitelya"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Средняя цена (₽)
            <input
              type="text"
              value={state.medianPrice}
              onChange={handleChange("medianPrice")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="4500"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Автор (ID пользователя)
            <input
              type="text"
              value={state.authorId}
              onChange={handleChange("authorId")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="cuid автора"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Хранитель (ID профиля исполнителя)
            <input
              type="text"
              value={state.keeperId}
              onChange={handleChange("keeperId")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="cuid профиля"
            />
          </label>
        </div>

        <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-slate-700">
          Краткое описание
          <textarea
            value={state.description}
            onChange={handleChange("description")}
            className="min-h-[120px] rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Кратко опишите услугу"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Версия услуги</h2>
        <p className="mt-1 text-sm text-slate-500">
          При сохранении будет создана новая версия с указанными параметрами. Все предыдущие версии станут неактивными.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Заголовок версии
            <input
              type="text"
              value={state.versionTitle}
              onChange={handleChange("versionTitle")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Например, Комплексная установка"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Единица измерения
            <input
              type="text"
              value={state.unitOfMeasure}
              onChange={handleChange("unitOfMeasure")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="шт, м², час"
            />
          </label>
        </div>

        <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-slate-700">
          Подробное описание
          <textarea
            value={state.versionDescription}
            onChange={handleChange("versionDescription")}
            className="min-h-[160px] rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Расскажите об этапах и особенностях выполнения"
          />
        </label>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Что входит (по одному пункту на строку)
            <textarea
              value={state.whatsIncludedText}
              onChange={handleChange("whatsIncludedText")}
              className="min-h-[140px] rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder={"Демонтаж старого смесителя\nУстановка нового оборудования"}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Что не входит
            <textarea
              value={state.whatsNotIncludedText}
              onChange={handleChange("whatsNotIncludedText")}
              className="min-h-[140px] rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder={"Поставка расходников\nСложные дополнительные работы"}
            />
          </label>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Требуемые инструменты
            <textarea
              value={state.requiredToolsText}
              onChange={handleChange("requiredToolsText")}
              className="min-h-[120px] rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder={"Разводной ключ\nОтвертка"}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Требования к заказчику
            <textarea
              value={state.customerRequirementsText}
              onChange={handleChange("customerRequirementsText")}
              className="min-h-[120px] rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder={"Свободный доступ к месту работ\nНаличие расходных материалов"}
            />
          </label>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Оценка времени выполнения
            <input
              type="text"
              value={state.estimatedTime}
              onChange={handleChange("estimatedTime")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="2 часа"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Максимальное время, включенное в стоимость (час)
            <input
              type="text"
              value={state.maxTimeIncluded}
              onChange={handleChange("maxTimeIncluded")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="3"
            />
          </label>
        </div>

        <label className="mt-6 flex flex-col gap-2 text-sm font-medium text-slate-700">
          Медиа (JSON массив)
          <textarea
            value={state.mediaJson}
            onChange={handleChange("mediaJson")}
            className="min-h-[180px] rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder='[{"type":"image","url":"https://..."}]'
          />
        </label>
      </section>

      {(formError || errorMessage) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError ?? errorMessage}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {isSubmitting ? "Сохранение..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
