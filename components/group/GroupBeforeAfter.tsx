import { ComparePairs } from "@/components/ComparePairs";
import { PageHeading } from "@/components/group/PageHeading";
import type { Dictionary } from "@/dictionaries/types";
import { comparePairs, compareWords } from "@/lib/compare";
import { glue } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import type { GroupWithPage } from "@/lib/nav";

/*
 * До/после группы — те же пары, что на главной, только услуг этой группы: пара живёт у
 * услуги в данных. Ни у одной услуги группы пары нет — секции нет.
 */
export function GroupBeforeAfter({ group, lang, dict }: { group: GroupWithPage; lang: Lang; dict: Dictionary }) {
  const words = dict.beforeAfter;
  const pairs = comparePairs(group.services, lang, dict);
  if (!pairs.length) return null;

  return (
    // Контейнер для раскладки шторки: кадр и текст рядом, только если колонка достаточно широка
    <section className="@container pt-12">
      <ComparePairs
        layout="column"
        heading={
          <>
            <PageHeading>{words.title}</PageHeading>
            <p className="mt-3 text-muted lg:hidden">{glue(words.hint, lang)}</p>
            <p className="mt-3 hidden text-muted lg:block">{glue(words.hintLong, lang)}</p>
          </>
        }
        pairs={pairs}
        words={compareWords(dict)}
      />
    </section>
  );
}
