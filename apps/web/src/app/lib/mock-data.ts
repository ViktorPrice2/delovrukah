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
  customerRequirements: ["Доступ к электрощитку", "Свободный доступ к розеткам"],
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
  estimatedTime: "2 часа",
  isActive: true,
  createdAt: "2024-01-10T10:00:00.000Z",
  updatedAt: "2024-01-10T10:00:00.000Z",
};

const NOVOSIBIRSK_PROVIDER_PROFILES: Array<Pick<Provider, "id" | "displayName" | "description" | "price">> = [
  {
    id: "provider-nsk-01",
    displayName: "ИП Иванов А.А.",
    description:
      "Опыт более 10 лет. Диагностика электропроводки в квартирах и коттеджах, подробный отчет о состоянии линий.",
    price: 2500,
  },
  {
    id: "provider-nsk-02",
    displayName: "ООО «ЭлектроМонтаж»",
    description:
      "Диагностика электросетей с выдачей технического заключения и рекомендациями по ремонту.",
    price: 3200,
  },
  {
    id: "provider-nsk-03",
    displayName: "Электрик сервис «Молния»",
    description:
      "Срочные выезды в течение дня, проверка автоматов и тепловизионный контроль нагрева линий.",
    price: 2800,
  },
  {
    id: "provider-nsk-04",
    displayName: "MasterVolt Новосибирск",
    description: "Проверка электросети с измерением сопротивления изоляции и составлением акта.",
    price: 3100,
  },
  {
    id: "provider-nsk-05",
    displayName: "ЭлектроПрофи 54",
    description: "Комплексная диагностика с проверкой УЗО и рекомендациями по модернизации щита.",
    price: 2950,
  },
  {
    id: "provider-nsk-06",
    displayName: "Заводской электрик",
    description: "Опыт работы на промышленных объектах, анализ нагрузки и выявление просадок напряжения.",
    price: 3400,
  },
  {
    id: "provider-nsk-07",
    displayName: "ЭнергоДиагностика",
    description: "Измерение сопротивления контура заземления, проверка кабельных линий и розеточных групп.",
    price: 3600,
  },
  {
    id: "provider-nsk-08",
    displayName: "ТехЭнерго Сервис",
    description: "Профилактика электрических сетей в офисах и квартирах, выдача подробного заключения.",
    price: 3300,
  },
  {
    id: "provider-nsk-09",
    displayName: "ЭлектроЛаб",
    description: "Диагностика с использованием лабораторного оборудования и фотоотчетом проблемных зон.",
    price: 3550,
  },
  {
    id: "provider-nsk-10",
    displayName: "Комфорт-Сеть",
    description: "Проверка скрытой проводки, поиск повреждений и рекомендации по улучшению безопасности.",
    price: 2700,
  },
  {
    id: "provider-nsk-11",
    displayName: "СветоТест",
    description: "Наладка осветительных линий, тестирование выключателей и измерение утечки тока.",
    price: 2600,
  },
  {
    id: "provider-nsk-12",
    displayName: "ИП Смирнова Е.В.",
    description: "Диагностика для квартир перед сдачей в аренду, рекомендации по распределению нагрузки.",
    price: 2450,
  },
  {
    id: "provider-nsk-13",
    displayName: "ЭлектроФокус",
    description: "Проверка стабилизаторов и тёплых полов, замеры напряжения по фазам, консультации по оборудованию.",
    price: 3150,
  },
  {
    id: "provider-nsk-14",
    displayName: "БликЭнерго",
    description: "Диагностика квартир в новостройках, поиск монтажных ошибок, помощь в гарантийных обращениях.",
    price: 3000,
  },
  {
    id: "provider-nsk-15",
    displayName: "Сеть+",
    description: "Комплексная проверка электропроводки с нагрузочными испытаниями и маркировкой линий.",
    price: 2900,
  },
  {
    id: "provider-nsk-16",
    displayName: "Диагностика и безопасность",
    description: "Проверка систем заземления, автоматов и УЗО в частных домах, выдача технического заключения.",
    price: 3700,
  },
  {
    id: "provider-nsk-17",
    displayName: "ЭнергоПульт",
    description: "Термовизионная диагностика электрощитов, составление плана модернизации.",
    price: 3500,
  },
  {
    id: "provider-nsk-18",
    displayName: "Электрика Гарант",
    description: "Комплексная проверка проводки в домах после ремонта, консультация по распределению нагрузки.",
    price: 3050,
  },
  {
    id: "provider-nsk-19",
    displayName: "ПрофСеть Инжиниринг",
    description: "Диагностика коммерческих помещений, проверка автоматизации и систем освещения.",
    price: 3850,
  },
  {
    id: "provider-nsk-20",
    displayName: "NovaGrid",
    description: "Сервисное сопровождение электросетей, регулярный мониторинг состояния и фотофиксация.",
    price: 4100,
  },
];

const NOVOSIBIRSK_PROVIDERS: Provider[] = NOVOSIBIRSK_PROVIDER_PROFILES.map((profile) => ({
  ...profile,
  city: NOVOSIBIRSK_CITY,
}));

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
    media: cloneJsonValue(version.media),
    estimatedTime: version.estimatedTime ?? null,
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
