"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { City } from "@/app/types/catalog.types";
import { apiBaseUrl } from "@/app/lib/catalog-api";

type CitySelectorState = "idle" | "loading" | "error";

export default function CitySelector() {
  const router = useRouter();
  const pathname = usePathname();
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [status, setStatus] = useState<CitySelectorState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();

  useEffect(() => {
    async function loadCities() {
      try {
        setStatus("loading");
        const response = await fetch(`${apiBaseUrl}/cities`, { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Failed to fetch cities: ${response.status}`);
        }

        const data: City[] = await response.json();
        setCities(data);
        setStatus("idle");
      } catch (error) {
        console.error("Failed to fetch cities", error);
        setStatus("error");
        setErrorMessage("Не удалось загрузить города. Попробуйте обновить страницу.");
      }
    }

    void loadCities();
  }, []);

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const [citySlug] = segments;
    if (citySlug) {
      setSelectedCity(citySlug);
    }
  }, [pathname]);

  const isDisabled = useMemo(() => status === "loading" || status === "error", [status]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedCity(value);
    if (!value) {
      return;
    }

    startTransition(() => {
      router.push(`/${value}`);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="city-selector" className="text-sm font-medium text-muted-foreground">
        Выберите город
      </label>
      <div className="relative">
        <select
          id="city-selector"
          className="w-full rounded border px-3 py-2 pr-8 text-sm focus:outline-none focus:ring"
          value={selectedCity}
          onChange={handleChange}
          disabled={isDisabled || isNavigating}
        >
          <option value="">Все города</option>
          {cities.map((city) => (
            <option key={city.id} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
          ▼
        </span>
      </div>
      {status === "loading" && <p className="text-xs text-muted-foreground">Загрузка городов…</p>}
      {status === "error" && errorMessage && (
        <p className="text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
