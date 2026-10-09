import { CallButton } from "@/components/CallButton";
import type { Dictionary } from "@/dictionaries/types";
import { glue } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";
import type { GroupWithPage } from "@/lib/nav";

type Props = {
  group: GroupWithPage;
  lang: Lang;
  dict: Dictionary;
  /** На телефоне карточка в конце страницы, по центру; на десктопе — в липкой колонке, слева. */
  place: "end" | "aside";
  /** id кнопки звонка: по нему прячется плавающая «Zadzwoń». */
  callId?: string;
};

/* «Nie wiesz, którą wybrać?» — звонок, когда не понятно, какую услугу брать. */
export function AdviceCard({ group, lang, dict, place, callId }: Props) {
  return (
    <div
      className={`rounded-card border border-line bg-surface p-6 lg:rounded-card-lg ${place === "end" ? "text-center" : ""}`}
    >
      <h2 className="text-17 leading-item font-medium">{glue(dict.group.adviceTitle, lang)}</h2>
      {group.advice && <p className="mt-2 text-15 text-balance text-muted">{glue(t(group.advice, lang), lang)}</p>}
      {/* В колонке 300 px номер прижимает кнопку к краям — там, как на холсте, без номера */}
      <CallButton dict={dict} id={callId} withPhone={place === "end"} className="mt-5" />
    </div>
  );
}
