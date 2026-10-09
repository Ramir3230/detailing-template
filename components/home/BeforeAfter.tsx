import { ComparePairs, type ComparePair, type ComparePhoto } from "@/components/home/ComparePairs";
import { SectionTitle } from "@/components/home/SectionTitle";
import { studio } from "@/content/studio";
import type { Photo } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";
import { glue, startingPriceParts } from "@/lib/format";
import { fill, t, type Lang } from "@/lib/i18n";

/*
 * До/после сразу после цен (BRIEF.md): сначала «сколько», потом «а вдруг плохо». Пары
 * берутся у услуг в порядке прайса; ни у одной нет — секции нет.
 */
export function BeforeAfter({ lang, dict }: { lang: Lang; dict: Dictionary }) {
  const words = dict.beforeAfter;
  const photo = ({ src, width, height, alt }: Photo): ComparePhoto => ({
    src,
    width,
    height,
    alt: t(alt, lang),
  });
  const pairs: ComparePair[] = studio.services.flatMap((group) =>
    group.services.flatMap((service) => {
      const { beforeAfter } = service;
      if (!beforeAfter) return [];
      const name = t(service.name, lang);
      return [
        {
          label: t(beforeAfter.label, lang),
          service: glue(name, lang),
          brand: service.brand,
          price: startingPriceParts(service.price, dict.price),
          compare: fill(words.compare, { service: name }),
          examples: beforeAfter.before.ai || beforeAfter.after.ai,
          before: photo(beforeAfter.before),
          after: photo(beforeAfter.after),
        },
      ];
    }),
  );
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
          words={{
            before: words.before,
            after: words.after,
            pairs: words.pairs,
            examples: words.examples,
          }}
        />
      </div>
    </section>
  );
}
