"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { City } from "../types/catalog.types"; // Исправлен путь

// Определяем пропсы, которые компонент будет принимать
type CitySelectorProps = {
  initialCities: City[];
  error?: string | null;
};

export default function CitySelector({ initialCities, error }: CitySelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isNavigating, startTransition] = useTransition();

  const currentCitySlug = pathname.split("/").filter(Boolean)[0] ?? "";

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;

    // Используем startTransition для плавного перехода без блокировки UI
    startTransition(() => {
      if (value) {
        window.localStorage.setItem("selectedCitySlug", value);
        router.push(`/${value}`);
      } else {
        window.localStorage.removeItem("selectedCitySlug");
        router.push("/"); // Если выбрали "Все города", переходим на главную
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="city-selector" className="text-sm font-medium text-slate-600">
        Выберите город
      </label>
      <div className="relative">
        <select
          id="city-selector"
          className="w-full rounded border bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          value={currentCitySlug}
          onChange={handleChange}
          disabled={!!error || isNavigating} // Блокируем, если есть ошибка загрузки или идет навигация
        >
          <option value="">Все города</option>
          {initialCities.map((city) => (
            <option key={city.id} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          ▼
        </span>
      </div>
      {/* Отображаем ошибку, если она пришла с сервера */}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}