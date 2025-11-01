import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ServiceScopeList from "@/app/components/catalog/ServiceScopeList";
import { Accordion } from "@/app/components/ui/Accordion";
import { getServiceDetailsBySlug } from "@/app/lib/catalog-api";
import type { ServiceDetail, ServiceMediaItem } from "@/app/types/catalog.types";

import { ServiceProvidersSection } from "./ServiceProvidersSection";

export const dynamic = "force-dynamic";

function getMinimalPrice(service: ServiceDetail): number | null {
  if (!service.providers || service.providers.length === 0) {
    return null;
  }
  return Math.min(...service.providers.map((provider) => provider.price));
}

function formatPrice(price: number | null): string {
  if (price === null) {
    return "Цена по договоренности";
  }
  return `от ${price.toLocaleString("ru-RU")} ₽`;
}

function formatHours(value: number | null | undefined, options?: { maximumFractionDigits?: number }): string {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return "Уточняется";
  }

  const fractionDigits = options?.maximumFractionDigits ?? (Number.isInteger(value) ? 0 : 1);
  const normalized = value.toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });

  return normalized;
}

function getPrimaryMedia(media: ServiceMediaItem[] | null): ServiceMediaItem | null {
  if (!media || media.length === 0) {
    return null;
  }
  return media[0];
}

function getSecondaryMedia(media: ServiceMediaItem[] | null): ServiceMediaItem[] {
  if (!media || media.length <= 1) {
    return [];
  }
  return media.slice(1, 4);
}

function renderMediaElement(item: ServiceMediaItem, index: number, variant: "primary" | "secondary") {
  const alt = item.alt || "Изображение услуги";
  const containerClass = `relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
    variant === "primary" ? "h-[360px]" : "h-32"
  }`;
  if (item.type === "video") {
    return (
      <div key={`${item.url}-${index}`} className={containerClass}>
        <video
          controls
          playsInline
          className="h-full w-full object-cover"
          poster={typeof item.previewUrl === "string" ? item.previewUrl : undefined}
        >
          <source src={item.url} />
        </video>
      </div>
    );
  }

  return (
    <div key={`${item.url}-${index}`} className={containerClass}>
      <Image
        src={item.previewUrl ?? item.url}
        alt={alt}
        fill
        unoptimized
        sizes={variant === "primary" ? "(min-width: 1024px) 640px, 100vw" : "200px"}
        className="object-cover"
        priority={variant === "primary"}
      />
    </div>
  );
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

export type ServicePageParams = {
  citySlug: string;
  serviceSlug: string;
};

export type ServicePageSearchParams = {
  id?: string;
};

export type ServicePageProps = {
  params: ServicePageParams | Promise<ServicePageParams>;
  searchParams?: ServicePageSearchParams | Promise<ServicePageSearchParams>;
};

export async function generateMetadata({ params, searchParams }: ServicePageProps): Promise<Metadata> {
  const { citySlug, serviceSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const fallbackId = resolvedSearchParams?.id;

  const service = await getServiceDetailsBySlug(serviceSlug, citySlug, fallbackId);

  if (!service) {
    return {
      title: "Услуга не найдена | Delovrukah.ru",
      description: "Запрошенная вами услуга не найдена. Возможно, она была перемещена или удалена.",
    };
  }

  const minPrice = getMinimalPrice(service);
  const priceLabel = formatPrice(minPrice);
  const cityName = service.providers?.[0]?.city.name ?? citySlug;

  return {
    title: `Заказать ${service.name} в г. ${cityName} - цены ${priceLabel} | Delovrukah.ru`,
    description:
      service.description ?? `Узнайте подробности и закажите услугу «${service.name}» в городе ${cityName}.`,
  };
}

export default async function ServicePage({ params, searchParams }: ServicePageProps) {
  const { citySlug, serviceSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const fallbackId = resolvedSearchParams?.id;

  const service = await getServiceDetailsBySlug(serviceSlug, citySlug, fallbackId);

  if (!service) {
    notFound();
  }

  const minPrice = getMinimalPrice(service);
  const cityName = service.providers?.[0]?.city.name ?? citySlug;
  const providers = service.providers ?? [];
  const latestVersion = service.latestVersion;
  const whatsIncluded = latestVersion?.whatsIncluded ?? null;
  const whatsNotIncluded = latestVersion?.whatsNotIncluded ?? null;
  const requiredTools = latestVersion?.requiredTools ?? null;
  const customerRequirements = latestVersion?.customerRequirements ?? null;
  const unitOfMeasure = latestVersion?.unitOfMeasure ?? null;
  const versionDescription = latestVersion?.description ?? null;
  const normalizedEstimatedTime =
    service.estimatedTime?.trim() ?? latestVersion?.estimatedTime?.trim() ?? null;
  const estimatedTimeTagValue = normalizedEstimatedTime
    ? normalizedEstimatedTime.startsWith("~")
      ? normalizedEstimatedTime
      : `~ ${normalizedEstimatedTime}`
    : "Уточняется";
  const estimatedTime = normalizedEstimatedTime;
  const maxTimeIncluded = service.maxTimeIncluded ?? latestVersion?.maxTimeIncluded ?? null;
  const maxTimeIncludedSentence =
    typeof maxTimeIncluded === "number" && !Number.isNaN(maxTimeIncluded)
      ? `В стоимость включено до ${formatHours(maxTimeIncluded)} часов работы`
      : "В стоимость включено время обсуждается с мастером";
  const media = latestVersion?.media ?? null;
  const primaryMedia = getPrimaryMedia(media);
  const secondaryMedia = getSecondaryMedia(media);

  const detailItems = [
    {
      id: "included",
      title: "Что входит в услугу",
      description: "Полный перечень работ, входящих в стоимость",
      content:
        whatsIncluded && whatsIncluded.length > 0 ? (
          <ServiceScopeList
            title="Что входит в услугу"
            items={whatsIncluded}
            iconVariant="positive"
            className="space-y-4"
            showTitle={false}
          />
        ) : (
          <DetailPlaceholder message="Подробный перечень работ появится, как только мы получим информацию от исполнителя." />
        ),
      initiallyOpen: true,
    },
    {
      id: "not-included",
      title: "Что не входит / доп. работы",
      description: "Услуги, которые рассчитываются дополнительно",
      content:
        whatsNotIncluded && whatsNotIncluded.length > 0 ? (
          <ServiceScopeList
            title="Что не входит / доп. работы"
            items={whatsNotIncluded}
            iconVariant="negative"
            className="space-y-4"
            showTitle={false}
          />
        ) : (
          <DetailPlaceholder message="Дополнительные работы обсуждаются индивидуально с выбранным мастером." />
        ),
      initiallyOpen: true,
    },
    {
      id: "tools",
      title: "Требуемые инструменты",
      description: "Что мастеру понадобится для выполнения работ",
      content:
        requiredTools && requiredTools.length > 0 ? (
          <ServiceScopeList
            title="Требуемые инструменты"
            items={requiredTools}
            iconVariant="info"
            className="space-y-4"
            showTitle={false}
          />
        ) : (
          <DetailPlaceholder message="Исполнитель предоставит перечень инструментов после подтверждения заказа." />
        ),
    },
    {
      id: "requirements",
      title: "Что требуется от вас",
      description: "Минимальные условия для качественного выполнения работ",
      content:
        customerRequirements && customerRequirements.length > 0 ? (
          <ServiceScopeList
            title="Что требуется от заказчика"
            items={customerRequirements}
            iconVariant="info"
            className="space-y-4"
            showTitle={false}
          />
        ) : (
          <DetailPlaceholder message="Мы уточним требования к подготовке помещения и доступам после обработки заявки." />
        ),
    },
    {
      id: "info",
      title: "Важная информация",
      description: "Ключевые параметры услуги",
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBadge label="Единица измерения" value={unitOfMeasure ?? "Уточняется"} />
            <InfoBadge label="Оценочное время" value={estimatedTime ?? "Уточняется"} />
          </div>
          <p className="text-sm text-slate-600">{maxTimeIncludedSentence}</p>
        </div>
      ),
    },
  ];

  const aiSummary = getAiSummary(service.description ?? versionDescription);
  const smartTags = [
    {
      id: "time",
      label: "Оценка времени",
      value: estimatedTimeTagValue,
    },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-8 lg:flex-row lg:gap-12 lg:px-0">
      <aside className="lg:w-[380px] lg:flex-none">
        <div className="flex flex-col gap-6 lg:sticky lg:top-8">
          <div className="space-y-3">
            {primaryMedia ? (
              renderMediaElement(primaryMedia, 0, "primary")
            ) : (
              <div className="flex h-[360px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Медиа скоро появится
              </div>
            )}
            {secondaryMedia.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {secondaryMedia.map((item, index) => renderMediaElement(item, index + 1, "secondary"))}
              </div>
            ) : null}
          </div>

          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <nav className="text-sm text-slate-500">
              <a href={`/${citySlug}`} className="hover:underline">
                {cityName}
              </a>
              {" / "}
              <a href={`/${citySlug}/${service.category.slug}`} className="hover:underline">
                {service.category.name}
              </a>
            </nav>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">{service.name}</h1>
              <p className="text-xl font-semibold text-emerald-600">{formatPrice(minPrice)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {smartTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex min-w-[120px] flex-1 flex-col rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left text-sm text-slate-700 shadow-sm"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tag.label}</span>
                  <span className="mt-1 text-base font-semibold text-slate-900">{tag.value}</span>
                </span>
              ))}
            </div>
            {aiSummary ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">AI-саммари</span>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{aiSummary}</p>
              </div>
            ) : null}
            <a
              href="#providers"
              className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              Выбрать мастера
            </a>
            {versionDescription && versionDescription !== service.description ? (
              <p className="text-sm leading-relaxed text-slate-600">{versionDescription}</p>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex-1 space-y-10">
        <ServiceProvidersSection providers={providers} service={service} cityName={cityName} />

        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Детали услуги</h2>
            <p className="mt-1 text-sm text-slate-500">Раскрываем условия и состав работ.</p>
          </div>
          <Accordion items={detailItems} className="space-y-0" />
        </section>
      </div>
    </div>
  );
}
