"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useProviderStore } from "@/app/store/provider.store";

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
      await updateProfile({
        displayName: values.displayName,
        description: values.description,
        cityId: values.cityId,
      });
      setSuccessMessage("Профиль успешно обновлен");
      reset(values);
    } catch (error) {
      console.error("Failed to submit profile form", error);
    }
  };

  if (isLoading && !profile) {
    return <div className="p-6">Загрузка настроек...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Настройки профиля</h1>
        <p className="mt-2 text-slate-600">
          Обновите информацию о себе, чтобы клиенты могли лучше вас узнать.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-xl font-semibold text-amber-900">
          Добро пожаловать! Пожалуйста, заполните ваш профиль, чтобы начать работу
        </h2>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div>{error}</div>
          <button
            type="button"
            onClick={() => fetchProfile().catch(() => undefined)}
            className="mt-3 inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-red-500"
          >
            Повторить загрузку профиля
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="displayName">
            Отображаемое имя
          </label>
          <input
            id="displayName"
            type="text"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="Например, Иван Иванов"
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="text-sm text-red-600">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="description">
            Описание
          </label>
          <textarea
            id="description"
            rows={5}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="Расскажите о своем опыте и услугах"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="cityId">
            Город
          </label>
          <select
            id="cityId"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
            <p className="text-sm text-red-600">{citiesError}</p>
          )}
          {errors.cityId && <p className="text-sm text-red-600">{errors.cityId.message}</p>}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isUpdating || isLoading || isCitiesLoading || !isDirty}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {isUpdating ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </div>
      </form>
    </div>
  );
}
