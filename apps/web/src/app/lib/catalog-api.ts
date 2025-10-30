
import type { Category, City, ServiceDetail } from "../types/catalog.types";

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not defined in .env.local file."
    );
  }

  return baseUrl;
}

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
  return cities ?? []; // Возвращаем пустой массив, если API вернул null
}

export async function getCategories(citySlug: string): Promise<Category[]> {
  const categories = await fetchFromApi<Category[]>(`/categories?citySlug=${encodeURIComponent(citySlug)}`);
  return categories ?? [];
}

export async function getServicesByCategory(citySlug: string, categorySlug: string): Promise<ServiceDetail[]> {
  const services = await fetchFromApi<ServiceDetail[]>(
    `/services?citySlug=${encodeURIComponent(citySlug)}&categorySlug=${encodeURIComponent(categorySlug)}`
  );
  return services ?? [];
}

/**
 * Получает детальную информацию об услуге по ее слагу и слагу города.
 * @param serviceSlug - Слаг услуги (например, 'ustanovka-unitaza')
 * @param citySlug - Слаг города (например, 'moskva')
 * @returns {Promise<ServiceDetail | null>} - Объект услуги или null, если не найдено.
 */
export async function getServiceDetailsBySlug(
  serviceSlug: string,
  citySlug: string
): Promise<ServiceDetail | null> {
  // Эта функция теперь является основной для получения деталей услуги
  return fetchFromApi<ServiceDetail>(
    `/services/${encodeURIComponent(serviceSlug)}?citySlug=${encodeURIComponent(citySlug)}`
  );
}