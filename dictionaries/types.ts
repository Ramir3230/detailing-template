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
    /** Для строк часов: «Pn–pt». */
    short: Week;
    /** Для «otwieramy w poniedziałek». */
    on: Week;
  };
  hours: { title: string; closed: string };
  price: { from: string; individual: string; currency: string };
  units: { hour: PluralForms; day: PluralForms };
  footer: { services: string; studio: string };
  language: { label: string; names: Record<Lang, string> };
};
