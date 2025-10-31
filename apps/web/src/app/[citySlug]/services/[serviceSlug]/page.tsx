import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Используем наш централизованный API-клиент
import { getServiceDetailsBySlug } from "@/app/lib/catalog-api";
// Предполагается, что в catalog-api.ts будет такая функция
// И типы будут импортироваться оттуда же или из types/catalog.types.ts
import type { ServiceDetail } from "@/app/types/catalog.types";
import ServiceScopeList from "@/app/components/catalog/ServiceScopeList";
import { AddToCartButton } from "./AddToCartButton";

export const dynamic = "force-dynamic";

type ServicePageParams = {
  citySlug: string;
  serviceSlug: string;
};

type ServicePageSearchParams = {
  id?: string;
};

type ServicePageProps = {
  params: ServicePageParams | Promise<ServicePageParams>;
  searchParams?: ServicePageSearchParams | Promise<ServicePageSearchParams>;
};

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ---
// Вынесем логику расчета минимальной цены в отдельную функцию
function getMinimalPrice(service: ServiceDetail): number | null {
  if (!service.providers || service.providers.length === 0) {
    return null;
  }
  return Math.min(...service.providers.map(p => p.price));
}

// --- ДИНАМИЧЕСКАЯ ГЕНЕРАЦИЯ МЕТАДАННЫХ ДЛЯ SEO ---
export async function generateMetadata({ params, searchParams }: ServicePageProps): Promise<Metadata> {
  const { citySlug, serviceSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const fallbackId = resolvedSearchParams?.id;

  // Делаем ОДИН запрос, чтобы получить все данные
  const service = await getServiceDetailsBySlug(serviceSlug, citySlug, fallbackId);

  if (!service) {
    return {
      title: "Услуга не найдена | Delovrukah.ru",
      description: "Запрошенная вами услуга не найдена. Возможно, она была перемещена или удалена."
    };
  }

  const minPrice = getMinimalPrice(service);
  const priceLabel = minPrice ? `от ${minPrice.toLocaleString('ru-RU')} ₽` : "цена договорная";
  const cityName = service.providers?.[0]?.city.name ?? citySlug;

  return {
    title: `Заказать ${service.name} в г. ${cityName} - цены ${priceLabel} | Delovrukah.ru`,
    description: service.description ?? `Узнайте подробности и закажите услугу «${service.name}» в городе ${cityName}.`,
  };
}

// --- КОМПОНЕНТ СТРАНИЦЫ ---
export default async function ServicePage({ params, searchParams }: ServicePageProps) {
  const { citySlug, serviceSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const fallbackId = resolvedSearchParams?.id;

  const service = await getServiceDetailsBySlug(serviceSlug, citySlug, fallbackId);

  // Проверяем, что API вернул данные. Если нет - 404.
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
  const sectionCardClass = "rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur";

  const renderPlaceholderCard = (title: string, message: string) => (
    <div className={`${sectionCardClass} border-dashed text-sm text-slate-500`}> 
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 leading-relaxed">{message}</p>
    </div>
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-12 pt-6 lg:px-0">
      <header className={`${sectionCardClass} space-y-4`}> 
        <nav className="text-sm text-slate-500">
          <a href={`/${citySlug}`} className="hover:underline">{cityName}</a>
          {" / "}
          <a href={`/${citySlug}/${service.category.slug}`} className="hover:underline">{service.category.name}</a>
        </nav>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">{service.name}</h1>
          <p className="text-xl font-semibold text-emerald-600">
            {minPrice !== null ? `от ${minPrice.toLocaleString('ru-RU')} ₽` : "Цена по договоренности"}
          </p>
        </div>
        {unitOfMeasure && (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <span>Единица измерения</span>
            <span className="text-sm normal-case text-emerald-900">{unitOfMeasure}</span>
          </div>
        )}
      </header>

      {(service.description || versionDescription) && (
        <section className={`${sectionCardClass} space-y-4`}>
          <h2 className="text-2xl font-semibold text-slate-900">Описание услуги</h2>
          {service.description && (
            <p className="text-base leading-relaxed text-slate-700">{service.description}</p>
          )}
          {versionDescription && versionDescription !== service.description && (
            <p className="text-sm leading-relaxed text-slate-600">{versionDescription}</p>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr),minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {whatsIncluded && whatsIncluded.length > 0
            ? (
                <ServiceScopeList
                  title="Что входит в услугу"
                  items={whatsIncluded}
                  iconVariant="positive"
                  className={`${sectionCardClass} space-y-4`}
                />
              )
            : renderPlaceholderCard(
                "Что входит в услугу",
                "Подробный перечень работ появится, как только мы получим информацию от исполнителя.",
              )}

          {whatsNotIncluded && whatsNotIncluded.length > 0
            ? (
                <ServiceScopeList
                  title="Что не входит / доп. работы"
                  items={whatsNotIncluded}
                  iconVariant="negative"
                  className={`${sectionCardClass} space-y-4`}
                />
              )
            : renderPlaceholderCard(
                "Что не входит / доп. работы",
                "Дополнительные работы обсуждаются индивидуально с исполнителем.",
              )}
        </div>

        <section className={`${sectionCardClass} space-y-6`}>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Важная информация</h2>
            <p className="text-sm text-slate-500">Подготовьтесь заранее, чтобы услуга прошла без сюрпризов.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Единица измерения</span>
            <p className="mt-1 text-lg font-semibold text-slate-900">{unitOfMeasure ?? "Уточняется"}</p>
          </div>

          {requiredTools && requiredTools.length > 0 ? (
            <ServiceScopeList
              title="Требуемые инструменты"
              items={requiredTools}
              iconVariant="info"
              className="space-y-4"
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 p-4 text-sm text-slate-500">
              <h3 className="text-lg font-semibold text-slate-900">Требуемые инструменты</h3>
              <p className="mt-2 leading-relaxed">Исполнитель предоставит список необходимых инструментов при подтверждении заказа.</p>
            </div>
          )}

          {customerRequirements && customerRequirements.length > 0 ? (
            <ServiceScopeList
              title="Что требуется от вас"
              items={customerRequirements}
              iconVariant="info"
              className="space-y-4"
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 p-4 text-sm text-slate-500">
              <h3 className="text-lg font-semibold text-slate-900">Что требуется от вас</h3>
              <p className="mt-2 leading-relaxed">Мы уточним требования к подготовке помещения и доступам после обработки заявки.</p>
            </div>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Исполнители в г. {cityName}</h2>
        {providers.length > 0 ? (
          <ul className="space-y-4">
            {providers.map((provider) => (
              <li
                key={provider.id}
                className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="text-base font-semibold text-slate-900">{provider.displayName}</div>
                    {provider.description && (
                      <p className="text-sm leading-relaxed text-slate-600">{provider.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-lg font-bold text-slate-900">
                      {provider.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <AddToCartButton service={service} provider={provider} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center">
            <p className="text-base font-semibold text-slate-600">К сожалению, в вашем городе пока нет исполнителей для этой услуги.</p>
            <p className="mt-2 text-sm text-slate-500">Оставьте заявку — мы сообщим, когда мастера появятся.</p>
          </div>
        )}
      </section>
    </div>
  );
}