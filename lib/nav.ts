import type { ServiceGroup } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";

/** Якоря секций главной: на них ведут навигация и плавающая «Zadzwoń». */
export const sectionIds = {
  hero: "top",
  services: "uslugi",
  reviews: "opinie",
  contact: "kontakt",
  /** Часы, звонок и мессенджеры в контактах: у них прячется плавающая «Zadzwoń». */
  contactCall: "kontakt-zadzwon",
} as const;

/*
 * Навигация ведёт только на готовое. Страница появилась — её пункт добавляется сюда
 * и в словари. Пока прайс и контакты живут на главной, пункты ведут к её блокам.
 */
export const servicesPath = `/#${sectionIds.services}`;

export const studioPages: readonly { key: keyof Dictionary["nav"]; path: string }[] = [
  { key: "contact", path: `/#${sectionIds.contact}` },
];

/** Страниц групп ещё нет (блок 4) — группа ведёт к своему месту в прайсе на главной. */
export function groupPath(group: ServiceGroup): string {
  return `/#${group.slug}`;
}
