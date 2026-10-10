import type { ServiceGroup, Text } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";

/** Якоря секций главной: на них ведут навигация и плавающая «Zadzwoń». */
export const sectionIds = {
  hero: "top",
  /** Прайс. Сюда ведут ссылки из Instagram и Maps студии — не переименовывать. */
  services: "cennik",
  reviews: "opinie",
  contact: "kontakt",
  /** Кнопка звонка в контактах: когда она на экране, плавающая «Zadzwoń» прячется. */
  contactCall: "kontakt-zadzwon",
} as const;

/** Якоря страницы группы. */
export const groupSectionIds = {
  faq: "faq",
  /** Кнопка звонка карточки «Nie wiesz…»: когда она на экране, плавающая «Zadzwoń» прячется. */
  adviceCall: "nie-wiesz-zadzwon",
} as const;

/*
 * Навигация ведёт только на готовое. Страница появилась — её пункт добавляется сюда
 * и в словари. Прайс живёт на главной, отдельной страницы у него нет (решение
 * 10.10.2026), — «Usługi» ведёт к его блоку.
 */
export const servicesPath = `/#${sectionIds.services}`;

export const contactPagePath = "/kontakt";

export const studioPages: readonly { key: keyof Dictionary["nav"]; path: string }[] = [
  { key: "contact", path: contactPagePath },
];

/** Страницы групп лежат под этим адресом: `/uslugi/lakier`. */
export const groupPagesPath = "/uslugi";

export type GroupWithPage = ServiceGroup & { intro: Text };

/**
 * Страница есть у группы с вводным абзацем в данных. Что у такой группы заполнено и
 * остальное для страницы — состав и длительность каждой услуги, — проверяет
 * content/studio.test.ts.
 */
export function hasGroupPage(group: ServiceGroup): group is GroupWithPage {
  return group.intro !== undefined;
}

export function groupPagePath(slug: string): string {
  return `${groupPagesPath}/${slug}`;
}

/** Группа ведёт на свою страницу, а пока её нет — к своему месту в прайсе на главной. */
export function groupPath(group: ServiceGroup): string {
  return hasGroupPage(group) ? groupPagePath(group.slug) : `/#${group.slug}`;
}
