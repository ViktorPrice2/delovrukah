import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { Category, City } from "@/app/types/catalog.types";
import { getCategoriesByCity, getCity } from "@/app/lib/catalog-api";

export const dynamic = "force-dynamic";

type CityPageProps = {
  params: { citySlug: string };
};

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { citySlug } = params;
  try {
    const city = await getCity(citySlug);
    if (!city) {
      return {
        title: "Город не найден | Delovrukah.ru",
      };
    }

    return {
      title: `${city.name} — услуги и категории | Delovrukah.ru`,
      description: city.description ?? `Каталог услуг в городе ${city.name}.`,
    };
  } catch (error) {
    console.error("Failed to generate metadata for city page", error);
    return {
      title: "Delovrukah.ru",
    };
  }
}

export default async function CityPage({ params }: CityPageProps) {
  const { citySlug } = params;

  let city: City | undefined;
  let categories: Category[] = [];

  try {
    city = await getCity(citySlug);
  } catch (error) {
    console.error("Failed to load city", error);
    throw error;
  }

  if (!city) {
    notFound();
  }

  const currentCity = city;

  try {
    categories = await getCategoriesByCity(currentCity.slug);
  } catch (error) {
    console.error("Failed to load categories for city", error);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Услуги в городе {currentCity.name}</h1>
        {currentCity.description && <p className="text-muted-foreground">{currentCity.description}</p>}
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Категории</h2>
        {categories.length === 0 ? (
          <p>Категории пока не добавлены для этого города.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id} className="rounded border p-4 shadow-sm transition hover:shadow">
                <h3 className="text-xl font-medium">{category.name}</h3>
                {category.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
                )}
                <Link
                  href={`/${currentCity.slug}/${category.slug}`}
                  className="mt-4 inline-flex items-center font-semibold text-blue-600 hover:underline"
                >
                  Смотреть услуги
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
