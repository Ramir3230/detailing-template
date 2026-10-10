import { CallButton } from "@/components/CallButton";
import type { Dictionary } from "@/dictionaries/types";

type Props = {
  title: string;
  text?: string;
  dict: Dictionary;
  /** В конце страницы — по центру; в липкой колонке страницы группы на десктопе — слева. */
  place: "end" | "aside";
  /** id кнопки звонка: по нему прячется плавающая «Zadzwoń». */
  callId?: string;
  className?: string;
};

/* Карточка со звонком: «Nie wiesz, którą wybrać?» на странице группы, конец O nas. */
export function CallCard({ title, text, dict, place, callId, className = "" }: Props) {
  return (
    <div
      className={`rounded-card border border-line bg-surface p-6 lg:rounded-card-lg ${place === "end" ? "text-center" : ""} ${className}`}
    >
      <h2 className="text-17 leading-item font-medium">{title}</h2>
      {text && <p className="mt-2 text-15 text-balance text-muted">{text}</p>}
      {/* В колонке 300 px номер прижимает кнопку к краям — там, как на холсте, без номера */}
      <CallButton dict={dict} id={callId} withPhone={place === "end"} className="mt-5" />
    </div>
  );
}
