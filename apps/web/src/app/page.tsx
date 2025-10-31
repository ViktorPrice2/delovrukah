import Link from "next/link";

import CitySelector from "./components/CitySelector";
import { getCities } from "./lib/catalog-api";
import type { City } from "./types/catalog.types";

const POPULAR_CATEGORIES: {
  label: string;
  slug: string;
  description: string;
  icon: string;
}[] = [
  {
    label: "Сантехника",
    slug: "santehnika",
    description: "Монтаж сантехники, устранение протечек и модернизация узлов.",
    icon: "🚿",
  },
  {
    label: "Электрика",
    slug: "elektrika",
    description: "Проводка, подключение техники и профилактика неполадок.",
    icon: "💡",
  },
  {
    label: "Сборка мебели",
    slug: "sborka-mebeli",
    description: "Сборка гарнитуров, модулей и встроенных решений без хлопот.",
    icon: "🛠️",
  },
  {
    label: "Ремонт квартир",
    slug: "remont-kvartir",
    description: "Комплексные ремонты с черновыми и чистовыми работами.",
    icon: "🏠",
  },
  {
    label: "Уборка",
    slug: "uborka",
    description: "Поддерживающая и генеральная уборка квартир и офисов.",
    icon: "🧹",
  },
  {
    label: "Отделочные работы",
    slug: "otdelochnye-raboty",
    description: "Штукатурка, поклейка обоев и декоративные покрытия.",
    icon: "🧱",
  },
];

const WORKFLOW_STEPS: { title: string; description: string; icon: string }[] = [
  {
    title: "Опишите задачу",
    description:
      "Уточните город и услугу, чтобы мы подобрали мастеров именно под ваши требования.",
    icon: "1",
  },
  {
    title: "Получите предложения",
    description:
      "Избранные мастера свяжутся с вами в течение часа и расскажут о сроках и стоимости.",
    icon: "2",
  },
  {
    title: "Выберите исполнителя",
    description:
      "Сравните рейтинги, цены и отзывы — подтвердите заказ у подходящего специалиста.",
    icon: "3",
  },
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
    <main className="space-y-20 pb-16">
      <section className="relative isolate overflow-hidden rounded-3xl bg-slate-900 px-6 py-20 text-white shadow-xl sm:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-slate-950/80" />
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-slate-200 ring-1 ring-inset ring-white/20">
              сервис под ключ для вашего дома
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Найдите мастера мечты в пару кликов
              </h1>
              <p className="text-lg text-slate-200">
                Delovrukah помогает быстро подобрать проверенного специалиста для ремонта, уборки, сборки мебели и десятков других задач.
                Выберите город, опишите услугу и получите предложения от мастеров уже сегодня.
              </p>
            </div>
              <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold">{"\u003e10\u00a0000 мастеров"}</p>
                <p className="mt-1 text-slate-300">Только проверенные специалисты с подтверждённым опытом.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold">Отзывы и гарантии</p>
                <p className="mt-1 text-slate-300">Читайте отзывы клиентов и выбирайте оптимальную цену.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.7)] backdrop-blur">
            <div className="space-y-6">
              <div className="space-y-2 text-left">
                <h2 className="text-lg font-semibold text-white">Умный поиск мастера</h2>
                <p className="text-sm text-slate-200/80">
                  Выберите город, впишите услугу и мы покажем подходящие предложения.
                </p>
              </div>

              <div className="space-y-4">
                <CitySelector initialCities={cities} error={error} />
                <div className="space-y-2">
                  <label htmlFor="service-query" className="text-sm font-medium text-slate-200">
                    Что нужно сделать?
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="service-query"
                      type="search"
                      placeholder="Например, установить стиральную машину"
                      className="flex-1 rounded-xl border-0 bg-white/90 px-4 py-2 text-sm text-slate-900 shadow-inner placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white"
                    />
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                    >
                      Найти мастера
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-200/70">
                Сервис автоматически подберёт подходящие услуги и предложит лучших исполнителей в выбранном городе.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-8 px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-900">Как это работает</h2>
            <p className="text-base text-slate-600">
              Короткий путь от идеи до выполненной работы — прозрачный и удобный на каждом этапе.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Стать исполнителем
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {WORKFLOW_STEPS.map((step) => (
            <div
              key={step.title}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="absolute -top-10 right-6 text-8xl font-black text-slate-100" aria-hidden>
                {step.icon}
              </span>
              <div className="relative space-y-3">
                <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-semibold text-slate-900">Популярные категории</h2>
            <p className="text-base text-slate-600">
              После выбора города карточки станут активными и приведут к каталогу услуг.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            выбор клиентов delovrukah
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {POPULAR_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href="#"
              aria-disabled="true"
              tabIndex={-1}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-slate-300"
            >
              <span className="text-3xl" aria-hidden>
                {category.icon}
              </span>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">{category.label}</p>
                <p className="text-sm text-slate-600">{category.description}</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Доступно после выбора города
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
