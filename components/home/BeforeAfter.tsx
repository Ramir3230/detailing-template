import { ComparePairs } from "@/components/ComparePairs";
import { SectionTitle } from "@/components/home/SectionTitle";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { comparePairs, compareWords, homePairServices } from "@/lib/compare";
import { glue } from "@/lib/format";
import type { Lang } from "@/lib/i18n";

/*
 * До/после сразу после цен (BRIEF.md): сначала «сколько», потом «а вдруг плохо». По паре
 * от группы в порядке прайса; ни у одной нет — секции нет.
 */
export function BeforeAfter({ lang, dict }: { lang: Lang; dict: Dictionary }) {
  const words = dict.beforeAfter;
  const pairs = comparePairs(homePairServices(studio.services), lang, dict);
  if (!pairs.length) return null;

  return (
    <section className="py-14 lg:border-t lg:border-line lg:py-24">
      <div className="wrap">
        <ComparePairs
          heading={
            <>
              <SectionTitle>{words.title}</SectionTitle>
              <p className="mt-3 text-center text-muted lg:hidden">{glue(words.hint, lang)}</p>
              <p className="mt-3 hidden text-muted lg:block">{glue(words.hintLong, lang)}</p>
            </>
          }
          pairs={pairs}
          words={compareWords(dict)}
        />
      </div>
    </section>
  );
}
