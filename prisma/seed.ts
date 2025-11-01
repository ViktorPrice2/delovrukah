import { Prisma, PrismaClient, Role } from '@prisma/client';
import { slugify } from 'transliteration';

const prisma = new PrismaClient();

const PRICES_PER_PROVIDER_RATIO = 0.5;
const SERVICES_PER_PROVIDER_MIN = 3;
const SERVICES_PER_PROVIDER_MAX = 5;

function generateSlug(text: string): string {
  return slugify(text, { lowercase: true, separator: '-' });
}

type SeedServiceVersion = {
  versionNumber: number;
  title: string;
  description: string;
  whatsIncluded: Prisma.InputJsonValue;
  whatsNotIncluded: Prisma.InputJsonValue;
  unitOfMeasure: string;
  requiredTools: Prisma.InputJsonValue;
  customerRequirements: Prisma.InputJsonValue;
  estimatedTime: string;
  maxTimeIncluded?: number | null;
  media?: Prisma.InputJsonValue;
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

type SeedProvider = {
  email: string;
  displayName: string;
  description: string;
  citySlug: string;
  hourlyRate: number;
};

type SeedCustomer = {
  email: string;
  fullName: string;
};

type ActiveServiceVersion = {
  id: string;
  serviceName: string;
  categoryName: string;
  title: string;
};

type SeedMediaItem = {
  type: 'image' | 'video';
  url: string;
  alt?: string;
  previewUrl?: string;
};

const UNSPLASH_PARAMS = '?auto=format&fit=crop&w=1200&q=80';

function buildMediaSet(title: string, urls: string[]): SeedMediaItem[] {
  return urls.map((baseUrl, index) => ({
    type: 'image',
    url: `${baseUrl}${UNSPLASH_PARAMS}`,
    previewUrl: `${baseUrl}?auto=format&fit=crop&w=400&q=60`,
    alt: `${title} — фото ${index + 1}`,
  }));
}

const MEDIA_GALLERIES = {
  mixerInstall: [
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
    'https://images.unsplash.com/photo-1581579186989-0f9ee7ea8f29',
    'https://images.unsplash.com/photo-1582719478141-44d23c4d49b2',
  ],
  leakFix: [
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e',
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
  ],
  towelDryer: [
    'https://images.unsplash.com/photo-1597003634303-43c17ae9ca88',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e',
    'https://images.unsplash.com/photo-1505692069463-1e4e8c1f3d44',
  ],
  outletInstall: [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
    'https://images.unsplash.com/photo-1492724441997-5dc865305da7',
    'https://images.unsplash.com/photo-1582056619247-73f8ffa8fd2c',
  ],
  lightFixture: [
    'https://images.unsplash.com/photo-1493666438817-866a91353ca9',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e',
    'https://images.unsplash.com/photo-1523419409543-0c1df022bdd1',
  ],
  wallPainting: [
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e',
    'https://images.unsplash.com/photo-1523419409543-0c1df022bdd1',
    'https://images.unsplash.com/photo-1565183997392-2e1f1a090e99',
  ],
  tileLaying: [
    'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6',
    'https://images.unsplash.com/photo-1523779105320-d1cd346ff52c',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac',
  ],
  acInstall: [
    'https://images.unsplash.com/photo-1582719478131-d4f71c0d8af5',
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623',
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6',
  ],
  acCleaning: [
    'https://images.unsplash.com/photo-1505691723518-36a1d8328535',
    'https://images.unsplash.com/photo-1581579186984-7f9d48f223e1',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
  ],
  boilerSetup: [
    'https://images.unsplash.com/photo-1582719478173-e5ff41e5974e',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
    'https://images.unsplash.com/photo-1582056619247-73f8ffa8fd2c',
  ],
  deepCleaning: [
    'https://images.unsplash.com/photo-1581579186984-7f9d48f223e1',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
    'https://images.unsplash.com/photo-1486592424980-45e4e0d04f24',
  ],
  windowWashing: [
    'https://images.unsplash.com/photo-1487598273674-0f6c62f098f1',
    'https://images.unsplash.com/photo-1487611459768-bd414656ea10',
    'https://images.unsplash.com/photo-1505691723518-36a1d8328535',
  ],
} satisfies Record<string, string[]>;

const FALLBACK_MEDIA_GALLERY = [
  'https://images.unsplash.com/photo-1523419409543-0c1df022bdd1',
  'https://images.unsplash.com/photo-1581579186989-0f9ee7ea8f29',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e',
];

const categories: SeedCategory[] = [
  {
    name: 'Сантехника',
    description: 'Услуги по обслуживанию, ремонту и модернизации сантехнических систем.',
    services: [
      {
        name: 'Установка смесителя',
        description: 'Монтаж кухонного или ванного смесителя с проверкой герметичности.',
        versions: [
          {
            versionNumber: 1,
            title: 'Комплексная установка смесителя',
            description:
              'Включает демонтаж старого оборудования, монтаж нового смесителя и проверку герметичности соединений.',
            whatsIncluded: [
              'Демонтаж старого смесителя',
              'Установка нового смесителя на готовые выводы воды',
              'Подключение гибких подводок и аэратора',
              'Проверка герметичности соединений и регулировка напора',
            ],
            whatsNotIncluded: [
              'Прокладка новой трубной разводки',
              'Штробление стен и скрытая прокладка коммуникаций',
              'Поставка расходных материалов и самого смесителя',
            ],
            unitOfMeasure: 'шт',
            requiredTools: [
              'Газовый или разводной ключ',
              'Фум-лента и сантехнический герметик',
              'Отвертки крестовая и плоская',
            ],
            customerRequirements: [
              'Свободный доступ к месту установки',
              'Исправные запорные краны на подводках',
              'Наличие нового смесителя и комплектующих',
            ],
            media: buildMediaSet('Комплексная установка смесителя', MEDIA_GALLERIES.mixerInstall),
            estimatedTime: '1.5 часа',
            maxTimeIncluded: 2,
          },
        ],
      },
      {
        name: 'Ремонт протечки',
        description: 'Локализация и устранение протечек в водопроводных системах.',
        versions: [
          {
            versionNumber: 1,
            title: 'Локальный ремонт протечки',
            description:
              'Мастер диагностирует источник протечки и выполняет ремонт с заменой уплотнителей и фитингов.',
            whatsIncluded: [
              'Диагностика причины протечки',
              'Локальный демонтаж поврежденного участка',
              'Замена уплотнителей и фитингов',
              'Проверка герметичности под рабочим давлением',
            ],
            whatsNotIncluded: [
              'Полная замена трубопровода',
              'Ремонт отделки стен и потолков после протечки',
              'Вывоз строительного мусора',
            ],
            unitOfMeasure: 'выезд',
            requiredTools: [
              'Набор гаечных ключей',
              'Пресс-клещи для фитингов',
              'Измерительный прибор давления',
            ],
            customerRequirements: [
              'Обеспечить доступ к трубопроводу',
              'Сообщить о ранее проводимых ремонтах',
              'Предоставить запчасти, если есть требования по бренду',
            ],
            media: buildMediaSet('Локальный ремонт протечки', MEDIA_GALLERIES.leakFix),
            estimatedTime: '2 часа',
            maxTimeIncluded: 3,
          },
        ],
      },
      {
        name: 'Монтаж полотенцесушителя',
        description: 'Установка водяного или электрического полотенцесушителя.',
        versions: [
          {
            versionNumber: 1,
            title: 'Монтаж полотенцесушителя «под ключ»',
            description:
              'Установка включает подключение к системе отопления или ГВС и контроль безопасности.',
            whatsIncluded: [
              'Демонтаж старого полотенцесушителя при необходимости',
              'Разметка и установка креплений',
              'Подключение к системе ГВС или отопления',
              'Оппрессовка и проверка герметичности',
            ],
            whatsNotIncluded: [
              'Изменение трассы трубопровода более 0.5 метра',
              'Штробление стен и отделочные работы',
              'Поставка полотенцесушителя и вентилей',
            ],
            unitOfMeasure: 'шт',
            requiredTools: [
              'Перфоратор и набор буров',
              'Регулируемые ключи',
              'Фум-лента и герметик',
            ],
            customerRequirements: [
              'Освободить зону установки',
              'Предоставить доступ к стоякам воды',
              'Подготовить оборудование и комплектующие',
            ],
            media: buildMediaSet('Монтаж полотенцесушителя', MEDIA_GALLERIES.towelDryer),
            estimatedTime: '3 часа',
            maxTimeIncluded: 4,
          },
        ],
      },
    ],
  },
  {
    name: 'Электрика',
    description: 'Работы по монтажу и обслуживанию электрических сетей и оборудования.',
    services: [
      {
        name: 'Установка розетки',
        description: 'Монтаж дополнительной электрической точки с проверкой безопасности.',
        versions: [
          {
            versionNumber: 1,
            title: 'Стандартная установка розетки',
            description: 'Установка внутренней розетки с подключением к существующей проводке.',
            whatsIncluded: [
              'Подготовка посадочного места',
              'Подключение к существующей проводке',
              'Монтаж механизма и лицевой панели',
              'Проверка работы и заземления',
            ],
            whatsNotIncluded: [
              'Штробление стен и прокладка новой линии',
              'Установка автоматического выключателя в щите',
              'Поставка розетки и рамок',
            ],
            unitOfMeasure: 'шт',
            requiredTools: [
              'Индикатор напряжения',
              'Отвертки и кусачки',
              'Перфоратор или штроборез при необходимости',
            ],
            customerRequirements: [
              'Отключение электропитания на время работ',
              'Предоставить выбранную модель розетки',
              'Доступ к электрощитку',
            ],
            media: buildMediaSet('Стандартная установка розетки', MEDIA_GALLERIES.outletInstall),
            estimatedTime: '1 час',
            maxTimeIncluded: 1.5,
          },
        ],
      },
      {
        name: 'Монтаж светильника',
        description: 'Установка потолочных и настенных светильников с проверкой работоспособности.',
        versions: [
          {
            versionNumber: 1,
            title: 'Монтаж потолочного светильника',
            description:
              'Сборка и подключение светильника с проверкой креплений и электрических соединений.',
            whatsIncluded: [
              'Диагностика существующей точки подключения',
              'Монтаж крепежной пластины',
              'Подключение проводов согласно схеме',
              'Проверка работоспособности и балансировки',
            ],
            whatsNotIncluded: [
              'Прокладка новой электролинии',
              'Монтаж подвесных потолков или каркаса',
              'Поставка светильника и ламп',
            ],
            unitOfMeasure: 'шт',
            requiredTools: [
              'Индикатор напряжения',
              'Отвертки и клеммники',
              'Перфоратор и дюбеля',
            ],
            customerRequirements: [
              'Подготовить рабочую площадку и стремянку',
              'Предоставить собранный светильник',
              'Обеспечить отключение электричества',
            ],
            media: buildMediaSet('Монтаж потолочного светильника', MEDIA_GALLERIES.lightFixture),
            estimatedTime: '1.5 часа',
            maxTimeIncluded: 2,
          },
        ],
      },
    ],
  },
  {
    name: 'Отделка',
    description: 'Отделочные работы и подготовка помещений к сдаче или проживанию.',
    services: [
      {
        name: 'Покраска стен',
        description: 'Подготовка поверхностей и нанесение лакокрасочных материалов.',
        versions: [
          {
            versionNumber: 1,
            title: 'Покраска стен в два слоя',
            description:
              'Полный цикл подготовки стен и нанесения двух слоев краски для равномерного покрытия.',
            whatsIncluded: [
              'Легкая шлифовка и обеспыливание поверхности',
              'Грунтование стен',
              'Нанесение двух слоев краски валиком и кистью',
              'Финальная проверка качества покрытия',
            ],
            whatsNotIncluded: [
              'Выравнивание стен штукатуркой',
              'Демонтаж старых покрытий',
              'Поставка краски и расходных материалов',
            ],
            unitOfMeasure: 'кв.м',
            requiredTools: [
              'Валики и кисти',
              'Лоток для краски',
              'Шлифовальная машинка',
              'Стремянка',
            ],
            customerRequirements: [
              'Освободить стены от мебели и декора',
              'Обеспечить вентиляцию в помещении',
              'Предоставить выбранную краску',
            ],
            media: buildMediaSet('Покраска стен в два слоя', MEDIA_GALLERIES.wallPainting),
            estimatedTime: '6 часов',
            maxTimeIncluded: 6,
          },
        ],
      },
      {
        name: 'Укладка плитки',
        description: 'Монтаж настенной или напольной плитки с затиркой швов.',
        versions: [
          {
            versionNumber: 1,
            title: 'Стандартная укладка плитки',
            description:
              'Укладка керамической плитки на подготовленное основание с затиркой и финишной очисткой.',
            whatsIncluded: [
              'Очистка и грунтование основания',
              'Разметка раскладки плитки',
              'Укладка плитки на клеевой состав',
              'Затирка швов и финальная очистка поверхности',
            ],
            whatsNotIncluded: [
              'Выравнивание стен или пола по маякам',
              'Резка сложных фигурных элементов',
              'Поставка плитки и затирки',
            ],
            unitOfMeasure: 'кв.м',
            requiredTools: [
              'Плиткорез',
              'Нивелир и уровень',
              'Зубчатый шпатель',
              'Резиновые молотки',
            ],
            customerRequirements: [
              'Предоставить плитку и расходники',
              'Обеспечить доступ к воде и электричеству',
              'Подготовить помещение от лишних предметов',
            ],
            media: buildMediaSet('Стандартная укладка плитки', MEDIA_GALLERIES.tileLaying),
            estimatedTime: '8 часов',
            maxTimeIncluded: 8,
          },
        ],
      },
    ],
  },
  {
    name: 'Климат',
    description: 'Монтаж и обслуживание климатической техники и инженерных систем.',
    services: [
      {
        name: 'Установка кондиционера',
        description: 'Монтаж сплит-системы с первичным пуско-наладочным обслуживанием.',
        versions: [
          {
            versionNumber: 1,
            title: 'Установка кондиционера «под ключ»',
            description:
              'Монтаж включает установку внутренних и наружных блоков, прокладку трассы и проверку герметичности.',
            whatsIncluded: [
              'Разметка и сверление монтажных отверстий',
              'Установка внутреннего и наружного блоков',
              'Прокладка фреоновой трассы до 5 метров',
              'Вакуумирование и запуск системы',
            ],
            whatsNotIncluded: [
              'Штробление капитальных стен более 1 метра',
              'Вынос строительного мусора',
              'Поставка кондиционера и дополнительных материалов',
            ],
            unitOfMeasure: 'комплект',
            requiredTools: [
              'Перфоратор с коронкой',
              'Вакуумный насос',
              'Медные трубогибы и расширители',
            ],
            customerRequirements: [
              'Согласовать место установки наружного блока',
              'Обеспечить доступ к источнику питания',
              'Предоставить кондиционер и комплектующие',
            ],
            media: buildMediaSet('Установка кондиционера «под ключ»', MEDIA_GALLERIES.acInstall),
            estimatedTime: '5 часов',
            maxTimeIncluded: 6,
          },
        ],
      },
      {
        name: 'Чистка кондиционера',
        description: 'Комплексная чистка кондиционера с дезинфекцией и проверкой дренажа.',
        versions: [
          {
            versionNumber: 1,
            title: 'Сезонная чистка кондиционера',
            description:
              'Включает чистку фильтров, теплообменников и проверку дренажной системы.',
            whatsIncluded: [
              'Демонтаж и промывка фильтров',
              'Чистка теплообменника и дренажной системы',
              'Антибактериальная обработка испарителя',
              'Контроль работы после сборки',
            ],
            whatsNotIncluded: [
              'Заправка хладагентом',
              'Ремонт электронных плат управления',
              'Монтаж новых дренажных систем',
            ],
            unitOfMeasure: 'шт',
            requiredTools: [
              'Мини-мойка или пароочиститель',
              'Специальные чистящие средства',
              'Щетки и пульверизаторы',
            ],
            customerRequirements: [
              'Обеспечить доступ к внутреннему и наружному блоку',
              'Предупредить о ранее проведенных обслуживаниях',
              'Предоставить парковку или пропуск при необходимости',
            ],
            media: buildMediaSet('Сезонная чистка кондиционера', MEDIA_GALLERIES.acCleaning),
            estimatedTime: '2 часа',
            maxTimeIncluded: 2,
          },
        ],
      },
      {
        name: 'Настройка котла',
        description: 'Пуско-наладка и настройка параметров работы газового котла.',
        versions: [
          {
            versionNumber: 1,
            title: 'Пуско-наладка котла',
            description:
              'Настройка автоматики, проверка безопасности и инструктаж пользователя по эксплуатации котла.',
            whatsIncluded: [
              'Подключение котла к инженерным системам',
              'Проверка герметичности газовых и водяных соединений',
              'Настройка автоматики и рабочих режимов',
              'Инструктаж пользователя по эксплуатации',
            ],
            whatsNotIncluded: [
              'Монтаж дымохода',
              'Перенос и переварка трубопроводов',
              'Согласование проекта с надзорными органами',
            ],
            unitOfMeasure: 'шт',
            requiredTools: [
              'Манометр и газоанализатор',
              'Набор гаечных ключей',
              'Отвертки и шестигранники',
            ],
            customerRequirements: [
              'Наличие действующего договора на газоснабжение',
              'Подключенные системы отопления и водоснабжения',
              'Доступ к электрической сети и документации на котел',
            ],
            media: buildMediaSet('Пуско-наладка котла', MEDIA_GALLERIES.boilerSetup),
            estimatedTime: '3 часа',
            maxTimeIncluded: 3,
          },
        ],
      },
    ],
  },
  {
    name: 'Уборка',
    description: 'Профессиональные клининговые услуги для квартир и офисов.',
    services: [
      {
        name: 'Генеральная уборка',
        description: 'Комплексная уборка помещения с удалением стойких загрязнений.',
        versions: [
          {
            versionNumber: 1,
            title: 'Генеральная уборка квартиры',
            description:
              'Команда клинеров проводит полную уборку помещения, включая сантехнику и кухонную технику.',
            whatsIncluded: [
              'Сухая и влажная уборка всех поверхностей',
              'Мойка кухонной техники снаружи',
              'Чистка санузлов с дезинфекцией',
              'Сбор и вынос бытового мусора',
            ],
            whatsNotIncluded: [
              'Химчистка мягкой мебели',
              'Мытье окон на высоте с привлечением альпинистов',
              'Удаление строительного мусора',
            ],
            unitOfMeasure: 'объект',
            requiredTools: [
              'Пылесос и пароочиститель',
              'Профессиональная химия для уборки',
              'Мопы и салфетки из микрофибры',
            ],
            customerRequirements: [
              'Обеспечить доступ во все комнаты',
              'Сообщить о деликатных поверхностях',
              'Согласовать время начала работ',
            ],
            media: buildMediaSet('Генеральная уборка квартиры', MEDIA_GALLERIES.deepCleaning),
            estimatedTime: '7 часов',
            maxTimeIncluded: 7,
          },
        ],
      },
      {
        name: 'Мойка окон',
        description: 'Профессиональная мойка оконных блоков внутри и снаружи.',
        versions: [
          {
            versionNumber: 1,
            title: 'Мойка окон и балконных блоков',
            description:
              'Очистка стекол, рам и подоконников специальными средствами без разводов.',
            whatsIncluded: [
              'Удаление пыли и грязи с рам и откосов',
              'Мытье стекол внутри и снаружи (до 3 этажа)',
              'Полировка стекол до блеска',
              'Очистка подоконников и оконных аксессуаров',
            ],
            whatsNotIncluded: [
              'Работы на высоте с автовышки',
              'Ремонт и регулировка фурнитуры',
              'Демонтаж и монтаж оконных блоков',
            ],
            unitOfMeasure: 'кв.м',
            requiredTools: [
              'Телескопические швабры и сквиджи',
              'Средства для стекол без разводов',
              'Микрофибровые салфетки',
            ],
            customerRequirements: [
              'Освободить подоконники и прилегающие поверхности',
              'Сообщить о сложных или нестандартных конструкциях',
              'Обеспечить доступ к воде и электричеству',
            ],
            media: buildMediaSet('Мойка окон и балконных блоков', MEDIA_GALLERIES.windowWashing),
            estimatedTime: '4 часа',
            maxTimeIncluded: 4,
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
      lat: [55.55, 55.92],
      lng: [37.30, 37.82],
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
      lat: [54.80, 55.10],
      lng: [82.80, 83.20],
    },
  },
  {
    name: 'Екатеринбург',
    slug: 'yekaterinburg',
    range: {
      lat: [56.75, 56.95],
      lng: [60.50, 60.80],
    },
  },
  {
    name: 'Нижний Новгород',
    slug: 'nizhniy-novgorod',
    range: {
      lat: [56.20, 56.40],
      lng: [43.80, 44.10],
    },
  },
];

const providerSeeds: SeedProvider[] = [
  {
    email: 'alexey.plumber@seed.local',
    displayName: 'Алексей Петров',
    description: 'Сантехник с опытом работы более 12 лет, специализация — монтаж и ремонт оборудования.',
    citySlug: 'moskva',
    hourlyRate: 1900,
  },
  {
    email: 'irina.master@seed.local',
    displayName: 'Ирина Смирнова',
    description: 'Мастер по мелкому ремонту и диагностике в Санкт-Петербурге.',
    citySlug: 'sankt-peterburg',
    hourlyRate: 2100,
  },
  {
    email: 'maxim.electric@seed.local',
    displayName: 'Максим Электриков',
    description: 'Сертифицированный электрик, работаю с квартирами и частными домами.',
    citySlug: 'moskva',
    hourlyRate: 2300,
  },
  {
    email: 'daria.clean@seed.local',
    displayName: 'Дарья Чистюлина',
    description: 'Профессиональная команда клинеров для квартир и офисов.',
    citySlug: 'yekaterinburg',
    hourlyRate: 1600,
  },
  {
    email: 'sergey.finish@seed.local',
    displayName: 'Сергей Отделочник',
    description: 'Отделочные работы любой сложности, включая покраску и плитку.',
    citySlug: 'kazan',
    hourlyRate: 2000,
  },
  {
    email: 'anna.climate@seed.local',
    displayName: 'Анна Климатова',
    description: 'Обслуживание кондиционеров и систем вентиляции.',
    citySlug: 'novosibirsk',
    hourlyRate: 1850,
  },
  {
    email: 'pavel.window@seed.local',
    displayName: 'Павел Оконников',
    description: 'Профессиональная мойка окон и витрин.',
    citySlug: 'sankt-peterburg',
    hourlyRate: 1500,
  },
  {
    email: 'olga.decor@seed.local',
    displayName: 'Ольга Декор',
    description: 'Дизайнерская покраска и декоративные штукатурки.',
    citySlug: 'moskva',
    hourlyRate: 2400,
  },
  {
    email: 'vladimir.fix@seed.local',
    displayName: 'Владимир Починкин',
    description: 'Экстренный ремонт протечек и сантехнических аварий.',
    citySlug: 'nizhniy-novgorod',
    hourlyRate: 2050,
  },
  {
    email: 'svetlana.clean@seed.local',
    displayName: 'Светлана Уют',
    description: 'Генеральная уборка квартир и домов в Казани.',
    citySlug: 'kazan',
    hourlyRate: 1550,
  },
  {
    email: 'nikita.ac@seed.local',
    displayName: 'Никита Морозов',
    description: 'Монтаж кондиционеров и климатических систем под ключ.',
    citySlug: 'yekaterinburg',
    hourlyRate: 2200,
  },
  {
    email: 'elena.tidy@seed.local',
    displayName: 'Елена Чистова',
    description: 'Премиальный клининг для офисов и апартаментов.',
    citySlug: 'moskva',
    hourlyRate: 2100,
  },
  {
    email: 'roman.handyman@seed.local',
    displayName: 'Роман Мастерской',
    description: 'Мастер на все руки: сантехника, электрика, мелкий ремонт.',
    citySlug: 'novosibirsk',
    hourlyRate: 1950,
  },
  {
    email: 'maria.light@seed.local',
    displayName: 'Мария Светлова',
    description: 'Монтаж светильников и дизайн освещения.',
    citySlug: 'sankt-peterburg',
    hourlyRate: 2250,
  },
  {
    email: 'egor.tiles@seed.local',
    displayName: 'Егор Плиткин',
    description: 'Профессиональная укладка плитки в ванных и кухнях.',
    citySlug: 'nizhniy-novgorod',
    hourlyRate: 2150,
  },
  {
    email: 'ksenia.paint@seed.local',
    displayName: 'Ксения Цвет',
    description: 'Покраска стен с художественными элементами.',
    citySlug: 'moskva',
    hourlyRate: 2450,
  },
  {
    email: 'ilya.boilers@seed.local',
    displayName: 'Илья Котлов',
    description: 'Настройка котлов и пуско-наладочные работы.',
    citySlug: 'kazan',
    hourlyRate: 2350,
  },
  {
    email: 'tatiana.fix@seed.local',
    displayName: 'Татьяна Починка',
    description: 'Сантехнические работы и профилактика систем водоснабжения.',
    citySlug: 'novosibirsk',
    hourlyRate: 1800,
  },
  {
    email: 'gennady.service@seed.local',
    displayName: 'Геннадий Услугов',
    description: 'Полный спектр бытовых услуг для квартир и коттеджей.',
    citySlug: 'yekaterinburg',
    hourlyRate: 2050,
  },
  {
    email: 'arina.clean@seed.local',
    displayName: 'Арина Блеск',
    description: 'Экологичная уборка и уход за домом.',
    citySlug: 'nizhniy-novgorod',
    hourlyRate: 1650,
  },
];

const customerSeeds: SeedCustomer[] = [
  { email: 'customer.one@seed.local', fullName: 'Иван Клиент' },
  { email: 'customer.two@seed.local', fullName: 'Мария Заказчик' },
  { email: 'customer.three@seed.local', fullName: 'Петр Покупатель' },
  { email: 'customer.four@seed.local', fullName: 'Анна Пользователь' },
  { email: 'customer.five@seed.local', fullName: 'Светлана Клиентка' },
];

function randomInRange([min, max]: [number, number]): number {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function pickRandomSubset<T>(items: T[], desiredCount: number): T[] {
  const shuffled = shuffleArray([...items]);
  return shuffled.slice(0, Math.min(desiredCount, shuffled.length));
}

async function seedCities() {
  const cityMap: Record<string, { id: string; range: CoordinateRange }> = {};

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

async function seedCatalog(authorId: string): Promise<ActiveServiceVersion[]> {
  const activeVersions: ActiveServiceVersion[] = [];

  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { name: categoryData.name },
      update: {
        description: categoryData.description ?? null,
      },
      create: {
        name: categoryData.name,
        slug: generateSlug(categoryData.name),
        description: categoryData.description ?? null,
      },
    });

    for (const serviceData of categoryData.services) {
      const serviceTemplate = await prisma.serviceTemplate.upsert({
        where: {
          categoryId_name: { categoryId: category.id, name: serviceData.name },
        },
        update: {
          description: serviceData.description ?? null,
        },
        create: {
          categoryId: category.id,
          name: serviceData.name,
          slug: generateSlug(serviceData.name),
          description: serviceData.description ?? null,
          authorId: authorId,
        },
      });

      await prisma.serviceTemplateVersion.updateMany({
        where: { serviceTemplateId: serviceTemplate.id },
        data: { isActive: false },
      });

      const versions = [...serviceData.versions].sort(
        (a, b) => a.versionNumber - b.versionNumber,
      );

      for (const versionData of versions) {
        const version = await prisma.serviceTemplateVersion.upsert({
          where: {
            serviceTemplateId_versionNumber: {
              serviceTemplateId: serviceTemplate.id,
              versionNumber: versionData.versionNumber,
            },
          },
          update: {
            title: versionData.title,
            description: versionData.description,
            whatsIncluded: versionData.whatsIncluded,
            whatsNotIncluded: versionData.whatsNotIncluded,
            unitOfMeasure: versionData.unitOfMeasure,
            requiredTools: versionData.requiredTools,
            customerRequirements: versionData.customerRequirements,
            estimatedTime: versionData.estimatedTime,
            maxTimeIncluded: versionData.maxTimeIncluded ?? null,
            media:
              versionData.media ??
              buildMediaSet(versionData.title, FALLBACK_MEDIA_GALLERY),
            isActive: true,
          },
          create: {
            serviceTemplateId: serviceTemplate.id,
            versionNumber: versionData.versionNumber,
            title: versionData.title,
            description: versionData.description,
            whatsIncluded: versionData.whatsIncluded,
            whatsNotIncluded: versionData.whatsNotIncluded,
            unitOfMeasure: versionData.unitOfMeasure,
            requiredTools: versionData.requiredTools,
            customerRequirements: versionData.customerRequirements,
            estimatedTime: versionData.estimatedTime,
            maxTimeIncluded: versionData.maxTimeIncluded ?? null,
            media:
              versionData.media ??
              buildMediaSet(versionData.title, FALLBACK_MEDIA_GALLERY),
            isActive: true,
          },
        });

        activeVersions.push({
          id: version.id,
          serviceName: serviceData.name,
          categoryName: categoryData.name,
          title: version.title,
        });
      }
    }
  }

  return activeVersions;
}

async function setProviderHomeLocation(
  providerProfileId: string,
  longitude: number,
  latitude: number,
) {
  await prisma.$executeRaw`
    UPDATE "ProviderProfile"
    SET "homeLocation" = ST_SetSRID(
      ST_MakePoint(${longitude}, ${latitude}),
      4326
    )::point
    WHERE "id" = ${providerProfileId}
  `;
}

async function seedProviders(
  cityMap: Record<string, { id: string; range: CoordinateRange }>,
  activeVersions: ActiveServiceVersion[],
) {
  const providerCountWithPrices = Math.round(
    providerSeeds.length * PRICES_PER_PROVIDER_RATIO,
  );
  const providerIndices = shuffleArray(
    Array.from({ length: providerSeeds.length }, (_, index) => index),
  );
  const pricedProviders = new Set(
    providerIndices.slice(0, providerCountWithPrices),
  );

  for (const [index, providerData] of providerSeeds.entries()) {
    const city = cityMap[providerData.citySlug];

    if (!city) {
      continue;
    }

    const user = await prisma.user.upsert({
      where: { email: providerData.email },
      update: {
        role: Role.PROVIDER,
      },
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
        description: providerData.description,
        cityId: city.id,
        hourlyRate: new Prisma.Decimal(providerData.hourlyRate),
      },
      create: {
        userId: user.id,
        displayName: providerData.displayName,
        description: providerData.description,
        cityId: city.id,
        hourlyRate: new Prisma.Decimal(providerData.hourlyRate),
      },
    });

    const longitude = randomInRange(city.range.lng);
    const latitude = randomInRange(city.range.lat);

    await setProviderHomeLocation(profile.id, longitude, latitude);

    await prisma.price.deleteMany({ where: { providerProfileId: profile.id } });

    if (!pricedProviders.has(index)) {
      continue;
    }

    const priceCount = getRandomInt(
      SERVICES_PER_PROVIDER_MIN,
      SERVICES_PER_PROVIDER_MAX,
    );
    const servicesToPrice = pickRandomSubset(activeVersions, priceCount);

    for (const serviceVersion of servicesToPrice) {
      const basePrice = getRandomInt(1500, 9000);
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      await prisma.price.upsert({
        where: {
          providerProfileId_serviceTemplateVersionId: {
            providerProfileId: profile.id,
            serviceTemplateVersionId: serviceVersion.id,
          },
        },
        update: {
          price: new Prisma.Decimal(basePrice),
          expiresAt,
        },
        create: {
          providerProfileId: profile.id,
          serviceTemplateVersionId: serviceVersion.id,
          price: new Prisma.Decimal(basePrice),
          expiresAt,
        },
      });
    }
  }
}

async function seedCustomers() {
  for (const customer of customerSeeds) {
    const user = await prisma.user.upsert({
      where: { email: customer.email },
      update: {
        role: Role.CUSTOMER,
      },
      create: {
        email: customer.email,
        passwordHash: 'seeded-hash',
        role: Role.CUSTOMER,
      },
    });

    await prisma.customerProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: customer.fullName,
      },
      create: {
        userId: user.id,
        fullName: customer.fullName,
      },
    });
  }
}

async function main() {
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgis;`);
  console.log('PostGIS extension ensured.');
  console.log('Starting seed...');

  const author = await prisma.user.upsert({
    where: { email: 'catalog-author@example.com' },
    update: {
      role: Role.PROVIDER,
    },
    create: {
      email: 'catalog-author@example.com',
      passwordHash: 'seeded-hash',
      role: Role.PROVIDER,
    },
  });

  const cityMap = await seedCities();
  const activeVersions = await seedCatalog(author.id);
  await seedProviders(cityMap, activeVersions);
  await seedCustomers();

  console.log('Seed finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021') {
      console.error(
        'Prisma сообщает, что таблица отсутствует (ошибка P2021). '
          + 'Сначала нужно применить все миграции: \n'
          + '  pnpm prisma migrate deploy\n'
          + 'После успешного применения миграций запустите сидер ещё раз.'
      );
    }

    console.error('An error occurred during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
