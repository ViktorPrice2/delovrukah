import { Prisma, PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

type SeedServiceVersion = {
  versionNumber: number;
  title: string;
  description?: string;
  isActive?: boolean;
};

type SeedServiceTemplate = {
  name: string;
  description?: string;
  versions: SeedServiceVersion[];
};

type SeedCategory = {
  name: string;
  description?: string;
  services: SeedServiceTemplate[];
};

type CoordinateRange = {
  lat: [number, number];
  lng: [number, number];
};

type SeedCity = {
  name: string;
  slug: string;
  range: CoordinateRange;
};

type SeedProviderService = {
  categoryName: string;
  serviceName: string;
  price: number;
};

type SeedProvider = {
  email: string;
  displayName: string;
  description?: string;
  citySlug: string;
  services: SeedProviderService[];
};

const categories: SeedCategory[] = [
  {
    name: 'Сантехника',
    description: 'Услуги по обслуживанию и ремонту водопровода и канализации.',
    services: [
      {
        name: 'Установка смесителя',
        description: 'Монтаж кухонного или ванного смесителя с проверкой подключения.',
        versions: [
          {
            versionNumber: 1,
            title: 'Базовая установка смесителя',
            description:
              'Включает демонтаж старого оборудования, монтаж и проверку герметичности.',
            isActive: false,
          },
          {
            versionNumber: 2,
            title: 'Расширенная установка смесителя',
            description:
              'Дополнительно включает замену гибкой подводки и установку фильтров грубой очистки.',
          },
        ],
      },
      {
        name: 'Чистка сифона',
        description: 'Профилактическая чистка сифона и сливной системы.',
        versions: [
          {
            versionNumber: 1,
            title: 'Промывка сифона',
            description: 'Разбор сифона, чистка и проверка герметичности соединений.',
          },
        ],
      },
    ],
  },
  {
    name: 'Электрика',
    description: 'Работы по монтажу и обслуживанию электросетей.',
    services: [
      {
        name: 'Установка розетки',
        description: 'Монтаж дополнительной электрической точки с проверкой безопасности.',
        versions: [
          {
            versionNumber: 1,
            title: 'Стандартная установка розетки',
            description: 'Установка внутренней розетки с подключением к существующей проводке.',
          },
        ],
      },
      {
        name: 'Диагностика электропроводки',
        description: 'Комплексная проверка состояния электропроводки и автоматики.',
        versions: [
          {
            versionNumber: 1,
            title: 'Первичная диагностика',
            description:
              'Проверка автоматов, розеток и выключателей с предоставлением отчета по состоянию.',
            isActive: false,
          },
          {
            versionNumber: 2,
            title: 'Расширенная диагностика',
            description:
              'Включает тепловизионную съемку и проверку распределительного щита.',
          },
        ],
      },
    ],
  },
  {
    name: 'Отделка',
    description: 'Услуги по ремонту и отделке помещений.',
    services: [
      {
        name: 'Покраска стен',
        description: 'Подготовка поверхностей и нанесение лакокрасочных материалов.',
        versions: [
          {
            versionNumber: 1,
            title: 'Покраска стен в один слой',
            description: 'Подготовка стен и нанесение одного слоя краски.',
          },
        ],
      },
      {
        name: 'Укладка плитки',
        description: 'Монтаж настенной или напольной плитки с затиркой швов.',
        versions: [
          {
            versionNumber: 1,
            title: 'Базовая укладка плитки',
            description: 'Подготовка основания, укладка плитки и затирка швов.',
          },
        ],
      },
    ],
  },
  {
    name: 'Климат',
    description: 'Обслуживание систем отопления и кондиционирования.',
    services: [
      {
        name: 'Чистка кондиционера',
        description: 'Промывка фильтров и обработка теплообменника.',
        versions: [
          {
            versionNumber: 1,
            title: 'Сезонная чистка кондиционера',
            description: 'Комплексная чистка внутреннего и наружного блока.',
          },
        ],
      },
      {
        name: 'Настройка котла',
        description: 'Настройка параметров и проверка безопасности газового котла.',
        versions: [
          {
            versionNumber: 1,
            title: 'Пуско-наладка котла',
            description: 'Первичная настройка и проверка работоспособности котла.',
          },
        ],
      },
    ],
  },
];

const cities: SeedCity[] = [
  {
    name: 'Москва',
    slug: 'moskva',
    range: {
      lat: [55.55, 55.90],
      lng: [37.30, 37.80],
    },
  },
  {
    name: 'Санкт-Петербург',
    slug: 'sankt-peterburg',
    range: {
      lat: [59.80, 60.10],
      lng: [30.10, 30.50],
    },
  },
  {
    name: 'Казань',
    slug: 'kazan',
    range: {
      lat: [55.70, 55.90],
      lng: [49.00, 49.30],
    },
  },
  {
    name: 'Новосибирск',
    slug: 'novosibirsk',
    range: {
      lat: [54.90, 55.10],
      lng: [82.80, 83.20],
    },
  },
];

const providerSeeds: SeedProvider[] = [
  {
    email: 'moscow-plumber@example.com',
    displayName: 'Мастер сантехник (Москва)',
    description: 'Опыт более 10 лет по сантехническим работам в Москве.',
    citySlug: 'moskva',
    services: [
      {
        categoryName: 'Сантехника',
        serviceName: 'Установка смесителя',
        price: 2500,
      },
      {
        categoryName: 'Сантехника',
        serviceName: 'Чистка сифона',
        price: 1500,
      },
    ],
  },
  {
    email: 'spb-electric@example.com',
    displayName: 'Электрик на дом (Санкт-Петербург)',
    description: 'Сертифицированный электрик с гарантийным обслуживанием.',
    citySlug: 'sankt-peterburg',
    services: [
      {
        categoryName: 'Электрика',
        serviceName: 'Установка розетки',
        price: 1800,
      },
      {
        categoryName: 'Электрика',
        serviceName: 'Диагностика электропроводки',
        price: 3200,
      },
    ],
  },
  {
    email: 'kazan-finishing@example.com',
    displayName: 'Отделочник (Казань)',
    description: 'Выполняю отделочные работы под ключ.',
    citySlug: 'kazan',
    services: [
      {
        categoryName: 'Отделка',
        serviceName: 'Покраска стен',
        price: 2100,
      },
      {
        categoryName: 'Отделка',
        serviceName: 'Укладка плитки',
        price: 4200,
      },
    ],
  },
  {
    email: 'novosibirsk-climate@example.com',
    displayName: 'Климат-сервис (Новосибирск)',
    description: 'Обслуживание кондиционеров и котлов в Новосибирске.',
    citySlug: 'novosibirsk',
    services: [
      {
        categoryName: 'Климат',
        serviceName: 'Чистка кондиционера',
        price: 2700,
      },
      {
        categoryName: 'Климат',
        serviceName: 'Настройка котла',
        price: 3500,
      },
    ],
  },
];

async function ensureSeedUsers() {
  const [author, keeper] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'catalog-author@example.com' },
      update: {},
      create: {
        email: 'catalog-author@example.com',
        passwordHash: 'seeded-hash',
        role: Role.PROVIDER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'catalog-keeper@example.com' },
      update: {},
      create: {
        email: 'catalog-keeper@example.com',
        passwordHash: 'seeded-hash',
        role: Role.PROVIDER,
      },
    }),
  ]);

  return { authorId: author.id, keeperId: keeper.id };
}

async function seedCatalog() {
  const { authorId, keeperId } = await ensureSeedUsers();

  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { name: categoryData.name },
      update: {
        description: categoryData.description ?? null,
      },
      create: {
        name: categoryData.name,
        description: categoryData.description ?? null,
      },
    });

    for (const serviceData of categoryData.services) {
      const service = await prisma.serviceTemplate.upsert({
        where: {
          categoryId_name: { categoryId: category.id, name: serviceData.name },
        },
        update: {
          description: serviceData.description ?? null,
          authorId,
          keeperId,
        },
        create: {
          categoryId: category.id,
          name: serviceData.name,
          description: serviceData.description ?? null,
          authorId,
          keeperId,
        },
      });

      const versions = [...serviceData.versions].sort(
        (a, b) => a.versionNumber - b.versionNumber,
      );
      const lastVersionNumber = versions.at(-1)?.versionNumber;

      await prisma.serviceTemplateVersion.updateMany({
        where: { serviceTemplateId: service.id },
        data: { isActive: false },
      });

      for (const versionData of versions) {
        const isActive =
          versionData.isActive ?? versionData.versionNumber === lastVersionNumber;

        await prisma.serviceTemplateVersion.upsert({
          where: {
            serviceTemplateId_versionNumber: {
              serviceTemplateId: service.id,
              versionNumber: versionData.versionNumber,
            },
          },
          update: {
            title: versionData.title,
            description: versionData.description ?? null,
            isActive,
          },
          create: {
            serviceTemplateId: service.id,
            versionNumber: versionData.versionNumber,
            title: versionData.title,
            description: versionData.description ?? null,
            isActive,
          },
        });
      }
    }
  }
}

function randomInRange([min, max]: [number, number]): number {
  return Math.random() * (max - min) + min;
}

async function seedCities() {
  const cityMap: Record<
    string,
    {
      id: string;
      range: CoordinateRange;
    }
  > = {};

  for (const cityData of cities) {
    const city = await prisma.city.upsert({
      where: { slug: cityData.slug },
      update: { name: cityData.name },
      create: {
        name: cityData.name,
        slug: cityData.slug,
      },
    });

    cityMap[city.slug] = {
      id: city.id,
      range: cityData.range,
    };
  }

  return cityMap;
}

async function setProviderHomeLocation(
  providerProfileId: string,
  longitude: number,
  latitude: number,
) {
  await prisma.$executeRaw`
    UPDATE "ProviderProfile"
    SET "homeLocation" = point(${longitude}, ${latitude})
    WHERE "id" = ${providerProfileId}
  `;
}

async function seedProviders(
  cityMap: Record<string, { id: string; range: CoordinateRange }>,
) {
  for (const providerData of providerSeeds) {
    const city = cityMap[providerData.citySlug];

    if (!city) {
      continue;
    }

    const user = await prisma.user.upsert({
      where: { email: providerData.email },
      update: {},
      create: {
        email: providerData.email,
        passwordHash: 'seeded-hash',
        role: Role.PROVIDER,
      },
    });

    const profile = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: providerData.displayName,
        description: providerData.description ?? null,
        cityId: city.id,
      },
      create: {
        userId: user.id,
        displayName: providerData.displayName,
        description: providerData.description ?? null,
        cityId: city.id,
      },
    });

    const longitude = randomInRange(city.range.lng);
    const latitude = randomInRange(city.range.lat);

    await setProviderHomeLocation(profile.id, longitude, latitude);

    for (const service of providerData.services) {
      const serviceTemplate = await prisma.serviceTemplate.findFirst({
        where: {
          name: service.serviceName,
          category: { name: service.categoryName },
        },
        include: {
          versions: {
            where: { isActive: true },
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
      });

      const version = serviceTemplate?.versions.at(0);

      if (!version) {
        continue;
      }

      await prisma.price.upsert({
        where: {
          providerProfileId_serviceTemplateVersionId: {
            providerProfileId: profile.id,
            serviceTemplateVersionId: version.id,
          },
        },
        update: {
          price: new Prisma.Decimal(service.price),
        },
        create: {
          providerProfileId: profile.id,
          serviceTemplateVersionId: version.id,
          price: new Prisma.Decimal(service.price),
        },
      });
    }
  }
}

async function main() {
  await seedCatalog();
  const cityMap = await seedCities();
  await seedProviders(cityMap);
}

main()
  .then(async () => {
    console.log('Catalog data seeded successfully');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
