import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

// --- НАЧАЛО ИЗМЕНЕНИЙ В ИМПОРТАХ ---
// Импортируем ОДНУ функцию, которая получит всё
import { getCategories } from "../lib/catalog-api";
// --- КОНЕЦ ИЗМЕНЕНИЙ В ИМПОРТАХ ---

export const dynamic = "force-dynamic";

type CityPageParams = {
  citySlug?: string;
};

type CityPageProps = {
  params: Promise<CityPageParams> | CityPageParams;
};

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { citySlug = "" } = await params;

  // Мы не можем легко получить имя города здесь без отдельного запроса,
  // поэтому генерируем title на основе слага. Это надежнее.
  const cityName = citySlug
    ? citySlug.charAt(0).toUpperCase() + citySlug.slice(1)
    : "Город";

  return {
    title: `Услуги в городе ${cityName} — категории | Delovrukah.ru`,
    description: `Каталог услуг и исполнителей в городе ${cityName}. Сантехника, электрика, ремонт и многое другое.`,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  // --- НАЧАЛО ИЗМЕНЕНИЙ В ЛОГИКЕ ---
  const { citySlug } = await params;

  if (!citySlug) {
    console.warn("[SSR] citySlug не передан, вызываю notFound()");
    notFound();
  }

  console.log(`[SSR] Запрашиваю категории для города: ${citySlug}`);
  // Делаем ОДИН запрос, чтобы получить все категории для этого города
  const categories = await getCategories(citySlug);
  console.log(`[SSR] Получено категорий: ${categories?.length ?? 0}`);

  // Если API вернул null или пустой массив, значит, такого города/категорий нет -> 404
  if (!categories || categories.length === 0) {
    console.log(`[SSR] Категории для города ${citySlug} не найдены, вызываю notFound()`);
    notFound();
  }
  
  // Мы не можем быть уверены в имени города, так как API /categories его не возвращает.
  // В идеале - API должен был бы возвращать { city: { name: 'Москва'}, categories: [...] }
  // Пока используем слаг.
  const cityName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  // --- КОНЕЦ ИЗМЕНЕНИЙ В ЛОГИКЕ ---

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Услуги в городе {cityName}</h1>
        <p className="text-muted-foreground">Выберите нужную категорию, чтобы найти исполнителя.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Категории услуг</h2>
        {/* Проверка на пустой массив остается, на всякий случай */}
        {categories.length === 0 ? (
          <p>Категории пока не добавлены для этого города.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/${citySlug}/${category.slug}`}
                  className="block rounded-lg border bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg"
                >
                  <h3 className="text-xl font-semibold text-slate-800">{category.name}</h3>
                  {category.description && (
                    <p className="mt-2 text-sm text-slate-600">{category.description}</p>
                  )}
                  <div
                    className="mt-4 inline-flex items-center font-semibold text-blue-600"
                  >
                    Смотреть услуги →
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}