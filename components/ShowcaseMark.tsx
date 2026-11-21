"use client";

import { useLayoutEffect } from "react";
import { markShowcase, pointReturn } from "@/lib/showcase";

type Props = { langs: readonly string[]; hrefs: Record<string, string> };

/*
 * Отметку образца ставят встроенные скрипты (lib/showcase.ts), и в собранном сайте при
 * обычном открытии здесь делать нечего. Этот слой — для случаев, когда их некому было
 * исполнить или React снял отметку: в разработке Strict Mode при повторном монтировании
 * сбрасывает атрибуты <html> до своих (Next, «Preventing Flash»), а страницу 404 Next
 * рисует в браузере по данным, и скрипты в ней не исполняются. До отрисовки, как и они.
 */
export function ShowcaseMark({ langs, hrefs }: Props) {
  useLayoutEffect(() => {
    if (!document.documentElement.hasAttribute("data-showcase")) markShowcase(window, langs);
    pointReturn(document, hrefs);
  }, [langs, hrefs]);

  return null;
}
