import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { City, Provider, Service } from "@/app/types/catalog.types";
import { getCity, getServiceDetail } from "@/app/lib/catalog-api";

export const dynamic = "force-dynamic";

type ServicePageProps = {
  params: { citySlug: string; serviceSlug: string };
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function resolveMinimalPrice(service: Service): number | undefined {
  if (typeof service.priceFrom === "number") {
    return service.priceFrom;
  }

  if (!service.providers || service.providers.length === 0) {
    return undefined;
  }

  return service.providers.reduce<number | undefined>((min, provider) => {
    if (min === undefined) {
      return provider.price;
    }
    return provider.price < min ? provider.price : min;
  }, undefined);
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { citySlug, serviceSlug } = params;

  try {
    const city = await getCity(citySlug);
    if (!city) {
      return {
        title: "Услуга не найдена | Delovrukah.ru",
      };
    }

    let service: Service | undefined;
    try {
      service = await getServiceDetail(citySlug, serviceSlug);
    } catch (error) {
      console.error("Service detail request failed while generating metadata", error);
    }

    if (!service) {
      return {
        title: "Услуга не найдена | Delovrukah.ru",
      };
    }

    const minPrice = resolveMinimalPrice(service);
    const priceLabel =
      minPrice !== undefined ? `${formatPrice(minPrice)} ₽` : "договорной стоимости";

    return {
      title: `Заказать ${service.name} в ${city.name} - цены от ${priceLabel} | Delovrukah.ru`,
      description:
        service.description ??
        `Узнайте подробности и закажите услугу «${service.name}» в городе ${city.name}.`,
    };
  } catch (error) {
    console.error("Failed to generate metadata for service page", error);
    return { title: "Delovrukah.ru" };
  }
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { citySlug, serviceSlug } = params;

  let city: City | undefined;
  let service: Service | undefined;

  try {
    city = await getCity(citySlug);
  } catch (error) {
    console.error("Failed to load city", error);
    throw error;
  }

  try {
    service = await getServiceDetail(citySlug, serviceSlug);
  } catch (error) {
    console.error("Failed to load service", error);
  }

  if (!city || !service) {
    notFound();
  }

  const currentCity = city;
  const currentService = service;
  const providers: Provider[] = currentService.providers ?? [];
  const minPrice = resolveMinimalPrice(currentService);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{currentService.name}</h1>
        <p className="text-muted-foreground">
          {currentCity.name} • {minPrice !== undefined ? `от ${formatPrice(minPrice)} ₽` : "цена по договоренности"}
        </p>
      </header>

      {currentService.description && (
        <section className="space-y-2">
          <h2 className="text-2xl font-semibold">Описание услуги</h2>
          <p>{currentService.description}</p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Исполнители</h2>
        {providers.length === 0 ? (
          <p>Исполнители для этой услуги появятся позже.</p>
        ) : (
          <ul className="space-y-4">
            {providers.map((provider: Provider) => (
              <li key={provider.id} className="rounded border p-4 shadow-sm transition hover:shadow">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">{provider.name}</span>
                  <span className="text-base font-semibold">
                    {formatPrice(provider.price)} ₽
                  </span>
                </div>
                {provider.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{provider.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
