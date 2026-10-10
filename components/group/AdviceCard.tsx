import { CallCard } from "@/components/CallCard";
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
    <CallCard
      title={glue(dict.group.adviceTitle, lang)}
      text={group.advice && glue(t(group.advice, lang), lang)}
      dict={dict}
      place={place}
      callId={callId}
    />
  );
}
