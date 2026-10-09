import { CallButton } from "@/components/CallButton";
import type { Dictionary } from "@/dictionaries/types";
import { glue } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";
import { groupSectionIds, type GroupWithPage } from "@/lib/nav";

/*
 * «Nie wiesz, którą wybrać?» — звонок в конце страницы группы. Когда его кнопка на
 * экране, плавающая «Zadzwoń» прячется: две кнопки звонка разом не стоят.
 */
export function AdviceCard({ group, lang, dict }: { group: GroupWithPage; lang: Lang; dict: Dictionary }) {
  return (
    <div className="rounded-card border border-line bg-surface p-6 text-center lg:rounded-card-lg">
      <h2 className="text-17 leading-item font-medium">{glue(dict.group.adviceTitle, lang)}</h2>
      {group.advice && <p className="mt-2 text-15 text-balance text-muted">{glue(t(group.advice, lang), lang)}</p>}
      <CallButton dict={dict} id={groupSectionIds.adviceCall} className="mt-5" />
    </div>
  );
}
