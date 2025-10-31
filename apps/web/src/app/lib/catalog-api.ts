import { getApiBaseUrl } from "@/lib/get-api-base-url";
import type {
  Category,
  City,
  ServiceDetail,
  ServiceMediaItem,
  ServiceVersion,
} from "../types/catalog.types";
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

function normalizeStringArray(value: unknown): string[] | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }
        if (item == null) {
          return "";
        }
        return String(item).trim();
      })
      .filter((item) => item.length > 0);

    return normalized.length > 0 ? normalized : null;
  }

  if (typeof value === "string") {
    const normalized = value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return normalized.length > 0 ? normalized : null;
  }

  return String(value).trim().length > 0 ? [String(value).trim()] : null;
}

function normalizeMediaItem(item: unknown, title: string): ServiceMediaItem | null {
  if (!item) {
    return null;
  }

  if (typeof item === "string") {
    const trimmed = item.trim();
    if (!trimmed) {
      return null;
    }
    return {
      type: "image",
      url: trimmed,
      alt: `${title}`,
    };
  }

  if (typeof item === "object") {
    const record = item as Record<string, unknown>;
    const type = record.type === "video" ? "video" : "image";
    const url = typeof record.url === "string" ? record.url.trim() : "";

    if (!url) {
      return null;
    }

    const altValue = record.alt;
    const alt = typeof altValue === "string" && altValue.trim().length > 0 ? altValue.trim() : null;
    const preview = record.previewUrl;
    const previewUrl = typeof preview === "string" && preview.trim().length > 0 ? preview.trim() : null;

    return {
      type,
      url,
      alt,
      previewUrl,
    };
  }

  return null;
}

function normalizeMedia(value: unknown, title: string): ServiceMediaItem[] | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => normalizeMediaItem(item, title))
      .filter((item): item is ServiceMediaItem => Boolean(item));
    return normalized.length > 0 ? normalized : null;
  }

  const single = normalizeMediaItem(value, title);
  return single ? [single] : null;
}

function normalizeServiceVersion(version: ServiceVersion | null | undefined): ServiceVersion | null {
  if (!version) {
    return null;
  }

  const unitOfMeasure = typeof version.unitOfMeasure === "string" ? version.unitOfMeasure.trim() : null;
  const estimatedTime =
    typeof version.estimatedTime === "string" ? version.estimatedTime.trim() : null;

  return {
    ...version,
    description: version.description ?? null,
    whatsIncluded: normalizeStringArray(version.whatsIncluded),
    whatsNotIncluded: normalizeStringArray(version.whatsNotIncluded),
    unitOfMeasure: unitOfMeasure && unitOfMeasure.length > 0 ? unitOfMeasure : null,
    requiredTools: normalizeStringArray(version.requiredTools),
    customerRequirements: normalizeStringArray(version.customerRequirements),
    media: normalizeMedia(version.media, version.title),
    estimatedTime: estimatedTime && estimatedTime.length > 0 ? estimatedTime : null,
  };
}

function normalizeServiceDetail(service: ServiceDetail): ServiceDetail {
  return {
    ...service,
    description: service.description ?? null,
    latestVersion: normalizeServiceVersion(service.latestVersion),
    providers: service.providers?.map((provider) => ({
      ...provider,
      description: provider.description ?? null,
      hourlyRate:
        typeof provider.hourlyRate === "number"
          ? provider.hourlyRate
          : provider.hourlyRate !== null && provider.hourlyRate !== undefined
          ? Number(provider.hourlyRate)
          : null,
      estimatedTime:
        typeof provider.estimatedTime === "string"
          ? provider.estimatedTime.trim() || null
          : null,
    })),
  };
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
    return services.map(normalizeServiceDetail);
  }

  const fallback = getMockServicesByCategorySlug(categorySlug, citySlug);

  if (fallback.length > 0) {
    console.warn(
      `Falling back to mock services for category "${categorySlug}" in city "${citySlug}" because the API is unavailable.`,
    );
    return fallback.map(normalizeServiceDetail);
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
        return normalizeServiceDetail(mockService);
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
      return normalizeServiceDetail(primary);
    }
  } else if (!normalizedFallback) {
    // Нечего искать: слаг не передан и альтернативный идентификатор отсутствует.
    return tryMockFallback();
  }

  if (!normalizedFallback || normalizedFallback.length === 0) {
    return (primary && normalizeServiceDetail(primary)) ?? tryMockFallback();
  }

  if (normalizedSlug && normalizedFallback === normalizedSlug) {
    return (primary && normalizeServiceDetail(primary)) ?? tryMockFallback();
  }

  const fallbackService = await fetchFromApi<ServiceDetail>(
    `/services/${encodeURIComponent(normalizedFallback)}?citySlug=${encodeURIComponent(citySlug)}`
  );

  if (fallbackService) {
    return normalizeServiceDetail(fallbackService);
  }

  return tryMockFallback();
}
