"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AdminCategory, AdminServiceTemplate } from "./types";

export default function AdminServicesPage() {
  const [services, setServices] = useState<AdminServiceTemplate[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [servicesResponse, categoriesResponse] = await Promise.all([
          api.get<AdminServiceTemplate[]>("/admin/services"),
          api.get<AdminCategory[]>("/admin/categories"),
        ]);

        if (!isMounted) {
          return;
        }

        setServices(servicesResponse.data);
        setCategories(categoriesResponse.data);
        setError(null);
      } catch (loadError) {
        console.error(loadError);
        if (!isMounted) {
          return;
        }
        setError("Не удалось загрузить данные админ-панели. Попробуйте обновить страницу.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredServices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesCategory =
        categoryFilter === "all" || service.categoryId === categoryFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        service.name.toLowerCase().includes(normalizedSearch) ||
        service.slug.toLowerCase().includes(normalizedSearch) ||
        service.categoryName.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [services, categoryFilter, search]);

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Шаблоны услуг</h1>
          <p className="mt-1 text-sm text-slate-500">
            Управляйте сервисами каталога, создавайте новые карточки и обновляйте их версии.
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          Создать услугу
        </Link>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию или slug"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:max-w-xs"
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:w-64"
            >
              <option value="all">Все категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-10 text-sm text-slate-500">Загрузка данных...</div>
        ) : error ? (
          <div className="mt-10 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
            Услуги не найдены. Попробуйте изменить фильтры или создать новую запись.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Название
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Категория
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Активная версия
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Средняя цена
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Обновлено
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                {filteredServices.map((service) => {
                  const latestVersion = service.latestVersion ?? service.versions[0] ?? null;
                  return (
                    <tr key={service.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{service.name}</span>
                          <span className="text-xs text-slate-500">{service.slug}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{service.categoryName}</td>
                      <td className="px-4 py-3">
                        {latestVersion ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              v{latestVersion.versionNumber}
                            </span>
                            <span className="text-xs text-slate-500 line-clamp-2">
                              {latestVersion.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Версии отсутствуют</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {service.medianPrice !== null && service.medianPrice !== undefined
                          ? new Intl.NumberFormat("ru-RU").format(service.medianPrice)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDate(service.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/services/${service.id}/edit`}
                          className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600"
                        >
                          Изменить
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
