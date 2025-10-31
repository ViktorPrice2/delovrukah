// apps/web/src/app/types/catalog.types.ts

// ============================================================================
// Базовые сущности, как они приходят от API
// ============================================================================

/** Описывает город */
export interface City {
  id: string;
  name: string;
  slug: string;
}

/** Описывает категорию услуг */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

/** Описывает исполнителя в контексте конкретной услуги */
export interface Provider {
  id: string;
  displayName: string;
  description: string | null;
  price: number;
  city: City;
}

/** Описывает конкретную версию услуги */
export interface ServiceVersion {
  id: string;
  versionNumber: number;
  title: string;
  description: string;
  whatsIncluded: unknown;
  whatsNotIncluded: unknown;
  unitOfMeasure: string;
  requiredTools: unknown;
  customerRequirements: unknown;
  isActive: boolean;
  createdAt: string; // Даты приходят как строки в JSON
  updatedAt: string;
}

// ============================================================================
// Составные типы для страниц
// ============================================================================

/**
 * Описывает услугу в сокращенном виде (для списков и карточек)
 */
export interface ServiceSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string;
  latestVersion: ServiceVersion | null;
  medianPrice: number | null;
}

/**
 * Описывает полную, детальную информацию об услуге для ее страницы.
 * Расширяет ServiceSummary, добавляя вложенные объекты.
 */
export interface ServiceDetail extends ServiceSummary {
  authorId: string | null;
  keeperId: string | null;
  category: Category;      // Вложенный объект с данными категории
  providers?: Provider[];    // Массив вложенных объектов исполнителей
}