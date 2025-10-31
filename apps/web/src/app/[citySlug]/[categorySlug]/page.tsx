import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

// --- НАЧАЛО ИЗМЕНЕНИЙ В ИМПОРТАХ ---
import { getServicesByCategory } from "../../lib/catalog-api";
// --- КОНЕЦ ИЗМЕНЕНИЙ В ИМПОРТАХ ---

export const dynamic = "force-dynamic";

type CategoryPageParams = {
  citySlug: string;
  categorySlug: string;
};

type CategoryPageProps = {
  params: CategoryPageParams | Promise<CategoryPageParams>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { citySlug, categorySlug } = await params;
  
  // Формируем заголовки на основе слагов - это быстро и надежно
  const cityName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  const categoryName = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);

  return {
    title: `${categoryName} в городе ${cityName} — список услуг | Delovrukah.ru`,
    description: `Список услуг в категории «${categoryName}» в городе ${cityName}.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  // --- НАЧАЛО ИЗМЕНЕНИЙ В ЛОГИКЕ ---
  const { citySlug, categorySlug } = await params;

  console.log(`[SSR] Запрашиваю услуги: category=${categorySlug}, city=${citySlug}`);
  const services = await getServicesByCategory(citySlug, categorySlug);
  console.log(`[SSR] Получено услуг: ${services?.length ?? 0}`);
  
  // Если API вернул null или пустой массив, значит, такой комбинации город+категория нет -> 404
  if (!services || services.length === 0) {
    console.log(`[SSR] Услуги для ${categorySlug}/${citySlug} не найдены, вызываю notFound()`);
    notFound();
  }
  
  // Данные о категории и городе мы можем взять из первой услуги в списке,
  // так как они будут одинаковыми для всех.
  const currentCategory = services[0].category;
  const currentCityName = services[0].providers?.[0]?.city.name ?? citySlug;
  // --- КОНЕЦ ИЗМЕНЕНИЙ В ЛОГИКЕ ---
  
  return (
    <div className="space-y-6">
      <header className="space-y-2 border-b pb-4">
        {/* Хлебные крошки */}
        <nav className="text-sm text-muted-foreground">
          <a href={`/${citySlug}`} className="hover:underline">{currentCityName}</a>
          {' / '}
          <span>{currentCategory.name}</span>
        </nav>
        <h1 className="text-3xl font-bold">
          {currentCategory.name}
        </h1>
        {currentCategory.description && (
          <p className="text-muted-foreground">{currentCategory.description}</p>
        )}
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Услуги в категории</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => {
            const servicePathSegment = service.slug || service.id;
            return (
              <li key={service.id}>
                <Link
                  href={{
                    pathname: `/${citySlug}/services/${servicePathSegment}`,
                    query: { id: service.id },
                  }}
                  className="block p-6 border rounded-lg bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg h-full"
                >
                  <h3 className="text-xl font-semibold text-slate-800">{service.name}</h3>
                  {service.description && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{service.description}</p>
                  )}
                  <div
                    className="mt-4 inline-flex items-center font-semibold text-blue-600"
                  >
                    Подробнее →
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}