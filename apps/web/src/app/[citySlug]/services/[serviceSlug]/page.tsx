import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Используем наш централизованный API-клиент
import { getServiceDetailsBySlug } from "@/app/lib/catalog-api"; 
// Предполагается, что в catalog-api.ts будет такая функция
// И типы будут импортироваться оттуда же или из types/catalog.types.ts
import type { ServiceDetail } from "@/app/types/catalog.types"; 

export const dynamic = "force-dynamic";

type ServicePageProps = {
  params: { 
    citySlug: string;
    serviceSlug: string; 
  };
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
export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { citySlug, serviceSlug } = await params;

  // Делаем ОДИН запрос, чтобы получить все данные
  const service = await getServiceDetailsBySlug(serviceSlug, citySlug);

  if (!service) {
    return {
      title: "Услуга не найдена | Delovrukah.ru",
      description: "Запрошенная вами услуга не найдена. Возможно, она была перемещена или удалена."
    };
  }

  const minPrice = getMinimalPrice(service);
  const priceLabel = minPrice ? `от ${minPrice.toLocaleString('ru-RU')} ₽` : "цена договорная";

  return {
    title: `Заказать ${service.name} в г. ${service.providers?.[0]?.city.name ?? citySlug} - цены ${priceLabel} | Delovrukah.ru`,
    description: service.description ?? `Узнайте подробности и закажите услугу «${service.name}» в городе ${service.providers?.[0]?.city.name ?? citySlug}.`,
  };
}

// --- КОМПОНЕНТ СТРАНИЦЫ ---
export default async function ServicePage({ params }: ServicePageProps) {
  const { citySlug, serviceSlug } = await params;

  // --- НАЧАЛО ДИАГНОСТИКИ ---
  console.log(`[SSR] Запрашиваю услугу: slug=${serviceSlug}, city=${citySlug}`);
  const service = await getServiceDetailsBySlug(serviceSlug, citySlug);
  console.log('[SSR] Получен ответ от API:', JSON.stringify(service, null, 2)); // Выводим в красивом формате
  // --- КОНЕЦ ДИАГНОСТИКИ ---

  // Проверяем, что API вернул данные. Если нет - 404.
  if (!service) {
    console.log('[SSR] Услуга не найдена в API, вызываю notFound()');
    notFound();
  }

  const minPrice = getMinimalPrice(service);

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      <header className="space-y-2 border-b pb-4">
        {/* Хлебные крошки для навигации и SEO */}
        <nav className="text-sm text-muted-foreground">
          <a href={`/${citySlug}`} className="hover:underline">{service.providers?.[0]?.city.name ?? 'Город'}</a>
          {' / '}
          <a href={`/${citySlug}/${service.category.slug}`} className="hover:underline">{service.category.name}</a>
        </nav>
        <h1 className="text-4xl font-bold tracking-tight">{service.name}</h1>
        <p className="text-xl text-muted-foreground">
          {minPrice !== null ? `от ${minPrice.toLocaleString('ru-RU')} ₽` : "Цена по договоренности"}
        </p>
      </header>

      {service.description && (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Описание услуги</h2>
          <p className="text-base leading-relaxed">{service.description}</p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Исполнители в г. {service.providers?.[0]?.city.name ?? citySlug}</h2>
        {service.providers && service.providers.length > 0 ? (
          <ul className="space-y-4">
            {service.providers.map((provider) => (
              <li key={provider.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 transition hover:shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="font-medium">{provider.displayName}</div>
                  <div className="text-lg font-bold whitespace-nowrap">
                    {provider.price.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                {provider.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{provider.description}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">К сожалению, в вашем городе пока нет исполнителей для этой услуги.</p>
            <p className="text-sm text-muted-foreground mt-1">Они скоро появятся!</p>
          </div>
        )}
      </section>
    </div>
  );
}