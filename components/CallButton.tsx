import { PhoneIcon } from "@/components/icons";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { telHref } from "@/lib/contact";
import { formatPhone } from "@/lib/format";

/** Вид главной кнопки: 56 px, кайма и свечение акцента. Им же — «Sprawdź cenę» на десктопе. */
export const mainButton =
  "glow-call h-14 items-center justify-center gap-2 rounded-full border border-accent-border bg-accent-fill font-medium whitespace-nowrap transition-colors hover:bg-accent-hover";

/** Главная кнопка звонка, номер приглушён. */
export function CallButton({ dict, className = "" }: { dict: Dictionary; className?: string }) {
  return (
    <a href={telHref(studio.phone)} className={`${mainButton} flex w-full ${className}`}>
      <PhoneIcon size={18} />
      {dict.call.label}
      <span className="text-fg-dim">
        <span aria-hidden="true">· </span>
        {formatPhone(studio.phone)}
      </span>
    </a>
  );
}
