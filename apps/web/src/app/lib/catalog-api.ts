import type { Category, City, Service } from "@/app/types/catalog.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is not defined. Please configure the API base URL to use the catalog pages."
  );
}

export const apiBaseUrl = API_BASE_URL;

async function fetchFromApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getCities(): Promise<City[]> {
  return fetchFromApi<City[]>("/cities");
}

export async function getCity(slug: string): Promise<City | undefined> {
  const cities = await getCities();
  return cities.find((city) => city.slug === slug);
}

export async function getCategoriesByCity(citySlug: string): Promise<Category[]> {
  return fetchFromApi<Category[]>(`/categories?citySlug=${encodeURIComponent(citySlug)}`);
}

export async function getCategoryBySlug(
  citySlug: string,
  categorySlug: string
): Promise<Category | undefined> {
  const categories = await getCategoriesByCity(citySlug);
  return categories.find((category) => category.slug === categorySlug);
}

export async function getServicesByCategory(
  citySlug: string,
  categorySlug: string
): Promise<Service[]> {
  return fetchFromApi<Service[]>(
    `/services?citySlug=${encodeURIComponent(citySlug)}&categorySlug=${encodeURIComponent(categorySlug)}`
  );
}

export async function getServiceDetail(
  citySlug: string,
  serviceSlug: string
): Promise<Service> {
  return fetchFromApi<Service>(
    `/services/${encodeURIComponent(serviceSlug)}?citySlug=${encodeURIComponent(citySlug)}`
  );
}
