import type { ServiceGroup } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";

/*
 * Навигация ведёт только на готовое. Страница появилась — её пункт добавляется сюда
 * и в словари. Пока прайс и контакты живут на главной, пункты ведут к её блокам.
 */
export const servicesPath = "/#uslugi";

export const studioPages: readonly { key: keyof Dictionary["nav"]; path: string }[] = [
  { key: "contact", path: "/#kontakt" },
];

/** Страниц групп ещё нет (блок 4) — группа ведёт к своему месту в прайсе на главной. */
export function groupPath(group: ServiceGroup): string {
  return `/#${group.slug}`;
}
