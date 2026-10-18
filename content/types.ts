/**
 * Текст студии: польский обязателен, русский — у студии с `ru` в `languages`. Что он есть у
 * каждого текста, проверяет content/studio.test.ts.
 */
export type Text = { pl: string; ru?: string };

export type CarClass = "S" | "M" | "L" | "XL";

/** Размер диска в дюймах: «R15». */
export type RimSize = `R${13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24}`;

/**
 * Цена услуги. Других видов нет: цена, которая не ложится ни в один, — вопрос к
 * владельцу, а не строка в данных.
 */
export type Price =
  /** Своя для S, M и L; у XL всегда «indywidualnie». */
  | { kind: "byClass"; S: number; M: number; L: number }
  /** Одна для всех классов. */
  | { kind: "fixed"; amount: number }
  /** «od …»: окончательная зависит от машины. */
  | { kind: "from"; amount: number }
  | { kind: "individual" }
  /**
   * За одно колесо по размеру диска — шиномонтаж (DESIGN.md, «Прайс»): размеры подряд, от 2
   * до 5 (RIMS_MAX, lib/rims.ts), у всех таких услуг группы одни и те же. Прайс главной выбирает размер
   * переключателем, остальные места показывают «od» самой низкой.
   */
  | { kind: "byRim"; rims: Partial<Record<RimSize, number>> };

/** «1 dzień», «3–4 dni», «2 godziny». */
export type Duration = { unit: "hour" | "day"; min: number; max?: number };

/**
 * Фото на странице. Размер — файла: по нему страница держит место под кадр, и вёрстка
 * не сдвигается при загрузке.
 */
export type Photo = {
  /** Путь от public/: «/przed-po/mycie/po.webp». */
  src: string;
  width: number;
  height: number;
  alt: Text;
  /** Кадр сделан ИИ: на странице подписан как пример (DESIGN.md, «Фотографии»). */
  ai: boolean;
};

/** Файл карты для экрана 2x: страница показывает его в половину размера. */
export type MapFile = { src: string; width: number; height: number };

/**
 * Карта страницы Kontakt (DESIGN.md, «Страница Kontakt»): улицы «чернилами» — белым с
 * прозрачностью; цвет им даёт тема, булавку в середине рисует страница. wide — для
 * десктопа, narrow — его середина для телефона и планшета. Готовит scripts/map/render.py —
 * он же печатает это поле.
 */
export type StudioMap = { wide: MapFile; narrow: MapFile };

/**
 * До/после услуги: кадры 4:5 одного размера, «после» — тот же кадр, что «до». Готовит
 * scripts/before-after/generate.py — он же печатает пути и размеры.
 */
export type BeforeAfter = {
  /** Короткая подпись вкладки на главной: «Mycie». */
  label: Text;
  before: Photo;
  after: Photo;
};

export type Service = {
  name: Text;
  /** Марка продукта после названия, подсвечивается акцентом: GYEON. */
  brand?: string;
  /** Примечание под названием: «Wszystkie klasy», от чего зависит цена «od». */
  note?: Text;
  price: Price;
  duration?: Duration;
  /** Что входит — пунктами, для страницы группы. */
  scope?: Text[];
  /** До/после этой услуги: на главной — вкладкой в порядке прайса. */
  beforeAfter?: BeforeAfter;
};

export type Faq = { question: Text; answer: Text };

export type ServiceGroup = {
  /** Адрес страницы группы (`/uslugi/<slug>`) и её якорь в прайсе главной. */
  slug: string;
  name: Text;
  /** Вводный абзац страницы группы. Есть он — у группы есть страница. */
  intro?: Text;
  /** Строка под «Nie wiesz, którą wybrać?» на странице группы: «Zadzwoń — doradzimy…». */
  advice?: Text;
  services: Service[];
  faq?: Faq[];
};

/** Цифра в ряду под вводным абзацем O nas: «2019» — «rok otwarcia studia». */
export type AboutFact = { value: string; label: Text };

/** Глава O nas: заголовок, абзацы и кадр 4:5 рядом. */
export type AboutChapter = { title: Text; paragraphs: Text[]; photo: Photo };

/**
 * Страница O nas (DESIGN.md, «Страница O nas»): с чего студия начинала, как работает, на
 * чём. Оферта просит у клиента пару абзацев о себе и фото — из них и собирается.
 */
export type About = {
  /** Вводный абзац под заголовком; он же описание страницы для поиска. */
  intro: Text;
  facts: AboutFact[];
  chapters: AboutChapter[];
};

/** Время «ЧЧ:ММ». Закрытие в тот же день, позже открытия; null — выходной. */
export type DayHours = { open: string; close: string } | null;

/** С понедельника по воскресенье. */
export type WeekHours = readonly [
  DayHours,
  DayHours,
  DayHours,
  DayHours,
  DayHours,
  DayHours,
  DayHours,
];

/**
 * Номера — в международном формате без пробелов: +48123456789. У страницы Facebook без
 * своего имени вместо него номер из ссылки: profile.php?id=123456789012345.
 */
export type Messenger =
  | { kind: "telegram"; username: string }
  | { kind: "telegram"; phone: string }
  | { kind: "whatsapp"; phone: string }
  | { kind: "instagram"; username: string }
  | { kind: "facebook"; username: string }
  | { kind: "facebook"; id: string };

export type Review = {
  author: string;
  text: Text;
  /** У выдуманной студии отзывы — примеры и подписаны так на странице. */
  source: "google" | "example";
};

/** Фара в процентах кадра машины: центр (x слева, y сверху) и ширина её светодиодов. */
export type Headlight = { x: number; y: number; w: number };

/** Переднее колесо в процентах ширины кадра машины: центр и ширина шины. */
export type Wheel = { x: number; w: number };

/**
 * Неоновая подсветка днища (объёмная машина): трубка под передней губой и колёса,
 * которые заслоняют свет трубок вдоль порогов. Проценты ширины кадра машины. Задаётся
 * в JSON кадра (scripts/hero-car/m3.json), cutout.py печатает её вместе с машиной.
 */
export type Underglow = {
  /** Левый и правый концы трубки под передней губой. */
  tube: readonly [number, number];
  wheels: readonly [Wheel, Wheel];
};

/**
 * Машина hero (DESIGN.md, «Фотографии»): вырезка на прозрачном фоне и слой светодиодов
 * фар того же размера. Готовит scripts/hero-car/cutout.py — он же печатает это поле.
 */
export type HeroCar = {
  /** Пути от public/: «/hero/m3/car.webp». */
  src: string;
  lights: string;
  /** Карта объёма: глубина и её наклоны, три серые панели в кадр машины. Без неё
   *  машина статичная. */
  depth?: string;
  width: number;
  height: number;
  /** Левая и правая фары: по ним встаёт и растягивается ореол. */
  headlights: readonly [Headlight, Headlight];
  /** Видимость ореола фар, от 0 до 1. Без поля — 0,85, под белые светодиоды; рядом с
   *  цветными ходовыми огнями (жёлтые, как у BMW CS) белое пятно с ними спорит. Задаётся
   *  руками: cutout.py его не печатает — после новой вырезки вернуть. */
  halo?: number;
  /** Неон под машиной, нарисованный кодом. Без него — неон пола на CSS. */
  underglow?: Underglow;
};

/**
 * Знак студии перед надписью логотипа (DESIGN.md, «Знак студии»): SVG на прозрачном фоне
 * в public/logo/, путь от public/ и размер из его viewBox. Надпись остаётся текстом —
 * буквы внутри знака в шапке не прочесть.
 */
export type LogoMark = { src: string; width: number; height: number };

/**
 * Четыре цвета темы; производные выводятся из них в app/globals.css. Спектр — отдельно:
 * необязательный свет неона пола, не производная от четырёх.
 */
export type Theme = {
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  /**
   * Спектр неона пола — от 2 до 8 цветов слева направо (DESIGN.md, «Спектр неона»): у
   * студии, чей бренд — переход цветов, а не один. Только свет: текст, кнопки и
   * свечения остаются цвета accent.
   */
  spectrum?: readonly [string, string, ...string[]];
};

export type Studio = {
  /** Полное название: «©», заголовок вкладки. */
  name: string;
  /** Логотип надписью, прописными. */
  logo: string;
  /** Знак перед надписью; нет — логотип только надписью, иконка вкладки — его буквой. */
  logoMark?: LogoMark;
  /** Подпись под логотипом в hero, разрядкой: «Detailing». */
  logoCaption?: string;
  /** «Studio detailingu» — подпись под логотипом в подвале. */
  tagline: Text;
  meta: { title: Text; description: Text };
  /**
   * Открыт ли сайт для поиска. Шаблон и демо — false: в поиске не должно быть
   * десятка одинаковых сайтов. true — только у запущенного сайта клиента.
   */
  indexed: boolean;
  /**
   * Адрес сайта клиента на основном домене: «https://www.studio.pl». От него считаются
   * canonical и hreflang. Без него — домен продакшена проекта на Vercel: демо его хватает,
   * а у клиента с www Vercel взял бы голый домен, который сам перенаправляет на www.
   */
  url?: string;
  /**
   * Языки, на которых готовы тексты студии: на них ведут переключатель и hreflang.
   * Остальные закрыты от поиска; с одним языком переключателя нет.
   */
  languages: readonly ["pl"] | readonly ["pl", "ru"];
  theme: Theme;
  /** Международный формат без пробелов: +48123456789. */
  phone: string;
  messengers: Messenger[];
  /**
   * routeUrl — маршрут в Google Maps для кнопки «Trasa» и нажатия на карту; нет ссылки —
   * нет кнопки, карта не нажимается.
   * photo — вход в студию, 4:5, в контактах; нет фото — контакты без него.
   * map — карта на странице Kontakt; нет карты — страница без неё.
   */
  address: { street: string; area: string; routeUrl?: string; photo?: Photo; map?: StudioMap };
  hours: WeekHours;
  hero: { title: Text; subtitle: Text; lead: Text; car: HeroCar };
  carClasses: Record<CarClass, Text>;
  services: ServiceGroup[];
  /**
   * Строка под прайсом главной: как студия считает цену — когда называет окончательную
   * у «od», что с XL. Условия у каждой студии свои, поэтому в данных, а не в словаре.
   */
  priceNote: Text;
  /** url — страница отзывов в Google; нет ссылки — строка рейтинга открывает плашку демо. */
  rating: { value: number; count: number; url?: string };
  reviews: Review[];
  /** Страница O nas. Нет поля — нет страницы, и навигация на неё не ведёт. */
  about?: About;
};
