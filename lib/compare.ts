import type { ComparePair, ComparePhoto } from "@/components/ComparePairs";
import type { Photo, Service } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";
import { glue, startingPriceParts } from "@/lib/format";
import { fill, t, type Lang } from "@/lib/i18n";

/**
 * Пары до/после — у услуг в их порядке, на языке страницы, под парой услуга с ценой
 * «od …». Главная берёт услуги всего прайса, страница группы — свои.
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
