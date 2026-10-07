import { PhoneIcon } from "@/components/icons";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { telHref } from "@/lib/contact";
import { formatPhone } from "@/lib/format";

/** Главная кнопка звонка: 56 px, кайма и свечение акцента, номер приглушён. */
export function CallButton({ dict, className = "" }: { dict: Dictionary; className?: string }) {
  return (
    <a
      href={telHref(studio.phone)}
      className={`glow-call flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-accent-border bg-accent-fill font-medium whitespace-nowrap transition-colors hover:bg-accent-hover ${className}`}
    >
      <PhoneIcon size={18} />
      {dict.call.label}
      <span className="text-fg-dim">· {formatPhone(studio.phone)}</span>
    </a>
  );
}
