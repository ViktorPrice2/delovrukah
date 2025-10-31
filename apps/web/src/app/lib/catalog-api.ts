import { getApiBaseUrl } from "@/lib/get-api-base-url";
import type { Category, City, ServiceDetail } from "../types/catalog.types";
import {
  findMockServiceBySlugOrId,
  getMockCategories,
  getMockCities,
  getMockServicesByCategorySlug,
} from "./mock-data";

/**
 * Обертка для fetch, которая обрабатывает ответы от API.
 * Возвращает данные типа T в случае успеха, или null в случае ошибки 404.
 * В случае других ошибок выбрасывает исключение.
 * @param path - Путь к эндпоинту API (например, '/cities')
 * @returns {Promise<T | null>}
 */
async function fetchFromApi<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      // 'no-store' гарантирует, что мы всегда получаем свежие данные.
      // В будущем можно будет настроить более умное кэширование.
      cache: "no-store", 
    });

    // Если ответ НЕ успешный
    if (!response.ok) {
      // Если это ошибка "Не найдено", просто возвращаем null
      if (response.status === 404) {
        console.warn(`API returned 404 for path: ${path}`);
        return null;
      }
      // Для всех остальных ошибок (500, 401, и т.д.) выбрасываем исключение
      throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
    }

    // Если все хорошо, возвращаем JSON
    return response.json() as Promise<T>;

  } catch (error) {
    // Обрабатываем сетевые ошибки (например, API недоступен)
    console.error(`Network or fetch error for path ${path}:`, error);
    // Возвращаем null, чтобы страница могла показать 404, а не упасть с ошибкой 500
    return null;
  }
}

// --- Функции для получения данных ---

export async function getCities(): Promise<City[]> {
  const cities = await fetchFromApi<City[]>("/cities");

  if (cities && cities.length > 0) {
    return cities;
  }

  const fallback = getMockCities();

  if (fallback.length > 0) {
    console.warn("Falling back to mock city data because the API is unavailable.");
    return fallback;
  }

  throw new Error("Cities data is unavailable");
}

export async function getCategories(citySlug: string): Promise<Category[]> {
  const categories = await fetchFromApi<Category[]>(`/categories?citySlug=${encodeURIComponent(citySlug)}`);

  if (categories && categories.length > 0) {
    return categories;
  }

  const fallback = getMockCategories();

  if (fallback.length > 0) {
    console.warn(
      `Falling back to mock category data for city "${citySlug}" because the API is unavailable.`,
    );
    return fallback;
  }

  return [];
}

export async function getServicesByCategory(citySlug: string, categorySlug: string): Promise<ServiceDetail[]> {
  const services = await fetchFromApi<ServiceDetail[]>(
    `/services?citySlug=${encodeURIComponent(citySlug)}&categorySlug=${encodeURIComponent(categorySlug)}`
  );

  if (services && services.length > 0) {
    return services;
  }

  const fallback = getMockServicesByCategorySlug(categorySlug, citySlug);

  if (fallback.length > 0) {
    console.warn(
      `Falling back to mock services for category "${categorySlug}" in city "${citySlug}" because the API is unavailable.`,
    );
    return fallback;
  }

  return [];
}

/**
 * Получает детальную информацию об услуге по ее слагу и слагу города.
 * @param serviceSlug - Слаг услуги (например, 'ustanovka-unitaza')
 * @param citySlug - Слаг города (например, 'moskva')
 * @returns {Promise<ServiceDetail | null>} - Объект услуги или null, если не найдено.
 */
export async function getServiceDetailsBySlug(
  serviceSlug: string | null | undefined,
  citySlug: string,
  fallbackId?: string
): Promise<ServiceDetail | null> {
  const normalizedSlug = serviceSlug?.trim();
  const normalizedFallback = fallbackId?.trim();

  const tryMockFallback = (): ServiceDetail | null => {
    const candidates = [normalizedSlug, normalizedFallback].filter(
      (value): value is string => Boolean(value && value.length > 0)
    );

    for (const candidate of candidates) {
      const mockService = findMockServiceBySlugOrId(candidate, citySlug);

      if (mockService) {
        console.warn(
          `Falling back to mock service data for "${candidate}" in city "${citySlug}" because the API is unavailable.`
        );
        return mockService;
      }
    }

    return null;
  };

  let primary: ServiceDetail | null = null;

  if (normalizedSlug) {
    primary = await fetchFromApi<ServiceDetail>(
      `/services/${encodeURIComponent(normalizedSlug)}?citySlug=${encodeURIComponent(citySlug)}`
    );

    if (primary) {
      return primary;
    }
  } else if (!normalizedFallback) {
    // Нечего искать: слаг не передан и альтернативный идентификатор отсутствует.
    return tryMockFallback();
  }

  if (!normalizedFallback || normalizedFallback.length === 0) {
    return primary ?? tryMockFallback();
  }

  if (normalizedSlug && normalizedFallback === normalizedSlug) {
    return primary ?? tryMockFallback();
  }

  const fallbackService = await fetchFromApi<ServiceDetail>(
    `/services/${encodeURIComponent(normalizedFallback)}?citySlug=${encodeURIComponent(citySlug)}`
  );

  if (fallbackService) {
    return fallbackService;
  }

  return tryMockFallback();
}
