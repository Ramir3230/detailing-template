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
  hero: { checkPrice: string };
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
  contact: { title: string; route: string };
  /** Подсказка диктору у ссылок, которые открываются в новой вкладке. */
  newTab: string;
  footer: { services: string; studio: string };
  language: { label: string; names: Record<Lang, string> };
};
