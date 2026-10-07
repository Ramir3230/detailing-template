import { pl } from "@/dictionaries/pl";
import { ru } from "@/dictionaries/ru";
import type { Dictionary } from "@/dictionaries/types";
import type { Lang } from "@/lib/i18n";

const dictionaries: Record<Lang, Dictionary> = { pl, ru };

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}
