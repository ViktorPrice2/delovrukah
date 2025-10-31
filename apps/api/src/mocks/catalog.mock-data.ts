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
  },
  {
    id: 'provider-petrov',
    displayName: 'ООО «ЭлектроМонтаж»',
    description:
      'Диагностика электросетей с выдачей технического заключения и рекомендациями по ремонту.',
    price: 3200,
    city: NOVOSIBIRSK_CITY,
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

function cloneVersion(
  version: ServiceVersionDto | null,
): ServiceVersionDto | null {
  if (!version) {
    return null;
  }

  return {
    ...version,
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
