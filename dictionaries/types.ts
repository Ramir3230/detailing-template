import type { Messenger } from "@/content/types";
import type { Lang } from "@/lib/i18n";

/** Формы слова для Intl.PluralRules: у польского и русского их четыре. */
export type PluralForms = { one: string; few: string; many: string; other: string };

/** С понедельника по воскресенье. */
type Week = readonly [string, string, string, string, string, string, string];

/**
 * Все строки интерфейса. Тип требует каждый ключ в каждом языке: перевод, которого
 * нет, ломает typecheck, а не всплывает пустым местом на странице.
 * Подстановки — `{time}`, `{day}`.
 */
export type Dictionary = {
  header: { openMenu: string; closeMenu: string; mainNav: string };
  /** Только готовые страницы: пункт появляется вместе со страницей. */
  nav: { services: string; contact: string };
  menu: { services: string; studio: string };
  call: { label: string };
  /** orCall — «lub zadzwoń:» перед номером на десктопе. */
  hero: { checkPrice: string; orCall: string };
  messengers: Record<Messenger["kind"], string>;
  status: {
    open: string;
    closed: string;
    until: string;
    opensToday: string;
    opensTomorrow: string;
    opensOn: string;
  };
  days: {
    /** Для часов в подвале: «Pn–pt». */
    short: Week;
    /** Для часов в контактах: «Poniedziałek – piątek». */
    long: Week;
    /** Для «otwieramy w poniedziałek». */
    on: Week;
  };
  hours: { title: string; closed: string; today: string };
  price: { from: string; individual: string; currency: string };
  units: { hour: PluralForms; day: PluralForms };
  prices: {
    title: string;
    /** Подсказка под заголовком на телефоне. */
    pick: string;
    /** Она же длиннее — в боковой колонке десктопа. */
    pickLong: string;
    classLabel: string;
    individualQuote: string;
  };
  reviews: {
    title: string;
    carousel: string;
    /** Подставляется {value}. */
    stars: string;
    /** «24 opinie» — форма слова по числу. */
    count: PluralForms;
    /** Подставляется {count}: «24 opinie w Google». */
    inGoogle: string;
    /** Плашка вместо ссылки, пока у студии нет страницы отзывов в Google. */
    demoNote: string;
    close: string;
    previous: string;
    next: string;
    pause: string;
    resume: string;
    /** Подставляются {n} и {total}. */
    position: string;
    example: string;
    google: string;
  };
  beforeAfter: {
    title: string;
    /** Подсказка под заголовком на телефоне. */
    hint: string;
    /** Она же длиннее — на десктопе, где шторку двигают и стрелками. */
    hintLong: string;
    /** Метки на кадрах. */
    before: string;
    after: string;
    /** Вкладки пар — для диктора. */
    pairs: string;
    /** Подставляется {service}: ползунок шторки для диктора и клавиатуры. */
    compare: string;
    /** Подпись под парами, где хоть один кадр сделан ИИ. */
    examples: string;
  };
  /** photoExample — подпись под фото входа, сделанным ИИ. */
  contact: { title: string; route: string; photoExample: string };
  group: {
    /** Подставляются {group} и {studio}: заголовок вкладки страницы группы. */
    metaTitle: string;
    /** Хлебные крошки — для диктора. */
    breadcrumbs: string;
    /** Ссылка над группой в прайсе главной — на страницу группы. */
    whatsIncluded: string;
    /** Метка над составом услуги в карточке. */
    scope: string;
    /** Заголовок частых вопросов. */
    faq: string;
    /** Карточка со звонком в конце страницы группы. */
    adviceTitle: string;
  };
  /** Подсказка диктору у ссылок, которые открываются в новой вкладке. */
  newTab: string;
  footer: { services: string; studio: string };
  language: { label: string; names: Record<Lang, string> };
};
