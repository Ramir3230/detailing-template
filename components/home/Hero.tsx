import { ArrowDownIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { HeroCar, HeroStage } from "@/components/home/HeroStage";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { t, type Lang } from "@/lib/i18n";
import { sectionIds } from "@/lib/nav";

type Props = { lang: Lang; dict: Dictionary };

/* Текст проявляется снизу сразу при загрузке, не дожидаясь машины */
const rise = "animate-[hero-rise_0.4s_var(--ease-warm)_both]";

/*
 * Hero главной (DESIGN.md, «Hero и шапка»). Телефон: на высоту экрана, без навигации —
 * логотип, заголовок, машина, «Sprawdź cenę»; свободная высота делится поровну над и
 * под средней группой. Ниже 600 px высотой всё сжимается, чтобы hero влез целиком.
 */
export function Hero({ lang, dict }: Props) {
  return (
    <HeroStage
      id={sectionIds.hero}
      className="relative flex min-h-svh flex-col justify-between overflow-hidden px-6 pt-10 pb-6 short:pt-6 short:pb-4"
    >
      {/* Логотип — погашенная неоновая трубка; загорается последним в сцене зажигания */}
      <div className="text-center">
        <div className="grid text-30 short:text-24">
          <Logo unlit className="col-start-1 row-start-1" />
          <span aria-hidden="true" className="ignite-logo col-start-1 row-start-1">
            <Logo />
          </span>
        </div>
        {studio.logoCaption && (
          // Слева поле на ширину разрядки: она висит и справа от последней буквы
          <p className="mt-1 pl-(--tracking-wordmark) text-11 tracking-wordmark text-muted uppercase">
            {studio.logoCaption}
          </p>
        )}
      </div>

      <div className="mt-5">
        <div className={`text-center ${rise}`}>
          <h1 className="display text-24 leading-hero tracking-display whitespace-pre-line short:text-22">
            {t(studio.hero.title, lang)}
          </h1>
          <p className="mt-3 text-muted">{t(studio.hero.subtitle, lang)}</p>
        </div>
        {/* Во всю ширину секции: 92% и 80% — от экрана, а не от колонки с полями */}
        <div className="-mx-6 mt-8">
          <HeroCar car={studio.hero.car} className="mx-auto w-[92%] short:w-[80%]" />
        </div>
      </div>

      <a
        href={`#${sectionIds.services}`}
        className="relative z-10 mx-auto mt-5 inline-flex animate-[hero-rise_0.4s_var(--ease-warm)_0.15s_both] items-center gap-2 py-3 font-medium after:absolute after:inset-x-0 after:bottom-2 after:h-px after:bg-accent"
      >
        {dict.hero.checkPrice}
        <ArrowDownIcon size={16} />
      </a>
    </HeroStage>
  );
}
