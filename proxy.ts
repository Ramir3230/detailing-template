import { NextResponse, type NextRequest } from "next/server";
import { defaultLang, langs } from "@/lib/i18n";

/*
 * Польский основной и живёт без префикса: `/` и `/cennik` внутри отдаются из
 * app/[lang] с lang = pl. Адрес с `/pl` уводим на адрес без префикса, чтобы у
 * страницы был один адрес. Остальные языки — на своих префиксах, как есть.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const prefix = `/${defaultLang}`;

  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(prefix.length) || "/";
    return NextResponse.redirect(url, 308);
  }

  const prefixed = langs.some((lang) => pathname === `/${lang}` || pathname.startsWith(`/${lang}/`));
  if (prefixed) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `${prefix}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  /* Всё, кроме служебных путей Next и Vercel, маршрутов в корне app/ вне [lang]
     (/icon без расширения, будущие api/ и apple-icon) и файлов с расширением:
     robots.txt, фото. Новый маршрут в корне app/ — добавить сюда, иначе он
     перепишется в /pl/… и отдаст 404. */
  matcher: ["/((?!_next/|_vercel/|api/|icon$|apple-icon$|.*\\..*).*)"],
};
