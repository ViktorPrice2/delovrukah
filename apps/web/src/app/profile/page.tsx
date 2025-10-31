"use client";

import { useEffect } from "react";
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

  if (isLoading && !profile) {
    return <div className="p-6">Загрузка профиля...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Дашборд исполнителя</h1>
          <p className="mt-1 text-slate-600">
            Здесь собрана краткая информация о вашем профиле.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/orders"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          >
            Мои заказы
          </Link>
          <Link
            href="/profile/settings"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
          >
            Редактировать профиль
          </Link>
          <Link
            href="/profile/prices"
            className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
          >
            Управлять ценами
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div>{error}</div>
          <button
            type="button"
            onClick={() => fetchProfile().catch(() => undefined)}
            className="mt-3 inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-red-500"
          >
            Попробовать снова
          </button>
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">Основная информация</h2>
          <dl className="mt-4 space-y-2 text-sm text-slate-700">
            <div>
              <dt className="font-medium text-slate-500">Отображаемое имя</dt>
              <dd>{profile?.displayName ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Описание</dt>
              <dd>{profile?.description ? profile.description : "Описание пока не заполнено"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Город</dt>
              <dd>{profile?.cityName ?? profile?.cityId ?? "Не указан"}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
