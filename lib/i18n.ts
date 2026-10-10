import type { Text } from "@/content/types";

/** Польский основной и живёт без префикса, русский — на `/ru/…`. */
export const langs = ["pl", "ru"] as const;
export type Lang = (typeof langs)[number];
export const defaultLang: Lang = "pl";

export function isLang(value: string): value is Lang {
  return (langs as readonly string[]).includes(value);
}

/** Текст студии на языке страницы; пока русского нет — польский. */
export function t(text: Text, lang: Lang): string {
  return (lang === "ru" && text.ru) || text.pl;
}

/** Подстановка в строку словаря: «do {time}» + { time: "22:00" } → «do 22:00». */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** Адрес страницы на языке: `/#kontakt` → `/ru#kontakt`, `/kontakt` → `/ru/kontakt`. */
export function localePath(lang: Lang, path: string): string {
  if (lang === defaultLang) return path;
  const hashAt = path.indexOf("#");
  const pathname = hashAt === -1 ? path : path.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : path.slice(hashAt);
  return `/${lang}${pathname === "/" ? "" : pathname}${hash}`;
}

/** Обратное к localePath для адреса из браузера: `/ru/kontakt` → `/kontakt`. */
export function stripLang(pathname: string): string {
  for (const lang of langs) {
    if (pathname === `/${lang}`) return "/";
    if (pathname.startsWith(`/${lang}/`)) return pathname.slice(lang.length + 1);
  }
  return pathname;
}
