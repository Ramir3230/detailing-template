import type { Showcase } from "@/content/types";

/*
 * Полоса образца (DESIGN.md, «Полоса образца»): видна, когда на <html> стоит data-showcase
 * с языком портфолио, откуда пришёл посетитель. Ставит его markShowcase — встроенным
 * скриптом в <head> до первой отрисовки, — а ссылку возврата переводит на этот язык
 * pointReturn, встроенным скриптом сразу после неё. Обе функции уходят в страницу как
 * текст (toString), поэтому самодостаточны: ни импортов, ни констант модуля — имена
 * атрибута, параметра и ключа хранилища записаны в них прямо. Что собранный скрипт
 * работает сам по себе, держит checks/built-pages.test.ts: он исполняет его из HTML.
 */

/** Окно, с которым работает markShowcase: настоящее в браузере, поддельное в тестах. */
export type ShowcaseWindow = Pick<Window, "location" | "history" | "sessionStorage" | "document">;

/** id ссылки возврата: по нему её находит pointReturn. */
export const returnLinkId = "showcase-return";

/** Адрес конца кейса на языке портфолио: «https://ramirslawecki.com/uk/projects/detailing-studio#contact-finale». */
export function returnHref({ site, path, anchor }: Showcase, lang: string): string {
  return `${site}/${lang}${path}#${anchor}`;
}

/** Адреса возврата на каждом языке портфолио. */
export function returnHrefs(showcase: Showcase): Record<string, string> {
  return Object.fromEntries(showcase.langs.map((lang) => [lang, returnHref(showcase, lang)]));
}

/*
 * Отметка образца: `?from=<язык портфолио>` в адресе. Есть и годится — запоминается в
 * хранилище вкладки и уходит из адреса без шага в истории. Хранилище закрыто — остаётся в
 * адресе: полоса есть на этой странице. Нет отметки или значение чужое — берётся
 * запомненная раньше в этой вкладке. Отметка есть — data-showcase на <html>.
 */
export function markShowcase(win: ShowcaseWindow, langs: readonly string[]): void {
  const url = new URL(win.location.href);
  const from = url.searchParams.get("from");
  let mark = from !== null && langs.indexOf(from) !== -1 ? from : null;
  if (mark !== null) {
    try {
      win.sessionStorage.setItem("showcase", mark);
      url.searchParams.delete("from");
      win.history.replaceState(win.history.state, "", url.pathname + url.search + url.hash);
    } catch {
      // Хранилище вкладки закрыто: отметка остаётся в адресе
    }
  } else {
    try {
      const stored = win.sessionStorage.getItem("showcase");
      if (stored !== null && langs.indexOf(stored) !== -1) mark = stored;
    } catch {
      // Хранилище вкладки закрыто: запомненной отметки нет
    }
  }
  if (mark !== null) win.document.documentElement.setAttribute("data-showcase", mark);
}

/* Ссылка возврата ведёт в кейс на языке отметки; без отметки её не видно и она не нужна */
export function pointReturn(doc: Pick<Document, "documentElement" | "getElementById">, hrefs: Record<string, string>): void {
  const mark = doc.documentElement.getAttribute("data-showcase");
  const link = doc.getElementById("showcase-return");
  if (link && mark !== null && Object.prototype.hasOwnProperty.call(hrefs, mark)) {
    link.setAttribute("href", hrefs[mark]);
  }
}

/* Значение внутри <script>: «</script>» в строке закрыл бы его раньше времени */
const scriptJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

/** Встроенный скрипт для <head>: отметка до первой отрисовки. */
export function markScript(showcase: Showcase): string {
  return `(${markShowcase.toString()})(window,${scriptJson(showcase.langs)})`;
}

/** Встроенный скрипт сразу после ссылки возврата. */
export function returnScript(showcase: Showcase): string {
  return `(${pointReturn.toString()})(document,${scriptJson(returnHrefs(showcase))})`;
}

/** Высота полосы в пикселях: 0, пока её нет (--strip-h, app/globals.css). */
export function stripHeight(): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--strip-h")) || 0;
}
