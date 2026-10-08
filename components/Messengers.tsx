import { messengerIcons } from "@/components/icons";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { messengerHref } from "@/lib/contact";

const variants = {
  /** Меню на весь экран: пилюли во всю ширину. */
  menu: {
    list: "grid auto-cols-fr grid-flow-col gap-2",
    link: "flex min-h-12 items-center justify-center gap-2 rounded-full border border-line-strong text-13 font-medium transition-colors hover:border-accent-border",
  },
  /** Контакты: на телефоне плитки с иконкой над подписью, на десктопе пилюли. */
  contact: {
    list: "grid auto-cols-fr grid-flow-col gap-3 lg:flex lg:flex-wrap",
    link: "flex min-h-16 flex-col items-center justify-center gap-1 rounded-tile border border-line-strong text-13 font-medium transition-colors hover:border-accent-border lg:min-h-12 lg:flex-row lg:gap-2 lg:rounded-full lg:px-5 lg:text-15",
  },
};

export function Messengers({
  dict,
  variant,
  className = "",
}: {
  dict: Dictionary;
  variant: keyof typeof variants;
  className?: string;
}) {
  if (!studio.messengers.length) return null;
  const style = variants[variant];

  return (
    <ul className={`${style.list} ${className}`}>
      {studio.messengers.map((messenger) => {
        const MessengerIcon = messengerIcons[messenger.kind];
        return (
          <li key={messenger.kind}>
            <a
              href={messengerHref(messenger)}
              target="_blank"
              rel="noopener noreferrer"
              className={style.link}
            >
              <MessengerIcon size={16} />
              {dict.messengers[messenger.kind]}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
