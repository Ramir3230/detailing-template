import type { Metadata } from "next";
import { studio } from "@/content/studio";
import { defaultLang, localePath, type Lang } from "@/lib/i18n";

/*
 * Что видит поиск: открытые языки и адреса страницы на них. Читает данные студии —
 * только для сервера: клиентский импорт утащил бы студию целиком в скрипты страницы.
 */

/** Языки, на которых готовы тексты студии: на них есть переключатель и hreflang. */
export const publishedLangs: readonly Lang[] = studio.languages;

export function isPublished(lang: Lang): boolean {
  return publishedLangs.includes(lang);
}

/**
 * Адрес сайта, от которого считаются canonical и hreflang: в них Google ждёт полный
 * адрес. У клиента — `url` из данных студии, у демо — домен продакшена проекта на Vercel;
 * на превью тоже они: копия не перетягивает поиск на себя. Локально — localhost.
 */
export function siteUrl(): URL {
  if (studio.url) return new URL(studio.url);
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(host ? `https://${host}` : `http://localhost:${process.env.PORT || 3000}`);
}

/**
 * canonical страницы и её адреса на опубликованных языках, x-default — польский.
 * path — адрес без языка: «/», «/kontakt», «/uslugi/lakier».
 */
export function alternates(
  lang: Lang,
  path: string,
  languages: readonly Lang[] = publishedLangs,
): NonNullable<Metadata["alternates"]> {
  const canonical = localePath(lang, path);
  if (languages.length < 2) return { canonical };
  return {
    canonical,
    languages: {
      ...Object.fromEntries(languages.map((code) => [code, localePath(code, path)])),
      "x-default": localePath(defaultLang, path),
    },
  };
}
