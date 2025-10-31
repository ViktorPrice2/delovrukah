"use client";

import { startTransition, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const RESERVED_ROUTES = new Set([
  "checkout",
  "orders",
  "profile",
  "signin",
  "signup",
]);

const STORAGE_KEY = "selectedCitySlug";

function formatCitySlug(slug: string): string {
  return slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export default function CurrentCityDisplay() {
  const pathname = usePathname();
  const [citySlug, setCitySlug] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const segments = window.location.pathname.split("/").filter(Boolean);
    const potentialCity = segments.at(0);

    if (potentialCity && !RESERVED_ROUTES.has(potentialCity)) {
      return potentialCity;
    }

    return window.localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const potentialCity = segments.at(0);

    if (potentialCity && !RESERVED_ROUTES.has(potentialCity)) {
      startTransition(() => {
        setCitySlug(potentialCity);
      });
      window.localStorage.setItem(STORAGE_KEY, potentialCity);
      return;
    }

    const storedCity = window.localStorage.getItem(STORAGE_KEY);
    startTransition(() => {
      setCitySlug(storedCity);
    });
  }, [pathname]);

  if (!citySlug) {
    return <div className="text-sm text-slate-500">Город не выбран</div>;
  }

  return (
    <div className="text-sm text-slate-700">
      Текущий город: <span className="font-semibold">{formatCitySlug(citySlug)}</span>
    </div>
  );
}
