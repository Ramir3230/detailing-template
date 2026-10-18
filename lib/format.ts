import type { CarClass, Duration, Price, Service } from "@/content/types";
import type { Dictionary, PluralForms } from "@/dictionaries/types";
import { fill, type Lang } from "@/lib/i18n";
import { rimAmounts, type RimPrice } from "@/lib/rims";

/** Неразрывный пробел: между числом и «zł», после «od», после однобуквенных слов. */
export const NBSP = "\u00A0";

const locales: Record<Lang, string> = { pl: "pl-PL", ru: "ru-RU" };

/*
 * Числа — по польской норме на обоих языках: валюта польская, и «1000 zł» не должно
 * превращаться в «1 000 zł» на русской странице. pl-PL не делит четырёхзначные числа,
 * а пробел разрядов в разных движках ICU бывает разным, поэтому приводим его к NBSP.
 */
const numberFormat = new Intl.NumberFormat("pl-PL");
const ratingFormat = new Intl.NumberFormat("pl-PL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function plNumber(value: number): string {
  return numberFormat.format(value).replace(/\s/g, NBSP);
}

/** 1000 → «1000 zł», 15000 → «15 000 zł». */
export function formatAmount(amount: number, words: Dictionary["price"]): string {
  return `${plNumber(amount)}${NBSP}${words.currency}`;
}

/** Цена на экране: «od» отдельно, потому что выводится приглушённым. */
export type PriceParts =
  | { kind: "amount"; prefix?: string; amount: string }
  | { kind: "individual"; text: string };

export function priceParts(
  price: Price,
  carClass: CarClass,
  words: Dictionary["price"],
): PriceParts {
  switch (price.kind) {
    case "byClass":
      return carClass === "XL"
        ? { kind: "individual", text: words.individual }
        : { kind: "amount", amount: formatAmount(price[carClass], words) };
    case "fixed":
      return { kind: "amount", amount: formatAmount(price.amount, words) };
    case "from":
      return {
        kind: "amount",
        prefix: `${words.from}${NBSP}`,
        amount: formatAmount(price.amount, words),
      };
    case "individual":
      return { kind: "individual", text: words.individual };
    // Размер диска выбирает переключатель прайса главной: без него — «od» самой низкой
    case "byRim":
      return priceParts({ kind: "from", amount: lowestRim(price) }, carClass, words);
  }
}

const lowestRim = (price: RimPrice) => Math.min(...rimAmounts(price).map(({ amount }) => amount));

/**
 * Цена услуги без выбранного класса — под парой до/после: у цены по классу «od» самой
 * низкой из классов, у цены по диску — самой низкой из размеров. Остальные виды от
 * класса не зависят.
 */
export function startingPriceParts(price: Price, words: Dictionary["price"]): PriceParts {
  const shown: Price =
    price.kind === "byClass" ? { kind: "from", amount: Math.min(price.S, price.M, price.L) } : price;
  return priceParts(shown, "S", words);
}

/** Самая низкая цена в группе — для «od …» в меню. Нет ни одной с числом — null. */
export function lowestAmount(services: readonly Service[]): number | null {
  const amounts = services.flatMap(({ price }) => {
    switch (price.kind) {
      case "byClass":
        return [Math.min(price.S, price.M, price.L)];
      case "fixed":
      case "from":
        return [price.amount];
      case "byRim":
        return [lowestRim(price)];
      case "individual":
        return [];
    }
  });
  return amounts.length ? Math.min(...amounts) : null;
}

/** «od 200 zł» одной строкой. */
export function formatFrom(amount: number, words: Dictionary["price"]): string {
  return `${words.from}${NBSP}${formatAmount(amount, words)}`;
}

/** «1 dzień», «3–4 dni», «1,5 godziny»; форма слова — по большему числу. */
export function formatDuration(
  duration: Duration,
  lang: Lang,
  units: Dictionary["units"],
): string {
  const format = new Intl.NumberFormat(locales[lang]);
  const count = duration.max ?? duration.min;
  const range =
    duration.max === undefined
      ? format.format(duration.min)
      : `${format.format(duration.min)}–${format.format(duration.max)}`;
  return `${range}${NBSP}${pluralForm(units[duration.unit], count, lang)}`;
}

/** «24 opinie», «5 opinii», «21 отзыв». */
export function formatCount(count: number, forms: PluralForms, lang: Lang): string {
  return `${plNumber(count)}${NBSP}${pluralForm(forms, count, lang)}`;
}

/** «24 opinie w Google»: строка рейтинга в отзывах и в hero. */
export function formatReviewsInGoogle(count: number, words: Dictionary["reviews"], lang: Lang): string {
  return glue(fill(words.inGoogle, { count: formatCount(count, words.count, lang) }), lang);
}

function pluralForm(forms: PluralForms, count: number, lang: Lang): string {
  const category = new Intl.PluralRules(locales[lang]).select(count);
  return category in forms ? forms[category as keyof PluralForms] : forms.other;
}

/** «10:00–22:00». */
export function formatTimeRange(hours: { open: string; close: string }): string {
  return `${hours.open}–${hours.close}`;
}

/**
 * Дни строки часов (0 — понедельник), второй день — строчными. Короткие названия
 * слитно: «Pn–pt»; полные через пробелы: «Poniedziałek – piątek».
 */
export function formatDayRange(
  from: number,
  to: number,
  days: Dictionary["days"]["short" | "long"],
  lang: Lang,
  dash: "–" | " – " = "–",
): string {
  return from === to ? days[from] : `${days[from]}${dash}${days[to].toLocaleLowerCase(lang)}`;
}

/** 5 → «5,0». */
export function formatRating(value: number): string {
  return ratingFormat.format(value);
}

/** +48123456789 → «+48 123 456 789». Чужой формат номера остаётся как есть. */
export function formatPhone(phone: string): string {
  const pl = /^\+48(\d{3})(\d{3})(\d{3})$/.exec(phone);
  return pl ? ["+48", pl[1], pl[2], pl[3]].join(NBSP) : phone;
}

/* Однобуквенные предлоги и союзы не должны висеть в конце строки. */
const shortWords: Record<Lang, RegExp> = {
  pl: /(?<=^|[\s(„"«])([aiouwz]) +/giu,
  ru: /(?<=^|[\s(„"«])([авиксоуя]) +/giu,
};

/** «Mycie i szyby» → «Mycie i\u00A0szyby». */
export function glue(text: string, lang: Lang): string {
  return text.replace(shortWords[lang], `$1${NBSP}`);
}
