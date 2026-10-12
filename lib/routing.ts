import { defaultLang, langs, type Lang } from "@/lib/i18n";
import { aboutPagePath, contactPagePath, groupPagesPath } from "@/lib/nav";

/**
 * Первые сегменты адресов, у которых в app/[lang] есть страницы: «kontakt», «o-nas»,
 * «uslugi». Новая папка страницы — сюда, иначе её адрес уйдёт в 404; за этим следит
 * lib/routing.test.ts.
 */
export const pageSegments: readonly string[] = [contactPagePath, aboutPagePath, groupPagesPath].map((path) =>
  path.slice(1),
);

/** Адрес собранной страницы 404 под языком: его собирает app/[lang]/[...missing]. */
export const notFoundSegment = "404";

/** Собранная страница 404 на языке: `/pl/404`. */
export function notFoundPath(lang: Lang): string {
  return `/${lang}/${notFoundSegment}`;
}

export type ProxyAction = { kind: "redirect" | "rewrite"; pathname: string } | { kind: "next" };

/*
 * Что proxy.ts делает с адресом. Польский основной и живёт без префикса: `/` и `/kontakt`
 * внутри отдаются из app/[lang] с lang = pl, а адрес с `/pl` уводится на адрес без
 * префикса — у страницы один адрес. Остальные языки — на своих префиксах.
 *
 * Адрес с незнакомым первым сегментом сразу получает собранную 404: иначе каждый новый
 * адрес сканера (`/wp-admin`, `/stara-strona.php`) рисовался бы по запросу и ложился в
 * кэш отдельной записью. Незнакомое глубже (`/uslugi/nie-ma`) решают сами маршруты.
 */
export function proxyAction(pathname: string): ProxyAction {
  const prefix = `/${defaultLang}`;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    return { kind: "redirect", pathname: pathname.slice(prefix.length) || "/" };
  }

  const lang = langs.find((code) => pathname === `/${code}` || pathname.startsWith(`/${code}/`)) ?? defaultLang;
  const rest = lang === defaultLang ? pathname : pathname.slice(lang.length + 1) || "/";
  const first = rest.split("/")[1];
  if (first && !pageSegments.includes(first)) return { kind: "rewrite", pathname: notFoundPath(lang) };
  if (lang !== defaultLang) return { kind: "next" };
  return { kind: "rewrite", pathname: `${prefix}${rest === "/" ? "" : rest}` };
}
