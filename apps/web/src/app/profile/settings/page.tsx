"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { api } from "@/lib/api";
import { useProviderStore } from "@/app/store/provider.store";

const hourlyRatePattern = /^\d+(?:[.,]\d{0,2})?$/;

const formatHourlyRateInput = (rate: number | null | undefined): string =>
  typeof rate === "number" && !Number.isNaN(rate) ? rate.toString() : "";

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Минимум 2 символа")
    .max(100, "Максимум 100 символов"),
  description: z
    .string()
    .min(10, "Минимум 10 символов")
    .max(1000, "Максимум 1000 символов"),
  cityId: z.string().min(1, "Выберите город"),
  hourlyRate: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 ||
        (hourlyRatePattern.test(value) &&
          Number.parseFloat(value.replace(",", ".")) >= 0),
      "Введите неотрицательное число или оставьте поле пустым",
    ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface CityDto {
  id: string | number;
  name: string;
}

export default function ProviderSettingsPage() {
  const {
    profile,
    isLoading,
    isUpdating,
    error,
    fetchProfile,
    updateProfile,
    resetError,
  } = useProviderStore((state) => ({
    profile: state.profile,
    isLoading: state.isLoading,
    isUpdating: state.isUpdating,
    error: state.error,
    fetchProfile: state.fetchProfile,
    updateProfile: state.updateProfile,
    resetError: state.resetError,
  }));

  const [cities, setCities] = useState<CityDto[]>([]);
  const [isCitiesLoading, setIsCitiesLoading] = useState<boolean>(true);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName ?? "",
      description: profile?.description ?? "",
      cityId: profile?.cityId ? String(profile.cityId) : "",
      hourlyRate: formatHourlyRateInput(profile?.hourlyRate),
    },
  });

  useEffect(() => {
    if (!profile && !isLoading && !error) {
      fetchProfile().catch(() => undefined);
    }
  }, [profile, isLoading, error, fetchProfile]);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await api.get<CityDto[]>("/cities");
        setCities(response.data);
        setCitiesError(null);
      } catch (error) {
        console.error("Failed to load cities", error);
        setCitiesError("Не удалось загрузить список городов");
      } finally {
        setIsCitiesLoading(false);
      }
    };

    loadCities();
  }, []);

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName ?? "",
        description: profile.description ?? "",
        cityId: profile.cityId ? String(profile.cityId) : "",
        hourlyRate: formatHourlyRateInput(profile.hourlyRate),
      });
    }
  }, [profile, reset]);

  useEffect(() => {
    resetError();
  }, [resetError]);

  useEffect(() => {
    if (error) {
      setSuccessMessage(null);
    }
  }, [error]);

  useEffect(() => {
    if (isDirty) {
      setSuccessMessage(null);
    }
  }, [isDirty]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const normalizedHourlyRate = values.hourlyRate.trim();
      const hourlyRate =
        normalizedHourlyRate.length === 0
          ? null
          : Number.parseFloat(normalizedHourlyRate.replace(",", "."));

      await updateProfile({
        displayName: values.displayName,
        description: values.description,
        cityId: values.cityId,
        hourlyRate,
      });
      setSuccessMessage("Профиль успешно обновлен");
      reset({
        ...values,
        hourlyRate: normalizedHourlyRate,
      });
    } catch (error) {
      console.error("Failed to submit profile form", error);
    }
  };

  if (isLoading && !profile) {
    return <div className="p-6">Загрузка настроек...</div>;
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-wide text-indigo-100/80">Настройки профиля</p>
        <h1 className="mt-2 text-3xl font-semibold">Обновите информацию о себе</h1>
        <p className="mt-3 max-w-2xl text-sm text-indigo-100/90">
          Сформируйте привлекательную карточку исполнителя: укажите имя, расскажите об опыте и выберите город, чтобы получать больше подходящих запросов.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-700">
          <p className="font-semibold">Совет</p>
          <p className="mt-2 text-indigo-600/80">Персонализированное описание с конкретными примерами работ помогает выделиться среди других исполнителей.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600 shadow-sm">
          <p className="font-semibold text-slate-900">Статус заполнения</p>
          <p className="mt-2">{profile?.displayName ? "Имя указано" : "Добавьте отображаемое имя"}</p>
          <p>{profile?.description ? "Описание заполнено" : "Расскажите о своем опыте"}</p>
          <p>{profile?.cityId ? "Город выбран" : "Выберите город, где вы работаете"}</p>
          <p>
            {profile?.hourlyRate !== null && profile?.hourlyRate !== undefined
              ? "Почасовая ставка указана"
              : "Укажите почасовую ставку"}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
          <div>{error}</div>
          <button
            type="button"
            onClick={() => fetchProfile().catch(() => undefined)}
            className="mt-3 inline-flex items-center rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500"
          >
            Повторить загрузку профиля
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">Основные данные</h2>
              <p className="text-sm text-slate-500">Имя поможет клиентам узнать, кто будет выполнять работу.</p>
            </header>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="displayName">
                Отображаемое имя
              </label>
              <input
                id="displayName"
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Например, Иван Иванов"
                {...register("displayName")}
              />
              {errors.displayName && (
                <p className="text-sm text-rose-600">{errors.displayName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="hourlyRate">
                Моя почасовая ставка за доп. работы, ₽/час
              </label>
              <input
                id="hourlyRate"
                type="text"
                inputMode="decimal"
                pattern="[0-9,.]*"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Например, 1500"
                {...register("hourlyRate")}
              />
              <p className="text-xs text-slate-500">
                Оставьте поле пустым, если готовы обсуждать стоимость дополнительных работ отдельно.
              </p>
              {errors.hourlyRate && (
                <p className="text-sm text-rose-600">{errors.hourlyRate.message}</p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">Город деятельности</h2>
              <p className="text-sm text-slate-500">Выберите локацию, чтобы получить запросы поблизости.</p>
            </header>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="cityId">
                Город
              </label>
              <select
                id="cityId"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                disabled={isCitiesLoading}
                {...register("cityId")}
              >
                <option value="">Выберите город</option>
                {isCitiesLoading && <option value="" disabled>Загрузка...</option>}
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              {citiesError && (
                <p className="text-sm text-rose-600">{citiesError}</p>
              )}
              {errors.cityId && <p className="text-sm text-rose-600">{errors.cityId.message}</p>}
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Описание и опыт</h2>
            <p className="text-sm text-slate-500">Расскажите о сильных сторонах, чтобы клиенты выбрали именно вас.</p>
          </header>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="description">
              Описание
            </label>
            <textarea
              id="description"
              rows={6}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Расскажите о своем опыте и услугах"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-rose-600">{errors.description.message}</p>
            )}
          </div>
        <p className="text-xs text-slate-500">
          Подсказка: включите перечень ключевых услуг, опыт работы и форматы сотрудничества.
        </p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-slate-500">
            Сохраните изменения, чтобы обновить карточку исполнителя и уведомить клиентов о нововведениях.
          </span>
          <button
            type="submit"
            disabled={isUpdating || isLoading || isCitiesLoading || !isDirty}
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {isUpdating ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </div>
      </form>
    </div>
  );
}
