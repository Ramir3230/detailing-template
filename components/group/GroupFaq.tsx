import { PageHeading } from "@/components/group/PageHeading";
import { ChevronIcon } from "@/components/icons";
import type { Dictionary } from "@/dictionaries/types";
import { glue } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";
import { groupSectionIds, type GroupWithPage } from "@/lib/nav";
import { classPriced } from "@/lib/price-list";

/*
 * Частые вопросы аккордеоном на <details>: ответы лежат в HTML — их видит поиск и находит
 * поиск по странице браузера, — открываются без JS и с клавиатуры. Первый открыт, как на
 * холсте; раскрытие без анимации, пока владелец не скажет иначе. Якорь — под шапку и
 * липкий переключатель, а без цены по классу переключателя нет — только под шапку.
 */
export function GroupFaq({ group, lang, dict }: { group: GroupWithPage; lang: Lang; dict: Dictionary }) {
  if (!group.faq?.length) return null;

  return (
    <section
      id={groupSectionIds.faq}
      className={`${classPriced([group]) ? "scroll-mt-36" : "scroll-mt-20"} pt-12 lg:scroll-mt-6`}
    >
      <PageHeading>{dict.group.faq}</PageHeading>
      <div className="mt-3 border-b border-line lg:mt-4">
        {group.faq.map(({ question, answer }, i) => (
          <details key={question.pl} open={i === 0} className="group border-t border-line">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 leading-item font-medium lg:min-h-16 lg:py-4 lg:text-17 [&::-webkit-details-marker]:hidden">
              {glue(t(question, lang), lang)}
              <span className="rotate-90 text-muted group-open:-rotate-90">
                <ChevronIcon size={16} />
              </span>
            </summary>
            <p className="pb-4 leading-long text-muted lg:max-w-170 lg:pb-5">{glue(t(answer, lang), lang)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
