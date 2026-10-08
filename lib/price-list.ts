import type { CarClass, ServiceGroup } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";
import { carClasses } from "@/lib/car-class";
import { glue, priceParts, type PriceParts } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";

export type PriceRow = {
  name: string;
  brand?: string;
  note?: string;
  prices: Record<CarClass, PriceParts>;
};

export type PriceGroup = { slug: string; name: string; rows: PriceRow[] };

/*
 * Прайс для переключателя в браузере: тексты уже на языке страницы, цены всех четырёх
 * классов уже отформатированы. Браузер только выбирает класс, форматирование остаётся
 * в lib/format.ts.
 */
export function priceList(
  groups: readonly ServiceGroup[],
  lang: Lang,
  words: Dictionary["price"],
): PriceGroup[] {
  return groups.map((group) => ({
    slug: group.slug,
    name: glue(t(group.name, lang), lang),
    rows: group.services.map((service) => ({
      name: glue(t(service.name, lang), lang),
      brand: service.brand,
      note: service.note && glue(t(service.note, lang), lang),
      prices: Object.fromEntries(
        carClasses.map((carClass) => [carClass, priceParts(service.price, carClass, words)]),
      ) as Record<CarClass, PriceParts>,
    })),
  }));
}
