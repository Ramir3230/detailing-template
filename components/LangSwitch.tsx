"use client";

import { usePathname } from "next/navigation";
import type { Dictionary } from "@/dictionaries/types";
import { localePath, stripLang, type Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  /** Языки, на которых готовы тексты студии: на неготовый переключатель не ведёт. */
  langs: readonly Lang[];
  words: Dictionary["language"];
};

/** «PL · RU»: текущий язык текстом, остальные — ссылками на ту же страницу. */
export function LangSwitch({ lang, langs, words }: Props) {
  // На сервере путь приходит с /pl после внутренней перезаписи, в браузере — без него.
  const path = stripLang(usePathname());

  return (
    <nav aria-label={words.label} className="flex items-center gap-2">
      {langs.map((code, index) => (
        <span key={code} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">·</span>}
          {code === lang ? (
            <span aria-current="true" className="font-medium text-fg">
              {words.names[code]}
            </span>
          ) : (
            <a
              href={localePath(code, path)}
              lang={code}
              hrefLang={code}
              className="-m-3 inline-grid min-h-11 min-w-11 place-items-center transition-colors hover:text-fg"
            >
              {words.names[code]}
            </a>
          )}
        </span>
      ))}
    </nav>
  );
}
