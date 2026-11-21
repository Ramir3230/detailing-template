import { Inter } from "next/font/google";
import { InlineScript } from "@/components/InlineScript";
import { ShowcaseMark } from "@/components/ShowcaseMark";
import type { Showcase } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";
import { returnHref, returnHrefs, returnLinkId, returnScript } from "@/lib/showcase";

/* Шрифт полосы — портфолио, а не студии (DESIGN.md, «Типографика»). Без предзагрузки:
   файл браузер качает, только когда полоса показана, — у остальных посетителей его нет.
   subsets у next/font значат только предзагрузку, поэтому не заданы: все наборы знаков
   объявлены по unicode-range, и браузер берёт те, что есть в тексте полосы */
const inter = Inter({
  weight: "600",
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

type Props = { showcase: Showcase; dict: Dictionary };

/*
 * Полоса образца (DESIGN.md, «Полоса образца») — у верхнего края окна, над шапкой и всем
 * остальным, первая в порядке Tab. В разметке лежит всегда, а видна только с data-showcase
 * на <html>: его ставит встроенный скрипт в <head> до первой отрисовки (lib/showcase.ts),
 * поэтому полоса есть с первого кадра и страница сразу стоит под ней. Без атрибута —
 * display: none: ни глазу, ни клавиатуре, ни диктору. Ссылка уходит из сервера на первый
 * язык портфолио, на язык отметки её переводит скрипт сразу за ней — до гидрации; React
 * оставляет его адрес (suppressHydrationWarning).
 */
export function ShowcaseStrip({ showcase, dict }: Props) {
  return (
    <section
      aria-labelledby="showcase-label"
      className={`${inter.variable} sticky top-0 z-40 hidden h-strip items-center justify-between gap-3 border-b border-strip-line bg-strip px-4 font-strip font-semibold in-data-showcase:flex lg:px-14`}
    >
      <p
        id="showcase-label"
        className="flex min-w-0 items-center gap-2 text-11 leading-item tracking-strip text-strip-text uppercase"
      >
        <span aria-hidden="true" className="size-1.5 shrink-0 bg-strip-accent" />
        <span className="truncate">{dict.showcase.label}</span>
      </p>
      <a
        id={returnLinkId}
        href={returnHref(showcase, showcase.langs[0])}
        suppressHydrationWarning
        className="inline-grid h-11 shrink-0 place-items-center bg-strip-plate px-4 text-14 whitespace-nowrap text-strip-on-plate shadow-strip-plate transition-[background-color,scale] hover:bg-strip-accent focus-visible:outline-strip-accent active:scale-97"
      >
        <span>
          {dict.showcase.back} <span aria-hidden="true">→</span>
        </span>
      </a>
      <InlineScript html={returnScript(showcase)} />
      <ShowcaseMark langs={showcase.langs} hrefs={returnHrefs(showcase)} />
    </section>
  );
}
