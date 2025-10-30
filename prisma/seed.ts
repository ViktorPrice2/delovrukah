import { PrismaClient, Role } from '@prisma/client';

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

async function main() {
  await seedCatalog();
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
