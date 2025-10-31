"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";

import { useProviderStore } from "@/app/store/provider.store";

export default function ProviderDashboardPage() {
  const { profile, isLoading, error, fetchProfile } = useProviderStore((state) => ({
    profile: state.profile,
    isLoading: state.isLoading,
    error: state.error,
    fetchProfile: state.fetchProfile,
  }));

  useEffect(() => {
    if (!profile && !isLoading && !error) {
      fetchProfile().catch(() => undefined);
    }
  }, [profile, isLoading, error, fetchProfile]);

  const completionPercent = useMemo(() => {
    const fields = [profile?.displayName, profile?.description, profile?.cityId];
    const filled = fields.filter((value) => Boolean(value && String(value).trim().length > 0)).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile?.cityId, profile?.description, profile?.displayName]);

  const readinessLabel = completionPercent >= 80
    ? "Профиль готов к показу"
    : completionPercent >= 40
    ? "Профиль почти готов"
    : "Заполните больше информации";

  if (isLoading && !profile) {
    return <div className="p-6">Загрузка профиля...</div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 p-8 text-white shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-indigo-100/80">Кабинет исполнителя</p>
            <h1 className="text-3xl font-semibold">
              {profile?.displayName ? `Здравствуйте, ${profile.displayName}!` : "Добро пожаловать в delovrukah"}
            </h1>
            <p className="max-w-2xl text-sm text-indigo-100/90">
              Управляйте своей активностью, следите за показателями и поддерживайте профиль в актуальном состоянии.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/orders"
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Мои заказы
            </Link>
            <Link
              href="/profile/settings"
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
            >
              Обновить профиль
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-indigo-100/80">Заполненность профиля</p>
            <p className="mt-2 text-3xl font-semibold">{Number.isFinite(completionPercent) ? `${completionPercent}%` : "—"}</p>
            <p className="text-xs text-indigo-100/80">{readinessLabel}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-indigo-100/80">Город</p>
            <p className="mt-2 text-lg font-medium">
              {profile?.cityName ?? profile?.cityId ?? "Не указан"}
            </p>
            <p className="text-xs text-indigo-100/80">Укажите город, чтобы вас легче находили клиенты</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-indigo-100/80">Описание</p>
            <p className="mt-2 text-lg font-medium">
              {profile?.description ? "Заполнено" : "Не заполнено"}
            </p>
            <p className="text-xs text-indigo-100/80">Информативное описание помогает выделиться</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
          <div>{error}</div>
          <button
            type="button"
            onClick={() => fetchProfile().catch(() => undefined)}
            className="mt-3 inline-flex items-center rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500"
          >
            Попробовать снова
          </button>
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Основная информация</h2>
            <p className="text-sm text-slate-500">Данные, которые видят клиенты на карточке исполнителя.</p>
          </header>
          <dl className="space-y-4 text-sm text-slate-600">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Отображаемое имя</dt>
              <dd className="text-base font-medium text-slate-900">{profile?.displayName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Описание</dt>
              <dd className="leading-relaxed">
                {profile?.description ? profile.description : "Описание пока не заполнено. Расскажите о своем опыте и ключевых компетенциях."}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Город</dt>
              <dd>{profile?.cityName ?? profile?.cityId ?? "Не указан"}</dd>
            </div>
          </dl>
          <Link
            href="/profile/settings"
            className="inline-flex w-fit items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Редактировать раздел
          </Link>
        </article>

        <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Следующие шаги</h2>
            <p className="text-sm text-slate-500">Подсказки, которые помогут улучшить профиль.</p>
          </header>
          <ul className="space-y-4 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              <div>
                <p className="font-medium text-slate-900">Заполните описание услуг</p>
                <p className="text-slate-500">Уточните специализацию, чтобы привлечь подходящие заказы.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <div>
                <p className="font-medium text-slate-900">Проверьте актуальность цен</p>
                <p className="text-slate-500">В разделе «Цены» укажите стоимость популярных услуг.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-amber-500" />
              <div>
                <p className="font-medium text-slate-900">Отслеживайте новые заказы</p>
                <p className="text-slate-500">Проверяйте раздел «Мои заказы», чтобы оперативно отвечать клиентам.</p>
              </div>
            </li>
          </ul>
          <Link
            href="/profile/prices"
            className="inline-flex w-fit items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            Настроить цены
          </Link>
        </article>
      </section>
    </div>
  );
}
