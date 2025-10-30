import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { Category, City, Service } from "@/app/types/catalog.types";
import { getCategoryBySlug, getCity, getServicesByCategory } from "@/app/lib/catalog-api";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: { citySlug: string; categorySlug: string };
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { citySlug, categorySlug } = params;

  try {
    const [city, category] = await Promise.all([
      getCity(citySlug),
      getCategoryBySlug(citySlug, categorySlug),
    ]);

    if (!city || !category) {
      return {
        title: "Категория не найдена | Delovrukah.ru",
      };
    }

    return {
      title: `${category.name} в городе ${city.name} | Delovrukah.ru`,
      description:
        category.description ?? `Список услуг категории «${category.name}» в городе ${city.name}.`,
    };
  } catch (error) {
    console.error("Failed to generate metadata for category page", error);
    return { title: "Delovrukah.ru" };
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { citySlug, categorySlug } = params;

  let city: City | undefined;
  let category: Category | undefined;
  let services: Service[] = [];

  try {
    [city, category] = await Promise.all([
      getCity(citySlug),
      getCategoryBySlug(citySlug, categorySlug),
    ]);
  } catch (error) {
    console.error("Failed to load city or category", error);
    throw error;
  }

  if (!city || !category) {
    notFound();
  }

  const currentCity = city;
  const currentCategory = category;

  try {
    services = await getServicesByCategory(currentCity.slug, currentCategory.slug);
  } catch (error) {
    console.error("Failed to load services for category", error);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">
          {currentCategory.name} — {currentCity.name}
        </h1>
        {currentCategory.description && (
          <p className="text-muted-foreground">{currentCategory.description}</p>
        )}
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Услуги</h2>
        {services.length === 0 ? (
          <p>Услуги в этой категории пока не добавлены.</p>
        ) : (
          <ul className="space-y-4">
            {services.map((service) => (
              <li key={service.id} className="rounded border p-4 shadow-sm transition hover:shadow">
                <h3 className="text-xl font-medium">{service.name}</h3>
                {service.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                )}
                <Link
                  href={`/${currentCity.slug}/services/${service.slug}`}
                  className="mt-4 inline-flex items-center font-semibold text-blue-600 hover:underline"
                >
                  Подробнее об услуге
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
