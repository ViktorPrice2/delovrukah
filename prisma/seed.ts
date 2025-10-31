import { Prisma, PrismaClient, Role } from '@prisma/client';
import { slugify } from 'transliteration'; // Установим эту библиотеку

const prisma = new PrismaClient();

// --- НОВАЯ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ---
function generateSlug(text: string): string {
  // slugify из библиотеки transliteration отлично преобразует кириллицу
  // "Установка Смесителя" -> "ustanovka-smesitelya"
  return slugify(text, { lowercase: true, separator: '-' });
}
// --- КОНЕЦ НОВОЙ ФУНКЦИИ ---

type SeedServiceVersion = {
  versionNumber: number;
  title: string;
  description: string;
  whatsIncluded: Prisma.InputJsonValue;
  whatsNotIncluded: Prisma.InputJsonValue;
  unitOfMeasure: string;
  requiredTools: Prisma.InputJsonValue;
  customerRequirements: Prisma.InputJsonValue;
  isActive?: boolean;
  media?: Prisma.InputJsonValue;
  estimatedTime?: string | null;
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
  mixerBasic: [
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
    'https://images.unsplash.com/photo-1581579186989-0f9ee7ea8f29',
    'https://images.unsplash.com/photo-1582719478141-44d23c4d49b2',
  ],
  mixerAdvanced: [
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623',
    'https://images.unsplash.com/photo-1582560475093-23b83109d9d3',
    'https://images.unsplash.com/photo-1582719478181-bf6c1b1fefd1',
  ],
  siphonCleaning: [
    'https://images.unsplash.com/photo-1570129476769-dcb17c91f90e',
    'https://images.unsplash.com/photo-1579546928687-0f9be64d0a3c',
    'https://images.unsplash.com/photo-1581579186984-7f9d48f223e1',
  ],
  outletInstallation: [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
    'https://images.unsplash.com/photo-1492724441997-5dc865305da7',
    'https://images.unsplash.com/photo-1582056619247-73f8ffa8fd2c',
  ],
  wiringDiagnostics: [
    'https://images.unsplash.com/photo-1582719478173-e5ff41e5974e',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
  ],
  wiringAdvanced: [
    'https://images.unsplash.com/photo-1593011957406-898b9612b05d',
    'https://images.unsplash.com/photo-1523419409543-0c1df022bdd1',
    'https://images.unsplash.com/photo-1582719478141-44d23c4d49b2',
  ],
  wallPainting: [
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
    'https://images.unsplash.com/photo-1523419409543-0c1df022bdd1',
  ],
  tileLaying: [
    'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6',
    'https://images.unsplash.com/photo-1523779105320-d1cd346ff52c',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac',
  ],
  acInstallation: [
    'https://images.unsplash.com/photo-1582719478131-d4f71c0d8af5',
    'https://images.unsplash.com/photo-1523419409543-0c1df022bdd1',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
  ],
  acCleaning: [
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
    'https://images.unsplash.com/photo-1581579186984-7f9d48f223e1',
    'https://images.unsplash.com/photo-1505691723518-36a1d8328535',
  ],
  boilerSetup: [
    'https://images.unsplash.com/photo-1581579186989-0f9ee7ea8f29',
    'https://images.unsplash.com/photo-1582719478173-e5ff41e5974e',
    'https://images.unsplash.com/photo-1582056619247-73f8ffa8fd2c',
  ],
} satisfies Record<string, string[]>;

const FALLBACK_MEDIA_GALLERY = [
  'https://images.unsplash.com/photo-1582719478173-e5ff41e5974e',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e',
  'https://images.unsplash.com/photo-1581579186989-0f9ee7ea8f29',
];

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
            whatsIncluded: [
              'Демонтаж старого смесителя',
              'Установка нового смесителя на готовые выводы воды',
              'Подключение гибких подводок',
              'Проверка герметичности соединений',
            ],
            whatsNotIncluded: [
              'Прокладка новой трубной разводки',
              'Штробление стен и скрытая прокладка коммуникаций',
              'Поставка расходных материалов',
            ],
            unitOfMeasure: 'шт',
            requiredTools: [
              'Газовый или разводной ключ',
              'Фум-лента или герметик',
              'Отвертки крестовая и плоская',
            ],
            customerRequirements: [
              'Свободный доступ к месту установки',
              'Исправные запорные краны на подводках',
              'Наличие нового смесителя и комплектующих',
            ],
            isActive: false,
            media: buildMediaSet(
              'Базовая установка смесителя',
              MEDIA_GALLERIES.mixerBasic,
            ),
            estimatedTime: '1.5 часа',
          },
          {
            versionNumber: 2,
            title: 'Расширенная установка смесителя',
            description:
              'Дополнительно включает замену гибкой подводки и установку фильтров грубой очистки.',
            whatsIncluded: [
              'Все работы базовой установки',
              'Замена гибкой подводки и прокладок',
              'Установка фильтров грубой очистки на вводе',
              'Контроль правильности давления и температуры воды',
            ],
            whatsNotIncluded: [
              'Монтаж фильтров тонкой очистки',
              'Выравнивание или шпаклевка стен',
              'Устройство скрытых ревизионных люков',
            ],
            unitOfMeasure: 'шт',
            requiredTools: [
              'Набор гаечных ключей',
              'Пресс-клещи для фитингов',
              'Фум-лента и паста-герметик',
              'Измерительные приборы для контроля давления',
            ],
            customerRequirements: [
              'Подготовленные и доступные точки подключения',
              'Предоставление фильтров и новых комплектующих',
              'Возможность отключения стояка воды при необходимости',
            ],
            media: buildMediaSet(
              'Расширенная установка смесителя',
              MEDIA_GALLERIES.mixerAdvanced,
            ),
            estimatedTime: '2 часа',
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
            whatsIncluded: [
              'Диагностика причины засора',
              'Демонтаж сифона и сливных трубок',
              'Механическая и гидравлическая чистка деталей',
              'Установка сифона и проверка на протечки',
            ],
            whatsNotIncluded: [
              'Ремонт или замена канализационных стояков',
              'Замена раковины или сантехнических приборов',
              'Использование химических реагентов клиента',
            ],
            unitOfMeasure: 'шт',
            requiredTools: [
              'Набор отверток',
              'Ёршик и гибкий трос',
              'Ведро и тряпки для воды',
            ],
            customerRequirements: [
              'Освободить доступ к раковине или ванне',
              'Обеспечить рабочее пространство для демонтажа',
              'Предоставить информацию о предыдущих ремонтах',
            ],
            media: buildMediaSet('Промывка сифона', MEDIA_GALLERIES.siphonCleaning),
            estimatedTime: '45 минут',
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
            media: buildMediaSet(
              'Стандартная установка розетки',
              MEDIA_GALLERIES.outletInstallation,
            ),
            estimatedTime: '1 час',
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
            whatsIncluded: [
              'Визуальный осмотр электрощита',
              'Проверка автоматических выключателей',
              'Контроль напряжения в розетках и выключателях',
              'Краткий письменный отчет о состоянии сети',
            ],
            whatsNotIncluded: [
              'Замена неисправных элементов',
              'Тепловизионная съемка',
              'Скрытая проверка проводки в стенах',
            ],
            unitOfMeasure: 'объект',
            requiredTools: [
              'Мультиметр',
              'Индикатор фазы',
              'Отвертки и шестигранники',
            ],
            customerRequirements: [
              'Свободный доступ к электрощиту',
              'Согласование отключения питания при необходимости',
              'Предоставление плана объекта при наличии',
            ],
            media: buildMediaSet('Первичная диагностика электропроводки', MEDIA_GALLERIES.wiringDiagnostics),
            estimatedTime: '2 часа',
          },
          {
            versionNumber: 2,
            title: 'Расширенная диагностика',
            description:
              'Включает тепловизионную съемку и проверку распределительного щита.',
            whatsIncluded: [
              'Все работы первичной диагностики',
              'Тепловизионная съемка распределительных коробок',
              'Измерение сопротивления изоляции',
              'Расширенный отчет с рекомендациями по устранению неисправностей',
            ],
            whatsNotIncluded: [
              'Ремонт выявленных неисправностей',
              'Замена кабелей и автоматов',
              'Пусконаладочные работы оборудования',
            ],
            unitOfMeasure: 'объект',
            requiredTools: [
              'Мультиметр и мегаомметр',
              'Тепловизор',
              'Измерительные клещи',
            ],
            customerRequirements: [
              'Доступ в распределительные шкафы и скрытые ниши',
              'Предоставление информации о нагрузках и оборудовании',
              'Возможность кратковременного отключения линий',
            ],
            media: buildMediaSet('Расширенная диагностика электропроводки', MEDIA_GALLERIES.wiringAdvanced),
            estimatedTime: '3.5 часа',
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
            whatsIncluded: [
              'Легкая шлифовка и обеспыливание поверхности',
              'Заклейка плинтусов и смежных поверхностей защитной лентой',
              'Грунтование стен',
              'Нанесение одного слоя краски валиком и кистью',
            ],
            whatsNotIncluded: [
              'Шпатлевка глубоких неровностей',
              'Демонтаж старых покрытий',
              'Поставка краски и расходных материалов',
            ],
            unitOfMeasure: 'кв.м.',
            requiredTools: [
              'Валики и кисти',
              'Лоток для краски',
              'Шлифовальная машинка',
              'Стремянка',
            ],
            customerRequirements: [
              'Освободить стены от мебели',
              'Обеспечить сухость и чистоту помещения',
              'Предоставить выбранную краску',
            ],
            media: buildMediaSet('Покраска стен в один слой', MEDIA_GALLERIES.wallPainting),
            estimatedTime: '6 часов',
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
            whatsIncluded: [
              'Очистка и грунтование основания',
              'Разметка раскладки плитки',
              'Укладка плитки на клеевой состав',
              'Затирка швов и финальная очистка поверхности',
            ],
            whatsNotIncluded: [
              'Выравнивание стен или пола по маякам',
              'Резка сложных фигурных элементов',
              'Монтаж декоративных профилей',
            ],
            unitOfMeasure: 'кв.м.',
            requiredTools: [
              'Плиткорез и болгарка',
              'Крестики или СВП',
              'Зубчатый шпатель',
              'Уровень и правило',
            ],
            customerRequirements: [
              'Предоставить плитку и расходные материалы',
              'Обеспечить ровное и прочное основание',
              'Свободный доступ к рабочей зоне',
            ],
            media: buildMediaSet('Базовая укладка плитки', MEDIA_GALLERIES.tileLaying),
            estimatedTime: '8 часов',
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
        name: 'Установка кондиционера',
        description: 'Профессиональная установка сплит-систем любой мощности.',
        versions: [
            {
                versionNumber: 1,
                title: 'Стандартная установка кондиционера до 3 кВт',
                description: 'Включает монтаж внутреннего и внешнего блоков, прокладку трассы до 3 метров.',
                whatsIncluded: [
                  'Выезд и консультация перед монтажом',
                  'Установка внутреннего и внешнего блоков на готовые поверхности',
                  'Прокладка межблочной трассы до 3 метров',
                  'Вакуумирование системы и пробный запуск',
                ],
                whatsNotIncluded: [
                  'Штробление стен и скрытая укладка трассы',
                  'Установка внешнего блока выше 2 этажа без автовышки',
                  'Прокладка отдельной электролинии',
                ],
                unitOfMeasure: 'шт',
                requiredTools: [
                  'Перфоратор и набор буров',
                  'Вакуумный насос и манометрический коллектор',
                  'Трубогиб и развальцовочный набор',
                  'Анкерные крепления',
                ],
                customerRequirements: [
                  'Подготовить место для внутреннего и внешнего блока',
                  'Обеспечить доступ к электропитанию 220 В',
                  'Получить разрешение управляющей компании при необходимости',
                ],
                media: buildMediaSet(
                  'Стандартная установка кондиционера',
                  MEDIA_GALLERIES.acInstallation,
                ),
                estimatedTime: '4 часа',
            },
        ],
      },
      {
        name: 'Чистка кондиционера',
        description: 'Промывка фильтров и обработка теплообменника.',
        versions: [
          {
            versionNumber: 1,
            title: 'Сезонная чистка кондиционера',
            description: 'Комплексная чистка внутреннего и наружного блока.',
            whatsIncluded: [
              'Осмотр кондиционера и диагностика загрязнений',
              'Снятие и промывка фильтров',
              'Чистка теплообменника и дренажной системы',
              'Дезинфекция испарителя и корпуса',
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
      {
        categoryName: 'Климат',
        serviceName: 'Установка кондиционера',
        price: 9500,
      }
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

// Функция `ensureSeedUsers` больше не нужна в старом виде

async function seedCatalog(authorId: string) {
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
      // KeeperId пока не назначаем, так как не знаем, кто будет хранителем
      const service = await prisma.serviceTemplate.upsert({
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
          authorId: authorId, // Назначаем автора
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
            description: versionData.description,
            whatsIncluded: versionData.whatsIncluded,
            whatsNotIncluded: versionData.whatsNotIncluded,
            unitOfMeasure: versionData.unitOfMeasure,
            requiredTools: versionData.requiredTools,
            customerRequirements: versionData.customerRequirements,
            media:
              versionData.media ??
              buildMediaSet(versionData.title, FALLBACK_MEDIA_GALLERY),
            estimatedTime: versionData.estimatedTime ?? null,
            isActive,
          },
          create: {
            serviceTemplateId: service.id,
            versionNumber: versionData.versionNumber,
            title: versionData.title,
            description: versionData.description,
            whatsIncluded: versionData.whatsIncluded,
            whatsNotIncluded: versionData.whatsNotIncluded,
            unitOfMeasure: versionData.unitOfMeasure,
            requiredTools: versionData.requiredTools,
            customerRequirements: versionData.customerRequirements,
            media:
              versionData.media ??
              buildMediaSet(versionData.title, FALLBACK_MEDIA_GALLERY),
            estimatedTime: versionData.estimatedTime ?? null,
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
    SET "homeLocation" = ST_SetSRID(
      ST_MakePoint(${longitude}, ${latitude}),
      4326
    )::point
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

      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      await prisma.price.upsert({
        where: {
          providerProfileId_serviceTemplateVersionId: {
            providerProfileId: profile.id,
            serviceTemplateVersionId: version.id,
          },
        },
        update: {
          price: new Prisma.Decimal(service.price),
          expiresAt,
        },
        create: {
          providerProfileId: profile.id,
          serviceTemplateVersionId: version.id,
          price: new Prisma.Decimal(service.price),
          expiresAt,
        },
      });
    }
  }
}

async function main() {
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgis;`);
  console.log(`PostGIS extension ensured.`);
  console.log('Starting seed...');

  // 1. Создаем тестового пользователя-автора
  const author = await prisma.user.upsert({
    where: { email: 'catalog-author@example.com' },
    update: {},
    create: {
      email: 'catalog-author@example.com',
      passwordHash: 'seeded-hash',
      role: Role.PROVIDER, // Авторы могут быть и исполнителями
    },
  });

  // 2. Создаем города
  const cityMap = await seedCities();
  
  // 3. Создаем каталог, передавая ID автора
  await seedCatalog(author.id);
  
  // 4. Создаем исполнителей и их цены
  await seedProviders(cityMap);
  
  console.log('Seed finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('An error occurred during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });