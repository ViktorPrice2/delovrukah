import Link from "next/link";
import CitySelector from "./components/CitySelector";
import { getCities } from "./lib/catalog-api";
import type { City } from "./types/catalog.types";

const POPULAR_CATEGORIES: { label: string; slug: string }[] = [
  { label: "Сантехника", slug: "santehnika" },
  { label: "Электрика", slug: "elektrika" },
  { label: "Сборка мебели", slug: "sborka-mebeli" },
  { label: "Ремонт квартир", slug: "remont-kvartir" },
  { label: "Уборка", slug: "uborka" },
  { label: "Отделочные работы", slug: "otdelochnye-raboty" },
];

export default async function HomePage() {
  let cities: City[] = [];
  let error: string | null = null;

  try {
    cities = await getCities();
  } catch (err) {
    console.error("Не удалось получить список городов на главной странице:", err);
    error = "Не удалось загрузить список городов.";
  }

  return (
    <div className="space-y-12 py-12">
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-blue-600">
          Найдите проверенного мастера рядом с вами
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Delovrukah: Найдите проверенного мастера для любой задачи
        </h1>
        <p className="max-w-3xl text-lg text-slate-600">
          Подберите надежного специалиста в своем городе и закажите услуги по ремонту, установке, уборке и многому другому.
          Всего несколько кликов — и нужный мастер уже в пути.
        </p>
      </section>

      <section className="mx-auto flex max-w-xl flex-col items-center gap-6">
        <CitySelector initialCities={cities} error={error} />
        <p className="text-sm text-slate-500">
          Выберите город, чтобы перейти к каталогу исполнителей и услуг.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Популярные категории услуг</h2>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Доступны после выбора города
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href="#"
              aria-disabled="true"
              tabIndex={-1}
              className="pointer-events-none rounded-lg border border-dashed border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-400 shadow-sm"
            >
              {category.label}
            </Link>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          После выбора города категории будут вести к соответствующим страницам с услугами.
        </p>
      </section>
    </div>
  );
}
