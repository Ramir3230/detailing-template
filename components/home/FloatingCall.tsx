"use client";

import { PhoneIcon } from "@/components/icons";
import { sectionIds } from "@/lib/nav";
import { useHeroInView, useInView } from "@/lib/use-in-view";

type Props = { href: string; label: string; phone: string };

/*
 * Плавающая «Zadzwoń» (DESIGN.md): видна только между hero и контактами — у обоих свои
 * кнопки звонка. Появляется в один момент с шапкой: обе следят за hero одним хуком.
 * Контакты считаются на экране, когда их часы и звонок дошли до верхних 60% экрана: по
 * верху секции плавающая пряталась бы, пока своя кнопка ещё под фото входа, за экраном.
 * Внешний слой выезжает и прячется (уход быстрее появления), внутренний загорается
 * ударом неона — так анимации не спорят за прозрачность.
 */
export function FloatingCall({ href, label, phone }: Props) {
  const heroVisible = useHeroInView();
  const contactVisible = useInView(sectionIds.contactCall, {
    initial: false,
    rootMargin: "0px 0px -40% 0px",
  });

  const shown = !heroVisible && !contactVisible;

  return (
    <a
      href={href}
      inert={!shown}
      data-shown={shown ? "" : undefined}
      className="group invisible fixed right-4 bottom-4 z-30 translate-y-3 opacity-0 transition-[opacity,translate,visibility] duration-200 ease-in data-shown:visible data-shown:translate-y-0 data-shown:opacity-100 data-shown:transition-[translate] data-shown:duration-[600ms] data-shown:ease-warm lg:right-8 lg:bottom-8"
    >
      <span className="glass-float glow-call flex h-12 items-center gap-2 rounded-full border border-accent-border px-5 text-15 font-medium transition-colors group-data-shown:animate-[neon-strike_0.6s_linear_both] hover:bg-accent-hover">
        <PhoneIcon size={18} />
        {label}
        <span className="text-fg-dim max-lg:sr-only">
          <span aria-hidden="true">· </span>
          {phone}
        </span>
      </span>
    </a>
  );
}
