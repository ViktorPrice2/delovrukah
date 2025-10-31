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
  const totalProviders = services.reduce(
    (sum, service) => sum + (service.providers?.length ?? 0),
    0,
  );
  // --- КОНЕЦ ИЗМЕНЕНИЙ В ЛОГИКЕ ---
  
  return (
    <div className="space-y-10 pb-12">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white shadow-lg sm:p-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.4),_transparent_60%)]" aria-hidden />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <nav className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              <a href={`/${citySlug}`} className="transition hover:text-white">
                {currentCityName}
              </a>
              <span className="mx-2 text-white/40">/</span>
              <span>{currentCategory.name}</span>
            </nav>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {currentCategory.name}
              </h1>
              {currentCategory.description && (
                <p className="max-w-3xl text-base text-white/80">
                  {currentCategory.description}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-2 text-sm text-right text-white/70">
            <span>
              Услуг в подборке: <strong className="font-semibold text-white">{services.length}</strong>
            </span>
            <span>
              Активных мастеров: <strong className="font-semibold text-white">{totalProviders}</strong>
            </span>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Услуги категории</h2>
            <p className="text-sm text-slate-600">
              Карточки содержат краткое описание и ориентировочную стоимость. Нажмите, чтобы узнать подробности.
            </p>
          </div>
          <Link
            href={`/${citySlug}`}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Вернуться в каталог города
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const servicePathSegment = service.slug || service.id;
            const priceValue = service.medianPrice ?? service.providers?.[0]?.price ?? null;
            const formattedPrice =
              typeof priceValue === "number"
                ? new Intl.NumberFormat("ru-RU").format(priceValue)
                : null;

            return (
              <article
                key={service.id}
                className="group flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">
                      {service.name}
                    </h3>
                    <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {formattedPrice ? `от ${formattedPrice} ₽` : "Цена по запросу"}
                    </span>
                  </div>
                  {service.description ? (
                    <p className="text-sm leading-relaxed text-slate-600 line-clamp-4">
                      {service.description}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">Описание появится в ближайшее время.</p>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
                  <span>
                    {service.providers?.length
                      ? `${service.providers.length} мастеров готовы помочь`
                      : "Свободные мастера появятся скоро"}
                  </span>
                  <Link
                    href={{
                      pathname: `/${citySlug}/services/${servicePathSegment}`,
                      query: { id: service.id },
                    }}
                    className="inline-flex items-center gap-2 font-semibold text-blue-600 transition hover:text-blue-500"
                  >
                    Подробнее
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}