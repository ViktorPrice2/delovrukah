'use client';

import { useMemo, useState } from 'react';

import type { Provider, ServiceDetail } from '@/app/types/catalog.types';

import { AddToCartButton } from './AddToCartButton';

type ViewMode = 'list' | 'map';

type PriorityKey = 'speed' | 'quality' | 'price';

type PriorityTag = {
  key: PriorityKey;
  label: string;
};

const PRIORITY_TAGS: PriorityTag[] = [
  { key: 'speed', label: 'Скорость' },
  { key: 'quality', label: 'Качество' },
  { key: 'price', label: 'Цена' },
];

const ITEMS_PER_PAGE = 5;

type ProviderCardProps = {
  provider: Provider;
  service: ServiceDetail;
};

const BADGES = [
  'Топ-мастер',
  'Быстрый выезд',
  'Гарантия 12 мес.',
  'Безналичный расчёт',
  'Работаем с юрлицами',
];

function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
}

function computeHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getRating(id: string): { rating: number; reviews: number } {
  const hash = computeHash(id);
  const rating = 4 + ((hash % 10) / 10 + 0.1);
  const reviews = 25 + (hash % 75);
  return { rating: Math.min(4.9, parseFloat(rating.toFixed(1))), reviews };
}

function getPriorityMetrics(
  provider: Provider,
  serviceEstimatedTime: string | null,
): Record<PriorityKey, number> {
  const estimatedTimeMinutes =
    parseEstimatedTimeToMinutes(serviceEstimatedTime) ??
    parseEstimatedTimeToMinutes(provider.estimatedTime) ??
    Number.POSITIVE_INFINITY;
  const quality = getRating(provider.id).rating * 10;
  const price = provider.price;

  return {
    speed: estimatedTimeMinutes,
    quality,
    price,
  };
}

function getBadges(id: string): string[] {
  const hash = computeHash(id);
  const badges: string[] = [];
  for (let i = 0; i < BADGES.length; i += 1) {
    if (badges.length === 2) {
      break;
    }
    if ((hash >> i) % 2 === 1) {
      badges.push(BADGES[i]);
    }
  }
  if (badges.length === 0) {
    badges.push(BADGES[hash % BADGES.length]);
  }
  return badges;
}

function getAvailability(id: string): string {
  const hash = computeHash(id);
  const mod = hash % 3;

  if (mod === 0) {
    return 'Готов приступить сегодня';
  }

  if (mod === 1) {
    return 'Свободен завтра';
  }

  return `Старт через ${mod + 1} дня`;
}

function parseEstimatedTimeToMinutes(
  estimatedTime: string | null | undefined,
): number | null {
  if (!estimatedTime) {
    return null;
  }

  const normalized = estimatedTime.toLowerCase().replace(',', '.').trim();
  const match = normalized.match(/\d+(?:\.\d+)?/);

  if (!match) {
    return null;
  }

  const value = Number.parseFloat(match[0]);

  if (Number.isNaN(value)) {
    return null;
  }

  if (normalized.includes('мин')) {
    return Math.round(value);
  }

  if (normalized.includes('час')) {
    return Math.round(value * 60);
  }

  if (normalized.includes('дн')) {
    return Math.round(value * 24 * 60);
  }

  return Math.round(value);
}

function ProviderCard({ provider, service }: ProviderCardProps) {
  const initials = useMemo(() => getInitials(provider.displayName || provider.id), [provider]);
  const meta = useMemo(() => getRating(provider.id), [provider.id]);
  const badges = useMemo(() => getBadges(provider.id), [provider.id]);
  const availability = useMemo(() => getAvailability(provider.id), [provider.id]);
  const estimatedTimeLabel =
    provider.estimatedTime ?? service.estimatedTime ?? service.latestVersion?.estimatedTime ?? null;

  return (
    <li className="group rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700">
              {initials || 'DR'}
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-900">{provider.displayName}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  {meta.rating.toFixed(1)}
                </span>
                <span>{meta.reviews} отзывов</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {availability}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-none flex-col items-start sm:items-end">
            <span className="text-lg font-bold text-slate-900">{provider.price.toLocaleString('ru-RU')} ₽</span>
            {service.latestVersion?.unitOfMeasure ? (
              <span className="text-xs text-slate-500">за {service.latestVersion.unitOfMeasure.toLowerCase()}</span>
            ) : null}
            {provider.hourlyRate != null ? (
              <span className="text-xs text-slate-500">
                Доп. работы: {provider.hourlyRate.toLocaleString('ru-RU')} ₽/час
              </span>
            ) : null}
          </div>
        </div>

        {provider.description ? (
          <p className="text-sm leading-relaxed text-slate-600">{provider.description}</p>
        ) : null}

        <div className="flex flex-wrap gap-2 text-xs">
          {estimatedTimeLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              <span role="img" aria-label="Время">
                ⏱️
              </span>
              {estimatedTimeLabel}
            </span>
          ) : null}
          {badges.map((badge) => (
            <span
              key={`${provider.id}-${badge}`}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700"
            >
              {badge}
            </span>
          ))}
        </div>

        <AddToCartButton
          service={service}
          provider={provider}
          label="Выбрать мастера"
        />
      </div>
    </li>
  );
}

function Marker({ provider }: { provider: Provider }) {
  const hash = computeHash(provider.id);
  const top = 10 + (hash % 70);
  const left = 10 + ((hash >> 3) % 70);
  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      style={{ top: `${top}%`, left: `${left}%` }}
    >
      <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-700 shadow">{provider.displayName}</span>
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">★</span>
    </div>
  );
}

type ProvidersSectionProps = {
  providers: Provider[];
  service: ServiceDetail;
  cityName: string;
};

export function ServiceProvidersSection({ providers, service, cityName }: ProvidersSectionProps) {
  const [view, setView] = useState<ViewMode>('list');
  const [selectedPriorities, setSelectedPriorities] = useState<PriorityKey[]>(['quality', 'price']);
  const [currentPage, setCurrentPage] = useState(1);
  const hasProviders = providers.length > 0;
  const serviceEstimatedTime = service.estimatedTime ?? service.latestVersion?.estimatedTime ?? null;

  const priorityTags = PRIORITY_TAGS;

  const providersWithMetrics = useMemo(
    () =>
      providers.map((provider) => ({
        provider,
        metrics: getPriorityMetrics(provider, serviceEstimatedTime),
      })),
    [providers, serviceEstimatedTime],
  );

  const sortedProviders = useMemo(() => {
    if (selectedPriorities.length === 0) {
      return providers;
    }

    return [...providersWithMetrics]
      .sort((a, b) => {
        for (const priority of selectedPriorities) {
          const valueA = a.metrics[priority];
          const valueB = b.metrics[priority];

          if (valueA !== valueB) {
            if (priority === 'price' || priority === 'speed') {
              return valueA - valueB;
            }
            return valueB - valueA;
          }
        }
        return a.provider.displayName.localeCompare(b.provider.displayName);
      })
      .map((item) => item.provider);
  }, [providers, providersWithMetrics, selectedPriorities]);

  const totalPages = Math.max(1, Math.ceil(sortedProviders.length / ITEMS_PER_PAGE));
  const clampedPage = Math.min(currentPage, totalPages);
  const pageOffset = (clampedPage - 1) * ITEMS_PER_PAGE;
  const paginatedProviders = sortedProviders.slice(pageOffset, pageOffset + ITEMS_PER_PAGE);
  const startIndex = sortedProviders.length === 0 ? 0 : pageOffset + 1;
  const endIndex = pageOffset + paginatedProviders.length;

  const handlePriorityToggle = (priority: PriorityKey) => {
    setSelectedPriorities((prev) => {
      if (prev.includes(priority)) {
        return prev.filter((item) => item !== priority);
      }

      if (prev.length < 2) {
        return [...prev, priority];
      }

      return [priority, prev[0]];
    });
    setCurrentPage(1);
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    setCurrentPage((prev) => {
      if (direction === 'next') {
        return Math.min(prev + 1, totalPages);
      }
      return Math.max(prev - 1, 1);
    });
  };

  return (
    <section id="providers" className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Исполнители в г. {cityName}</h2>
          <p className="text-sm text-slate-500">Выберите мастера и согласуйте удобное время.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 p-1">
          {(['list', 'map'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                view === mode
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {mode === 'list' ? 'Список' : 'Карта'}
            </button>
          ))}
        </div>
      </div>

      {hasProviders ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ваш приоритет</p>
              <p className="text-sm text-slate-500">Выберите до двух, чтобы отсортировать список мастеров.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {priorityTags.map((tag) => {
                const isActive = selectedPriorities.includes(tag.key);
                return (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => handlePriorityToggle(tag.key)}
                    aria-pressed={isActive}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                  >
                    {isActive ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                        {selectedPriorities.indexOf(tag.key) + 1}
                      </span>
                    ) : null}
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>
              Мастера {startIndex}–{endIndex} из {sortedProviders.length}
            </span>
            {totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange('prev')}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={clampedPage === 1}
                >
                  Назад
                </button>
                <span className="min-w-[90px] text-center">
                  Стр. {clampedPage} из {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange('next')}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={clampedPage === totalPages}
                >
                  Вперёд
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {hasProviders ? (
        view === 'list' ? (
          <ul className="space-y-4">
            {paginatedProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} service={service} />
            ))}
          </ul>
        ) : (
          <div className="relative h-96 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 shadow-inner">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.12),_transparent_55%)]" />
            <div className="absolute inset-6 rounded-3xl border border-dashed border-emerald-200" />
            {sortedProviders.map((provider) => (
              <Marker key={provider.id} provider={provider} />
            ))}
            <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-slate-600 shadow">
              Приближенное расположение мастеров
            </div>
          </div>
        )
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center">
          <p className="text-base font-semibold text-slate-600">
            К сожалению, в вашем городе пока нет исполнителей для этой услуги.
          </p>
          <p className="mt-2 text-sm text-slate-500">Оставьте заявку — мы сообщим, когда мастера появятся.</p>
        </div>
      )}
    </section>
  );
}

export default ServiceProvidersSection;
