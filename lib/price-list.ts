import type { CarClass, Price, ServiceGroup, Text } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";
import { carClasses } from "@/lib/car-class";
import { formatDuration, glue, priceParts, type PriceParts } from "@/lib/format";
import { localePath, t, type Lang } from "@/lib/i18n";
import { groupPagePath, hasGroupPage } from "@/lib/nav";
import { rollColumns, splitAmount, type RollColumn } from "@/lib/odometer";

/** Цена по классу лентами счётчика: колонки и позиции лент для S, M и L. */
export type Rolling = {
  columns: RollColumn[];
  positions: Record<"S" | "M" | "L", number[]>;
  suffix: string;
};

export type PriceRow = {
  name: string;
  brand?: string;
  note?: string;
  /** «2–3 godziny»: одна для всех классов. */
  duration?: string;
  prices: Record<CarClass, PriceParts>;
  /** Есть только у цены по классу, которую можно показать лентами. */
  rolling?: Rolling;
};

export type PriceGroup = {
  slug: string;
  name: string;
  /** Адрес страницы группы на языке страницы — если она есть: туда ведёт «Co wchodzi». */
  page?: string;
  rows: PriceRow[];
};

/**
 * Есть ли цена, которая зависит от класса. Нет ни одной — переключатель классов ничего не
 * меняет, и его нет.
 */
export const classPriced = (groups: readonly ServiceGroup[]) =>
  groups.some(({ services }) => services.some(({ price }) => price.kind === "byClass"));

/**
 * Прайс по запросу: ни одной суммы, все цены «indywidualnie». Тогда раздел — список
 * услуг без цен и путь к wycenie (DESIGN.md, «Прайс»).
 */
export const quoteOnly = (groups: readonly ServiceGroup[]) =>
  groups.every(({ services }) => services.every(({ price }) => price.kind === "individual"));

/*
 * Прайс для переключателя в браузере: тексты уже на языке страницы, цены всех четырёх
 * классов и длительность уже отформатированы. Браузер только выбирает класс,
 * форматирование остаётся в lib/format.ts.
 */
export function priceList(
  groups: readonly ServiceGroup[],
  lang: Lang,
  dict: Pick<Dictionary, "price" | "units">,
): PriceGroup[] {
  return groups.map((group) => ({
    slug: group.slug,
    name: glue(t(group.name, lang), lang),
    page: hasGroupPage(group) ? localePath(lang, groupPagePath(group.slug)) : undefined,
    rows: group.services.map((service) => ({
      name: glue(t(service.name, lang), lang),
      brand: service.brand,
      note: service.note && glue(t(service.note, lang), lang),
      duration: service.duration && formatDuration(service.duration, lang, dict.units),
      prices: Object.fromEntries(
        carClasses.map((carClass) => [carClass, priceParts(service.price, carClass, dict.price)]),
      ) as Record<CarClass, PriceParts>,
      rolling: service.price.kind === "byClass" ? rolling(service.price, dict.price) : undefined,
    })),
  }));
}

/** Описания классов под переключателем — на языке страницы, с приклеенными предлогами. */
export function classDescriptions(texts: Record<CarClass, Text>, lang: Lang): Record<CarClass, string> {
  return Object.fromEntries(
    carClasses.map((carClass) => [carClass, glue(t(texts[carClass], lang), lang)]),
  ) as Record<CarClass, string>;
}

function rolling(
  price: Extract<Price, { kind: "byClass" }>,
  words: Dictionary["price"],
): Rolling | undefined {
  const sizes = ["S", "M", "L"] as const;
  const amounts = sizes.map((size) => {
    const parts = priceParts(price, size, words);
    return splitAmount(parts.kind === "amount" ? parts.amount : "");
  });
  const strips = rollColumns(amounts.map(({ number }) => number));
  if (!strips) return undefined;
  return {
    columns: strips.columns,
    positions: { S: strips.positions[0], M: strips.positions[1], L: strips.positions[2] },
    suffix: amounts[0].suffix,
  };
}
