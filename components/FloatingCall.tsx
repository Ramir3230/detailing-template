"use client";

import { PhoneIcon } from "@/components/icons";
import { useDesktop } from "@/lib/use-desktop";
import { useHeroInView, useInView } from "@/lib/use-in-view";

type Props = {
  href: string;
  label: string;
  phone: string;
  /** На странице есть hero: кнопка ждёт, пока он уйдёт, — в один момент с шапкой. */
  afterHero: boolean;
  /** id своей кнопки звонка на странице: она на экране — плавающая прячется. */
  hideAt: string;
  /**
   * Только до 1024 px: на десктопе страницы группы карточка со звонком всё время на
   * экране в липкой колонке — плавающая там была бы второй кнопкой звонка.
   */
  phoneOnly?: boolean;
};

/*
 * Плавающая «Zadzwoń» (DESIGN.md): две кнопки звонка разом не стоят. На главной видна
 * между hero и контактами — у обоих свои кнопки; появляется в один момент с шапкой, обе
 * следят за hero одним хуком. На страницах без hero (группа, Kontakt) появляется сразу
 * после загрузки, если своей кнопки звонка нет на экране: до ответа наблюдателя она
 * считается видимой — иначе на высоком экране, где своя кнопка на первом экране,
 * плавающая вспыхивала бы и гасла. Прячется, как только своя кнопка показалась на
 * экране хоть краем: по блоку целиком она пряталась бы раньше, пока своя кнопка ещё
 * ниже. Внешний слой выезжает и прячется (уход быстрее появления), внутренний
 * загорается ударом неона — так анимации не спорят за прозрачность.
 */
export function FloatingCall({ href, label, phone, afterHero, hideAt, phoneOnly = false }: Props) {
  const heroVisible = useHeroInView();
  // Своя кнопка может быть скрыта на одной ширине и видна на другой (карточка «Nie wiesz…»
  // на телефоне — в конце страницы, на десктопе — нет): поворот планшета или сужение
  // окна через 1024 px перезапускает наблюдение
  const desktop = useDesktop();
  const ownCallVisible = useInView(hideAt, { initial: !afterHero, restartOn: desktop ? "desktop" : "phone" });

  const shown = !(afterHero && heroVisible) && !ownCallVisible;

  return (
    <a
      href={href}
      inert={!shown}
      data-shown={shown ? "" : undefined}
      className={`group invisible fixed right-4 bottom-4 z-30 translate-y-3 opacity-0 transition-[opacity,translate,visibility] duration-200 ease-in data-shown:visible data-shown:translate-y-0 data-shown:opacity-100 data-shown:transition-[translate] data-shown:duration-[600ms] data-shown:ease-warm lg:right-wrap lg:bottom-8 ${phoneOnly ? "lg:hidden" : ""}`}
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
