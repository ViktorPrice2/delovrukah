import { CityDto } from '../geo/dto/city.dto';
import { CategoryDto } from '../catalog/dto/category.dto';
import {
  ServiceDetailDto,
  ServiceProviderDto,
  ServiceSummaryDto,
  ServiceVersionDto,
} from '../catalog/dto/service.dto';

const NOVOSIBIRSK_CITY: CityDto = {
  id: 'city-novosibirsk',
  name: 'Новосибирск',
  slug: 'novosibirsk',
};

const ELECTRICAL_CATEGORY: CategoryDto = {
  id: 'category-electrical',
  name: 'Электромонтажные работы',
  slug: 'elektrika',
  description:
    'Комплексные услуги по диагностике и обслуживанию электрических систем в городе Новосибирск.',
};

const ELECTRICAL_SERVICE_VERSION: ServiceVersionDto = {
  id: 'service-version-diagnostics',
  versionNumber: 1,
  title: 'Базовый пакет диагностики',
  description:
    'Комплексная проверка электропроводки с применением тепловизора и измерением сопротивления изоляции.',
  whatsIncluded: [
    'Визуальный осмотр электропроводки',
    'Проверка силовых линий',
    'Отчет с рекомендациями',
  ],
  whatsNotIncluded: ['Ремонт и замена оборудования'],
  unitOfMeasure: 'выезд',
  requiredTools: ['Тепловизор', 'Мультиметр'],
  customerRequirements: [
    'Доступ к электрощитку',
    'Свободный доступ к розеткам',
  ],
  media: [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1582719478173-e5ff41e5974e?auto=format&fit=crop&w=1200&q=80',
      alt: 'Диагностика электропроводки — проверка автоматики',
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      alt: 'Мастер проверяет электрощит',
    },
  ],
  estimatedTime: '2 часа',
  isActive: true,
  createdAt: new Date('2024-01-10T10:00:00.000Z'),
  updatedAt: new Date('2024-01-10T10:00:00.000Z'),
};

const NOVOSIBIRSK_PROVIDERS: ServiceProviderDto[] = [
  {
    id: 'provider-ivanov',
    displayName: 'ИП Иванов А.А.',
    description:
      'Опыт более 10 лет. Диагностика электропроводки в квартирах и коттеджах, подробный отчет о состоянии линий.',
    price: 2500,
    city: NOVOSIBIRSK_CITY,
    hourlyRate: 1200,
    estimatedTime: '1,5 часа',
  },
  {
    id: 'provider-petrov',
    displayName: 'ООО «ЭлектроМонтаж»',
    description:
      'Диагностика электросетей с выдачей технического заключения и рекомендациями по ремонту.',
    price: 3200,
    city: NOVOSIBIRSK_CITY,
    hourlyRate: 1500,
    estimatedTime: '2 часа',
  },
];

const ELECTRICAL_SERVICE: ServiceDetailDto = {
  id: 'cmhegk83h000mizc4mw070nwn',
  slug: 'diagnostika-elektroprovodki',
  name: 'Диагностика электропроводки',
  description:
    'Полная диагностика электропроводки в жилых и коммерческих помещениях с рекомендациями по устранению неисправностей.',
  categoryId: ELECTRICAL_CATEGORY.id,
  latestVersion: ELECTRICAL_SERVICE_VERSION,
  authorId: null,
  keeperId: null,
  category: ELECTRICAL_CATEGORY,
  medianPrice: null,
  providers: NOVOSIBIRSK_PROVIDERS,
};

const MOCK_CITIES: CityDto[] = [NOVOSIBIRSK_CITY];
const MOCK_CATEGORIES: CategoryDto[] = [ELECTRICAL_CATEGORY];
const MOCK_SERVICES: ServiceDetailDto[] = [ELECTRICAL_SERVICE];

function cloneCity(city: CityDto): CityDto {
  return { ...city };
}

function cloneCategory(category: CategoryDto): CategoryDto {
  return { ...category };
}

function cloneJsonValue<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const structuredCloneFn = (
    globalThis as typeof globalThis & {
      structuredClone?: <JsonType>(input: JsonType) => JsonType;
    }
  ).structuredClone;

  if (typeof structuredCloneFn === 'function') {
    return structuredCloneFn(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneVersion(
  version: ServiceVersionDto | null,
): ServiceVersionDto | null {
  if (!version) {
    return null;
  }

  return {
    ...version,
    whatsIncluded: cloneJsonValue(version.whatsIncluded),
    whatsNotIncluded: cloneJsonValue(version.whatsNotIncluded),
    requiredTools: cloneJsonValue(version.requiredTools),
    customerRequirements: cloneJsonValue(version.customerRequirements),
    media: cloneJsonValue(version.media),
    estimatedTime: version.estimatedTime ?? null,
    createdAt: new Date(version.createdAt),
    updatedAt: new Date(version.updatedAt),
  };
}

function cloneProvider(provider: ServiceProviderDto): ServiceProviderDto {
  return {
    ...provider,
    city: cloneCity(provider.city),
  };
}

function cloneService(service: ServiceDetailDto): ServiceDetailDto {
  return {
    ...service,
    latestVersion: cloneVersion(service.latestVersion),
    category: cloneCategory(service.category),
    providers: service.providers?.map(cloneProvider),
  };
}

function filterProvidersByCity(
  providers: ServiceProviderDto[] | undefined,
  citySlug: string,
): ServiceProviderDto[] | undefined {
  if (!providers) {
    return undefined;
  }

  return providers
    .filter((provider) => provider.city.slug === citySlug)
    .map(cloneProvider);
}

function cloneServiceForCity(
  service: ServiceDetailDto,
  citySlug: string,
): ServiceDetailDto {
  const cloned = cloneService(service);
  cloned.providers = filterProvidersByCity(service.providers, citySlug);
  return cloned;
}

function createSummary(service: ServiceDetailDto): ServiceSummaryDto {
  return {
    id: service.id,
    categoryId: service.categoryId,
    name: service.name,
    description: service.description ?? null,
    slug: service.slug,
    latestVersion: cloneVersion(service.latestVersion),
    medianPrice: service.medianPrice ?? null,
  };
}

export function getMockCities(): CityDto[] {
  return MOCK_CITIES.map(cloneCity);
}

export function getMockCategories(): CategoryDto[] {
  return MOCK_CATEGORIES.map(cloneCategory);
}

export function findMockCategoryById(categoryId: string): CategoryDto | null {
  const category = MOCK_CATEGORIES.find((item) => item.id === categoryId);
  return category ? cloneCategory(category) : null;
}

export function getMockServiceSummariesByCategoryId(
  categoryId: string,
): ServiceSummaryDto[] {
  return MOCK_SERVICES.filter(
    (service) => service.categoryId === categoryId,
  ).map((service) => createSummary(cloneService(service)));
}

export function getMockServicesByCategorySlug(
  categorySlug: string,
  citySlug: string,
): ServiceDetailDto[] {
  return MOCK_SERVICES.filter(
    (service) => service.category.slug === categorySlug,
  ).map((service) => cloneServiceForCity(service, citySlug));
}

export function findMockServiceBySlugOrId(
  slugOrId: string,
  citySlug: string,
): ServiceDetailDto | null {
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

export function getDefaultCitySlug(): string {
  return NOVOSIBIRSK_CITY.slug;
}
