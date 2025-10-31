"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

function formatCitySlug(slug: string): string {
  return slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export default function CurrentCityDisplay() {
  const pathname = usePathname();

  const citySlug = useMemo(() => {
    return pathname
      .split("/")
      .filter(Boolean)
      .at(0);
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
