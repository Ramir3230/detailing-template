"use client";

import { usePathname } from "next/navigation";
import type { Dictionary } from "@/dictionaries/types";
import { langs, localePath, stripLang, type Lang } from "@/lib/i18n";

/** «PL · RU»: текущий язык текстом, остальные — ссылками на ту же страницу. */
export function LangSwitch({ lang, words }: { lang: Lang; words: Dictionary["language"] }) {
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
