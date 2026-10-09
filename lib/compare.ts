import type { Photo, Service, ServiceGroup } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";
import { glue, startingPriceParts, type PriceParts } from "@/lib/format";
import { fill, t, type Lang } from "@/lib/i18n";

/** Вкладок пар не больше четырёх: на 375 px они делят ширину поровну (DESIGN.md, «До/после»). */
export const maxPairs = 4;

/**
 * Услуги, чьи пары показывает главная: первая пара каждой группы в порядке прайса, не
 * больше maxPairs. Остальные пары группы — только на её странице.
 */
export function homePairServices(groups: readonly ServiceGroup[]): Service[] {
  return groups
    .flatMap((group) => group.services.find((service) => service.beforeAfter) ?? [])
    .slice(0, maxPairs);
}

type ComparePhoto = { src: string; width: number; height: number; alt: string };

export type ComparePair = {
  label: string;
  service: string;
  brand?: string;
  price: PriceParts;
  /** Подпись ползунка для диктора и клавиатуры. */
  compare: string;
  /** Хоть один кадр пары сделан ИИ — под парой «Zdjęcia przykładowe». */
  examples: boolean;
  before: ComparePhoto;
  after: ComparePhoto;
};

/**
 * Пары до/после — у услуг в их порядке, на языке страницы, под парой услуга с ценой
 * «od …». Главная берёт homePairServices, страница группы — свои услуги.
 */
export function comparePairs(services: readonly Service[], lang: Lang, dict: Dictionary): ComparePair[] {
  const photo = ({ src, width, height, alt }: Photo): ComparePhoto => ({ src, width, height, alt: t(alt, lang) });
  return services.flatMap((service) => {
    const { beforeAfter } = service;
    if (!beforeAfter) return [];
    const name = t(service.name, lang);
    return [
      {
        label: t(beforeAfter.label, lang),
        service: glue(name, lang),
        brand: service.brand,
        price: startingPriceParts(service.price, dict.price),
        compare: fill(dict.beforeAfter.compare, { service: name }),
        examples: beforeAfter.before.ai || beforeAfter.after.ai,
        before: photo(beforeAfter.before),
        after: photo(beforeAfter.after),
      },
    ];
  });
}

/** Подписи шторки и вкладок из словаря. */
export function compareWords(dict: Dictionary) {
  const { before, after, pairs, examples } = dict.beforeAfter;
  return { before, after, pairs, examples };
}
