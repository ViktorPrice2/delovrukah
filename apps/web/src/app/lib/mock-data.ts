import type {
  Category,
  City,
  Provider,
  ServiceDetail,
  ServiceVersion,
} from "@/app/types/catalog.types";

const NOVOSIBIRSK_CITY: City = {
  id: "city-novosibirsk",
  name: "Новосибирск",
  slug: "novosibirsk",
};

const ELECTRICAL_CATEGORY: Category = {
  id: "category-electrical",
  name: "Электромонтажные работы",
  slug: "elektrika",
  description:
    "Комплексные услуги по диагностике и обслуживанию электрических систем в городе Новосибирск.",
};

const ELECTRICAL_SERVICE_VERSION: ServiceVersion = {
  id: "service-version-diagnostics",
  versionNumber: 1,
  title: "Базовый пакет диагностики",
  description:
    "Комплексная проверка электропроводки с применением тепловизора и измерением сопротивления изоляции.",
  whatsIncluded: [
    "Визуальный осмотр электропроводки",
    "Проверка силовых линий",
    "Отчет с рекомендациями",
  ],
  whatsNotIncluded: ["Ремонт и замена оборудования"],
  unitOfMeasure: "выезд",
  requiredTools: ["Тепловизор", "Мультиметр"],
  customerRequirements: ["Доступ к электрощиту", "Свободный доступ к розеткам"],
  isActive: true,
  createdAt: "2024-01-10T10:00:00.000Z",
  updatedAt: "2024-01-10T10:00:00.000Z",
};

const NOVOSIBIRSK_PROVIDERS: Provider[] = [
  {
    id: "provider-ivanov",
    displayName: "ИП Иванов А.А.",
    description:
      "Опыт более 10 лет. Диагностика электропроводки в квартирах и коттеджах, подробный отчет о состоянии линий.",
    price: 2500,
    city: NOVOSIBIRSK_CITY,
  },
  {
    id: "provider-petrov",
    displayName: "ООО «ЭлектроМонтаж»",
    description:
      "Диагностика электросетей с выдачей технического заключения и рекомендациями по ремонту.",
    price: 3200,
    city: NOVOSIBIRSK_CITY,
  },
];

const ELECTRICAL_SERVICE: ServiceDetail = {
  id: "cmhegk83h000mizc4mw070nwn",
  slug: "diagnostika-elektroprovodki",
  name: "Диагностика электропроводки",
  description:
    "Полная диагностика электропроводки в жилых и коммерческих помещениях с рекомендациями по устранению неисправностей.",
  categoryId: ELECTRICAL_CATEGORY.id,
  latestVersion: ELECTRICAL_SERVICE_VERSION,
  authorId: null,
  keeperId: null,
  medianPrice: null,
  category: ELECTRICAL_CATEGORY,
  providers: NOVOSIBIRSK_PROVIDERS,
};

const MOCK_CITIES: City[] = [NOVOSIBIRSK_CITY];
const MOCK_CATEGORIES: Category[] = [ELECTRICAL_CATEGORY];
const MOCK_SERVICES: ServiceDetail[] = [ELECTRICAL_SERVICE];

function cloneCity(city: City): City {
  return { ...city };
}

function cloneCategory(category: Category): Category {
  return { ...category };
}

function cloneJsonValue<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  const structuredCloneFn = (
    globalThis as typeof globalThis & { structuredClone?: <JsonType>(input: JsonType) => JsonType }
  ).structuredClone;

  if (typeof structuredCloneFn === "function") {
    return structuredCloneFn(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneVersion(version: ServiceVersion | null): ServiceVersion | null {
  if (!version) {
    return null;
  }

  return {
    ...version,
    whatsIncluded: cloneJsonValue(version.whatsIncluded),
    whatsNotIncluded: cloneJsonValue(version.whatsNotIncluded),
    requiredTools: cloneJsonValue(version.requiredTools),
    customerRequirements: cloneJsonValue(version.customerRequirements),
  };
}

function cloneProvider(provider: Provider): Provider {
  return {
    ...provider,
    city: cloneCity(provider.city),
  };
}

function cloneService(service: ServiceDetail): ServiceDetail {
  return {
    ...service,
    latestVersion: cloneVersion(service.latestVersion),
    category: cloneCategory(service.category),
    providers: service.providers?.map(cloneProvider),
  };
}

function filterProvidersByCity(
  providers: Provider[] | undefined,
  citySlug: string,
): Provider[] | undefined {
  if (!providers) {
    return undefined;
  }

  return providers
    .filter((provider) => provider.city.slug === citySlug)
    .map(cloneProvider);
}

function cloneServiceForCity(
  service: ServiceDetail,
  citySlug: string,
): ServiceDetail {
  const cloned = cloneService(service);
  cloned.providers = filterProvidersByCity(service.providers, citySlug);
  return cloned;
}

export function getMockCities(): City[] {
  return MOCK_CITIES.map(cloneCity);
}

export function getMockCategories(): Category[] {
  return MOCK_CATEGORIES.map(cloneCategory);
}

export function getMockServicesByCategorySlug(
  categorySlug: string,
  citySlug: string,
): ServiceDetail[] {
  return MOCK_SERVICES
    .filter((service) => service.category.slug === categorySlug)
    .map((service) => cloneServiceForCity(service, citySlug));
}

export function findMockServiceBySlugOrId(
  slugOrId: string,
  citySlug: string,
): ServiceDetail | null {
  const normalized = slugOrId.trim().toLowerCase();
  const service = MOCK_SERVICES.find(
    (item) =>
      item.slug.toLowerCase() === normalized ||
      item.id.toLowerCase() === normalized,
  );

  if (!service) {
    return null;
  }

  return cloneServiceForCity(service, citySlug);
}
