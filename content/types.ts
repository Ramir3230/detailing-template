/** Текст студии: польский обязателен, русский появляется с пунктом ROADMAP «Русские тексты». */
export type Text = { pl: string; ru?: string };

export type CarClass = "S" | "M" | "L" | "XL";

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
  | { kind: "individual" };

/** «1 dzień», «3–4 dni», «2 godziny». */
export type Duration = { unit: "hour" | "day"; min: number; max?: number };

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
};

export type Faq = { question: Text; answer: Text };

export type ServiceGroup = {
  /** Часть адреса будущей страницы группы. */
  slug: string;
  name: Text;
  intro?: Text;
  services: Service[];
  faq?: Faq[];
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

/** Номера — в международном формате без пробелов: +48123456789. */
export type Messenger =
  | { kind: "telegram"; username: string }
  | { kind: "telegram"; phone: string }
  | { kind: "whatsapp"; phone: string }
  | { kind: "instagram"; username: string };

export type Review = {
  author: string;
  text: Text;
  /** У выдуманной студии отзывы — примеры и подписаны так на странице. */
  source: "google" | "example";
};

/** Точка в процентах кадра: x слева, y сверху, оба 0–100. */
export type Point = { x: number; y: number };

/**
 * Машина hero (DESIGN.md, «Фотографии»): вырезка на прозрачном фоне и слой светодиодов
 * фар того же размера. Готовит scripts/hero-car/cutout.py — он же печатает это поле.
 */
export type HeroCar = {
  /** Пути от public/: «/hero/car.webp». */
  src: string;
  lights: string;
  width: number;
  height: number;
  /** Центры левой и правой фары: на них встаёт ореол. */
  headlights: readonly [Point, Point];
};

/** Четыре цвета темы; всё остальное выводится из них в app/globals.css. */
export type Theme = { bg: string; fg: string; muted: string; accent: string };

export type Studio = {
  /** Полное название: «©», заголовок вкладки. */
  name: string;
  /** Логотип-заглушка надписью, прописными. */
  logo: string;
  /** «Studio detailingu» — подпись под логотипом в подвале. */
  tagline: Text;
  meta: { title: Text; description: Text };
  /**
   * Открыт ли сайт для поиска. Шаблон и демо — false: в поиске не должно быть
   * десятка одинаковых сайтов. true — только у запущенного сайта клиента.
   */
  indexed: boolean;
  /** Языки, на которых готовы тексты студии. Остальные закрыты от поиска, переключатель скрыт. */
  languages: readonly ["pl"] | readonly ["pl", "ru"];
  theme: Theme;
  /** Международный формат без пробелов: +48123456789. */
  phone: string;
  messengers: Messenger[];
  /** routeUrl — маршрут в Google Maps для кнопки «Trasa»; нет ссылки — нет кнопки. */
  address: { street: string; area: string; routeUrl?: string };
  hours: WeekHours;
  hero: { title: Text; subtitle: Text; lead: Text; car: HeroCar };
  carClasses: Record<CarClass, Text>;
  services: ServiceGroup[];
  /** url — страница отзывов в Google; нет ссылки — строка рейтинга открывает плашку демо. */
  rating: { value: number; count: number; url?: string };
  reviews: Review[];
};
