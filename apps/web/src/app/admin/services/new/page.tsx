"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";

import { Accordion } from "@/app/components/ui/Accordion";
import type { ServiceMediaItem } from "@/app/types/catalog.types";

const DEFAULT_FORM_STATE: ServiceFormState = {
  name: "Новая услуга",
  slug: "new-service",
  categoryName: "Базовая категория",
  categorySlug: "bazovaya-kategoriya",
  cityName: "Москва",
  minPrice: "4500",
  unitOfMeasure: "за работу",
  estimatedTime: "2-3 часа",
  maxTimeIncluded: "3",
  description:
    "Полное описание услуги появится здесь. Добавьте преимущества, условия и подробности выполнения работ.",
  versionDescription:
    "Уточните детали конкретной версии услуги — что включено, особенности и ограничения.",
  whatsIncluded: "Выезд мастера\nДиагностика работ\nВыполнение основных операций",
  whatsNotIncluded: "Расходные материалы\nДополнительные работы вне базового пакета",
  requiredTools: "Стандартный набор инструментов\nСпециализированное оборудование",
  customerRequirements: "Доступ в помещение\nПодготовленное рабочее пространство",
  primaryMedia: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
  galleryMedia:
    "https://images.unsplash.com/photo-1580894897200-6ff9721a173e\nhttps://images.unsplash.com/photo-1523419409543-0c1df022bdd1\nvideo:https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
};

const PRICE_PLACEHOLDER = "4500";

type ServiceFormState = {
  name: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  cityName: string;
  minPrice: string;
  unitOfMeasure: string;
  estimatedTime: string;
  maxTimeIncluded: string;
  description: string;
  versionDescription: string;
  whatsIncluded: string;
  whatsNotIncluded: string;
  requiredTools: string;
  customerRequirements: string;
  primaryMedia: string;
  galleryMedia: string;
};

type ServicePreviewModel = {
  name: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  cityName: string;
  minPrice: number | null;
  unitOfMeasure: string | null;
  estimatedTime: string | null;
  maxTimeIncluded: number | null;
  description: string | null;
  versionDescription: string | null;
  whatsIncluded: string[];
  whatsNotIncluded: string[];
  requiredTools: string[];
  customerRequirements: string[];
  media: ServiceMediaItem[];
};

type SubmitResult =
  | { status: "idle" }
  | { status: "success"; payload: unknown }
  | { status: "error"; message: string };

const DETAIL_PLACEHOLDERS = {
  whatsIncluded: "Добавьте хотя бы один пункт, чтобы показать перечень работ",
  whatsNotIncluded: "Опишите дополнительные услуги, которые оплачиваются отдельно",
  requiredTools: "Перечислите инструменты, которые понадобятся мастеру",
  customerRequirements: "Укажите условия и ожидания от клиента",
};

function parseList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseMedia(value: string, fallbackAlt: string): ServiceMediaItem[] {
  const entries = parseList(value);

  return entries.map((entry) => {
    const isVideo = entry.startsWith("video:");
    const url = isVideo ? entry.slice("video:".length).trim() : entry;
    const isValidUrl = url.length > 0;

    return {
      type: isValidUrl && isVideo ? "video" : "image",
      url: isValidUrl ? url : "",
      alt: fallbackAlt,
    } satisfies ServiceMediaItem;
  });
}

function getPrimaryMedia(media: ServiceMediaItem[]): ServiceMediaItem | null {
  const [primary] = media;
  return primary && primary.url ? primary : null;
}

function getSecondaryMedia(media: ServiceMediaItem[]): ServiceMediaItem[] {
  if (media.length <= 1) {
    return [];
  }
  return media.slice(1, 4).filter((item) => item.url);
}

function formatPrice(value: number | null): string {
  if (!value || Number.isNaN(value)) {
    return "Цена по договоренности";
  }
  return `от ${value.toLocaleString("ru-RU")} ₽`;
}

function formatHours(value: number | null): string {
  if (!value || Number.isNaN(value)) {
    return "Время обсуждается";
  }

  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} ч`;
}

function getAiSummary(description: string | null | undefined): string | null {
  if (!description) {
    return null;
  }

  const normalized = description.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/).slice(0, 2);
  if (sentences.length === 0) {
    return null;
  }

  return sentences.join(" ");
}

function DetailPlaceholder({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 p-4 text-sm text-slate-500">
      {message}
    </div>
  );
}

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="mt-1 text-lg font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function MediaPreview({ media }: { media: ServiceMediaItem[] }) {
  const primary = getPrimaryMedia(media);
  const secondary = getSecondaryMedia(media);

  if (!primary && secondary.length === 0) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Добавьте медиа, чтобы увидеть превью
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {primary ? (
        <div className="relative h-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {primary.type === "video" ? (
            <video controls playsInline className="h-full w-full object-cover" poster={primary.previewUrl ?? undefined}>
              <source src={primary.url} />
            </video>
          ) : (
            <Image
              src={primary.previewUrl ?? primary.url}
              alt={primary.alt || "Изображение услуги"}
              fill
              unoptimized
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
          )}
        </div>
      ) : null}

      {secondary.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {secondary.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              className="relative h-32 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {item.type === "video" ? (
                <video controls playsInline className="h-full w-full object-cover" poster={item.previewUrl ?? undefined}>
                  <source src={item.url} />
                </video>
              ) : (
                <Image
                  src={item.previewUrl ?? item.url}
                  alt={item.alt || "Изображение услуги"}
                  fill
                  unoptimized
                  sizes="200px"
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProvidersPreview() {
  const providers = [
    {
      name: "Иван Степанов",
      subtitle: "Мастер с опытом 6 лет",
      price: "от 4 800 ₽",
    },
    {
      name: "Команда «Чистый Дом»",
      subtitle: "Работаем официально, гарантия 30 дней",
      price: "от 5 200 ₽",
    },
  ];

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Исполнители услуги</h2>
        <p className="mt-1 text-sm text-slate-500">
          Здесь появится список исполнителей после публикации услуги и модерации анкет.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((provider) => (
          <div
            key={provider.name}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{provider.name}</p>
                <p className="text-xs uppercase tracking-wide text-emerald-600">Готов к заказам</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {provider.price}
              </span>
            </div>
            <p className="text-sm text-slate-600">{provider.subtitle}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600">
                4.9
              </span>
              <span>Средняя оценка на основе 38 отзывов</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">Паспорт проверен</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Выезд сегодня</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicePreview({ data }: { data: ServicePreviewModel }) {
  const priceLabel = formatPrice(data.minPrice);
  const aiSummary = getAiSummary(data.description ?? data.versionDescription);
  const media = data.media.filter((item) => item.url);
  const maxTimeIncludedLabel = data.maxTimeIncluded
    ? `В стоимость включено до ${formatHours(data.maxTimeIncluded)} работы`
    : "В стоимость включено время обсуждается с мастером";

  const detailItems = [
    {
      id: "included",
      title: "Что входит в услугу",
      description: "Перечень работ для клиента",
      content:
        data.whatsIncluded.length > 0 ? (
          <ul className="space-y-2 text-sm text-slate-700">
            {data.whatsIncluded.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-emerald-500" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <DetailPlaceholder message={DETAIL_PLACEHOLDERS.whatsIncluded} />
        ),
      initiallyOpen: true,
    },
    {
      id: "notIncluded",
      title: "Что не входит / доп. работы",
      description: "Чтобы избежать недопонимания",
      content:
        data.whatsNotIncluded.length > 0 ? (
          <ul className="space-y-2 text-sm text-slate-700">
            {data.whatsNotIncluded.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-amber-500" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <DetailPlaceholder message={DETAIL_PLACEHOLDERS.whatsNotIncluded} />
        ),
    },
    {
      id: "tools",
      title: "Требуемые инструменты",
      description: "Что понадобится мастеру",
      content:
        data.requiredTools.length > 0 ? (
          <ul className="space-y-2 text-sm text-slate-700">
            {data.requiredTools.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-sky-500" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <DetailPlaceholder message={DETAIL_PLACEHOLDERS.requiredTools} />
        ),
    },
    {
      id: "requirements",
      title: "Что требуется от клиента",
      description: "Минимальные условия для старта работ",
      content:
        data.customerRequirements.length > 0 ? (
          <ul className="space-y-2 text-sm text-slate-700">
            {data.customerRequirements.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-indigo-500" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <DetailPlaceholder message={DETAIL_PLACEHOLDERS.customerRequirements} />
        ),
    },
    {
      id: "info",
      title: "Важная информация",
      description: "Ключевые параметры услуги",
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBadge label="Единица измерения" value={data.unitOfMeasure ?? "Не указано"} />
            <InfoBadge label="Оценочное время" value={data.estimatedTime ?? "Уточняется"} />
          </div>
          <p className="text-sm text-slate-600">{maxTimeIncludedLabel}</p>
        </div>
      ),
    },
  ];

  return (
    <aside className="lg:w-[380px] lg:flex-none">
      <div className="flex flex-col gap-6 lg:sticky lg:top-6">
        <MediaPreview media={media} />

        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <nav className="text-sm text-slate-500">
            <span>{data.cityName || "Город"}</span>
            <span className="mx-1">/</span>
            <span>{data.categoryName || "Категория"}</span>
          </nav>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              {data.name.trim() ? data.name : "Название услуги"}
            </h1>
            <p className="text-xl font-semibold text-emerald-600">{priceLabel}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-w-[120px] flex-1 flex-col rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left text-sm text-slate-700 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Оценка времени</span>
              <span className="mt-1 text-base font-semibold text-slate-900">
                {data.estimatedTime?.trim() || "Уточняется"}
              </span>
            </span>
            <span className="inline-flex min-w-[120px] flex-1 flex-col rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left text-sm text-slate-700 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Слаг</span>
              <span className="mt-1 break-all text-base font-semibold text-slate-900">
                {data.slug.trim() || "slug"}
              </span>
            </span>
          </div>

          {aiSummary ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">AI-саммари</span>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{aiSummary}</p>
            </div>
          ) : null}

          <Link
            href="#service-form"
            className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Перейти к настройке
          </Link>

          {data.versionDescription && data.versionDescription !== data.description ? (
            <p className="text-sm leading-relaxed text-slate-600">{data.versionDescription}</p>
          ) : null}
        </div>

        <ProvidersPreview />

        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Детали услуги</h2>
            <p className="mt-1 text-sm text-slate-500">Просмотрите, как блоки будут выглядеть для клиента.</p>
          </div>
          <Accordion items={detailItems} className="space-y-0" />
        </section>
      </div>
    </aside>
  );
}

function ServicePayloadPreview({ payload }: { payload: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-slate-900/95 p-5 text-xs leading-relaxed text-slate-100 shadow-inner">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

export default function CreateServicePage() {
  const [form, setForm] = useState<ServiceFormState>(DEFAULT_FORM_STATE);
  const [result, setResult] = useState<SubmitResult>({ status: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preview = useMemo<ServicePreviewModel>(() => {
    const parsedMinPrice = Number.parseInt(form.minPrice.replace(/\s+/g, ""), 10);
    const parsedMaxTime = Number.parseFloat(form.maxTimeIncluded.replace(/,/, "."));

    const media: ServiceMediaItem[] = [];

    if (form.primaryMedia.trim()) {
      media.push({
        type: form.primaryMedia.trim().startsWith("video:") ? "video" : "image",
        url: form.primaryMedia.trim().replace(/^video:/, ""),
        alt: form.name || "Медиа услуги",
      });
    }

    const galleryMedia = parseMedia(form.galleryMedia, form.name || "Медиа услуги");
    media.push(...galleryMedia);

    return {
      name: form.name,
      slug: form.slug,
      categoryName: form.categoryName,
      categorySlug: form.categorySlug,
      cityName: form.cityName,
      minPrice: Number.isFinite(parsedMinPrice) ? parsedMinPrice : null,
      unitOfMeasure: form.unitOfMeasure.trim() || null,
      estimatedTime: form.estimatedTime.trim() || null,
      maxTimeIncluded: Number.isFinite(parsedMaxTime) ? parsedMaxTime : null,
      description: form.description.trim() || null,
      versionDescription: form.versionDescription.trim() || null,
      whatsIncluded: parseList(form.whatsIncluded),
      whatsNotIncluded: parseList(form.whatsNotIncluded),
      requiredTools: parseList(form.requiredTools),
      customerRequirements: parseList(form.customerRequirements),
      media,
    } satisfies ServicePreviewModel;
  }, [form]);

  const payload = useMemo(() => {
    const parsedMinPrice = Number.parseInt(form.minPrice.replace(/\s+/g, ""), 10);
    const parsedMaxTime = Number.parseFloat(form.maxTimeIncluded.replace(/,/, "."));

    const normalizeNumber = (value: number) => (Number.isFinite(value) ? value : null);

    const media: ServiceMediaItem[] = [];

    if (form.primaryMedia.trim()) {
      media.push({
        type: form.primaryMedia.trim().startsWith("video:") ? "video" : "image",
        url: form.primaryMedia.trim().replace(/^video:/, ""),
        alt: form.name || "Медиа услуги",
      });
    }

    media.push(...parseMedia(form.galleryMedia, form.name || "Медиа услуги"));

    return {
      name: form.name.trim(),
      slug: form.slug.trim(),
      category: {
        name: form.categoryName.trim(),
        slug: form.categorySlug.trim(),
      },
      defaults: {
        basePrice: normalizeNumber(parsedMinPrice),
        unitOfMeasure: form.unitOfMeasure.trim() || null,
        estimatedTime: form.estimatedTime.trim() || null,
        maxTimeIncluded: normalizeNumber(parsedMaxTime),
      },
      descriptions: {
        short: getAiSummary(form.description) ?? null,
        full: form.description.trim() || null,
        version: form.versionDescription.trim() || null,
      },
      content: {
        whatsIncluded: parseList(form.whatsIncluded),
        whatsNotIncluded: parseList(form.whatsNotIncluded),
        requiredTools: parseList(form.requiredTools),
        customerRequirements: parseList(form.customerRequirements),
      },
      media: media.filter((item) => item.url),
    };
  }, [form]);

  const handleChange = (key: keyof ServiceFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResult({ status: "idle" });

    window.setTimeout(() => {
      if (!form.name.trim() || !form.slug.trim()) {
        setResult({ status: "error", message: "Укажите название и слаг услуги." });
        setIsSubmitting(false);
        return;
      }

      setResult({ status: "success", payload });
      setIsSubmitting(false);
    }, 500);
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM_STATE);
    setResult({ status: "idle" });
  };

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <ServicePreview data={preview} />

      <div className="flex-1 space-y-8" id="service-form">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-emerald-600">Админка / Услуги</p>
            <h1 className="text-3xl font-semibold text-slate-900">Создание услуги</h1>
            <p className="text-sm text-slate-500">
              Заполните форму справа, чтобы увидеть живой предпросмотр страницы услуги.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">Черновик</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">Сохраните, чтобы опубликовать</span>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Основная информация</h2>
              <p className="mt-1 text-sm text-slate-500">
                Название и структура URL помогут клиентам быстро найти услугу.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Название услуги</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Например, Установка стиральной машины"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Слаг (URL)</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={handleChange("slug")}
                  placeholder="ustanovka-stiralnoj-mashiny"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Категория</span>
                <input
                  type="text"
                  value={form.categoryName}
                  onChange={handleChange("categoryName")}
                  placeholder="Бытовой ремонт"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Слаг категории</span>
                <input
                  type="text"
                  value={form.categorySlug}
                  onChange={handleChange("categorySlug")}
                  placeholder="bytovoj-remont"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Город для предпросмотра</span>
                <input
                  type="text"
                  value={form.cityName}
                  onChange={handleChange("cityName")}
                  placeholder="Москва"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Стоимость и метрики</h2>
              <p className="mt-1 text-sm text-slate-500">
                Укажите ключевые параметры — они появятся в карточках и фильтрах каталога.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Минимальная стоимость, ₽</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={form.minPrice}
                  onChange={handleChange("minPrice")}
                  placeholder={PRICE_PLACEHOLDER}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Единица измерения</span>
                <input
                  type="text"
                  value={form.unitOfMeasure}
                  onChange={handleChange("unitOfMeasure")}
                  placeholder="за работу / за час"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Оценочное время</span>
                <input
                  type="text"
                  value={form.estimatedTime}
                  onChange={handleChange("estimatedTime")}
                  placeholder="Например, 2-3 часа"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Максимум часов в стоимости</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.maxTimeIncluded}
                  onChange={handleChange("maxTimeIncluded")}
                  placeholder="3"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Описания</h2>
              <p className="mt-1 text-sm text-slate-500">
                Основной текст влияет на выдачу и помогает клиенту быстро разобраться в услуге.
              </p>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Полное описание</span>
              <textarea
                value={form.description}
                onChange={handleChange("description")}
                rows={5}
                placeholder="Подробно опишите суть услуги, ее преимущества и ограничения."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Описание версии</span>
              <textarea
                value={form.versionDescription}
                onChange={handleChange("versionDescription")}
                rows={4}
                placeholder="Если есть отличия конкретной версии услуги — укажите их здесь."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>
          </section>

          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Состав работ</h2>
              <p className="mt-1 text-sm text-slate-500">
                Заполните списки — они автоматически попадут в соответствующие блоки страницы.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Что входит в услугу</span>
                <textarea
                  value={form.whatsIncluded}
                  onChange={handleChange("whatsIncluded")}
                  rows={6}
                  placeholder={"Каждый пункт с новой строки"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Дополнительные работы</span>
                <textarea
                  value={form.whatsNotIncluded}
                  onChange={handleChange("whatsNotIncluded")}
                  rows={6}
                  placeholder={"Каждый пункт с новой строки"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Требуемые инструменты</span>
                <textarea
                  value={form.requiredTools}
                  onChange={handleChange("requiredTools")}
                  rows={5}
                  placeholder={"Каждый пункт с новой строки"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Что требуется от клиента</span>
                <textarea
                  value={form.customerRequirements}
                  onChange={handleChange("customerRequirements")}
                  rows={5}
                  placeholder={"Каждый пункт с новой строки"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Медиа</h2>
              <p className="mt-1 text-sm text-slate-500">
                Укажите ссылки на изображения или видео. Для видео используйте формат <code>video:https://...</code>.
              </p>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Основное медиа</span>
              <input
                type="text"
                value={form.primaryMedia}
                onChange={handleChange("primaryMedia")}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Галерея (по одному URL на строку)</span>
              <textarea
                value={form.galleryMedia}
                onChange={handleChange("galleryMedia")}
                rows={4}
                placeholder={"https://..."}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>
          </section>

          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Публикация</h2>
              <p className="mt-1 text-sm text-slate-500">
                Проверьте заполненные данные перед отправкой. Система сохранит услугу как черновик.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {isSubmitting ? "Сохраняем..." : "Сохранить услугу"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100"
              >
                Сбросить к шаблону
              </button>
            </div>

            {result.status === "error" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                {result.message}
              </div>
            ) : null}

            {result.status === "success" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">✓</span>
                  Услуга сохранена как черновик. Перед публикацией проверьте данные и добавьте исполнителей.
                </div>
                <ServicePayloadPreview payload={result.payload} />
              </div>
            ) : null}
          </section>
        </form>
      </div>
    </div>
  );
}
