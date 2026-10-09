import { mainButton } from "@/components/CallButton";
import { ArrowDownIcon, StarIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { OpenStatus } from "@/components/OpenStatus";
import { ScrollLink } from "@/components/ScrollLink";
import { HeroCar, HeroStage } from "@/components/home/HeroStage";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { telHref } from "@/lib/contact";
import { formatPhone, formatRating, formatReviewsInGoogle, glue } from "@/lib/format";
import { fill, t, type Lang } from "@/lib/i18n";
import { sectionIds } from "@/lib/nav";

type Props = { lang: Lang; dict: Dictionary };

/* Текст проявляется снизу сразу при загрузке, не дожидаясь машины; кнопка — позже.
   Отыгравшая сцена (data-ignited) не проявляет его заново при возврате на страницу */
const rise = "animate-[hero-rise_0.4s_var(--ease-warm)_both] in-data-ignited:animate-none";
const riseLater =
  "animate-[hero-rise_0.4s_var(--ease-warm)_0.15s_both] in-data-ignited:animate-none";

/*
 * Hero главной (DESIGN.md, «Hero и шапка»).
 * Телефон: на высоту экрана, без навигации — логотип, заголовок, машина, «Sprawdź cenę»;
 * свободная высота делится поровну над и под средней группой. Ниже 600 px высотой всё
 * сжимается, чтобы hero влез целиком.
 * Десктоп: логотип несёт шапка; текст слева, машина справа на всё оставшееся место.
 * Hero с шапкой — не ниже экрана: шапка (--spacing-header) и линия под ней.
 */
export function Hero({ lang, dict }: Props) {
  const { rating } = studio;

  return (
    <HeroStage id={sectionIds.hero} className="relative clip-x">
      {/* Высота экрана — замороженная при открытии (--hero-h, HeroStage); до гидрации — svh */}
      <div className="flex min-h-[var(--hero-h,100svh)] flex-col justify-between px-6 pt-10 pb-6 short:pt-6 short:pb-4 lg:wrap lg:min-h-[calc(100svh-var(--spacing-header)-1px)] lg:flex-row lg:items-center lg:gap-x-8 lg:py-12">
        {/* Логотип — погашенная неоновая трубка; загорается последним в сцене зажигания.
            Оба слоя — одинаковые элементы одной ячейки сетки: иначе неоновый съезжает */}
        <div className="text-center lg:hidden">
          <div className="grid text-30 short:text-24">
            <Logo unlit className="col-start-1 row-start-1" />
            <Logo aria-hidden="true" className="ignite-logo col-start-1 row-start-1" />
          </div>
          {studio.logoCaption && (
            // Слева поле на ширину разрядки: она висит и справа от последней буквы
            <p className="mt-1 pl-(--tracking-wordmark) text-11 tracking-wordmark text-muted uppercase">
              {studio.logoCaption}
            </p>
          )}
        </div>

        {/* Средняя группа телефона; на десктопе её дети — две колонки */}
        <div className="mt-5 lg:contents">
          <div className="text-center lg:w-95 lg:shrink-0 lg:text-left">
            <div className={rise}>
              <h1 className="display text-24 leading-hero tracking-display whitespace-pre-line short:text-22 lg:text-hero lg:leading-heading">
                {t(studio.hero.title, lang)}
              </h1>
              <p className="mt-3 text-muted lg:hidden">{glue(t(studio.hero.subtitle, lang), lang)}</p>
              <p className="mt-5 hidden text-18 text-muted lg:block">
                {glue(t(studio.hero.lead, lang), lang)}
              </p>
            </div>

            <div className={`hidden lg:block ${riseLater}`}>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
                <ScrollLink target={sectionIds.services} className={`${mainButton} inline-flex px-7`}>
                  {dict.hero.checkPrice}
                  <ArrowDownIcon size={16} />
                </ScrollLink>
                <a href={telHref(studio.phone)} className="py-3 text-15 text-muted transition-colors hover:text-fg">
                  {dict.hero.orCall}{" "}
                  <span className="font-medium whitespace-nowrap text-fg">{formatPhone(studio.phone)}</span>
                </a>
              </div>
              {/* Статус появляется только в браузере: место под строку держим заранее */}
              <div className="mt-10 flex min-h-6 flex-wrap items-center gap-x-7 gap-y-3 text-14 text-muted">
                {studio.reviews.length > 0 && (
                  <ScrollLink
                    target={sectionIds.reviews}
                    className="-my-3 inline-flex items-center gap-1 py-3 transition-colors hover:text-fg"
                  >
                    <span className="text-accent">
                      <StarIcon size={14} />
                    </span>
                    <span className="sr-only">
                      {fill(dict.reviews.stars, { value: formatRating(rating.value) })},{" "}
                    </span>
                    <span aria-hidden="true" className="font-medium text-fg">
                      {formatRating(rating.value)}
                    </span>
                    <span aria-hidden="true">·</span>
                    {formatReviewsInGoogle(rating.count, dict.reviews, lang)}
                  </ScrollLink>
                )}
                <OpenStatus hours={studio.hours} lang={lang} words={dict.status} daysOn={dict.days.on} />
              </div>
            </div>
          </div>

          {/* Телефон: во всю ширину секции — 92% и 80% от экрана, а не от колонки с полями.
              Десктоп: всё место после колонки текста, с заходом на правое поле контейнера;
              за машиной — свет акцента */}
          <div className="-mx-6 mt-8 lg:relative lg:m-0 lg:-mr-8 lg:flex lg:min-w-0 lg:flex-1 lg:justify-end">
            <div
              aria-hidden="true"
              className="glow-hero pointer-events-none absolute -inset-[40%] hidden lg:block"
            />
            <HeroCar
              car={studio.hero.car}
              className="mx-auto w-[92%] short:w-[80%] lg:mx-0 lg:w-full lg:max-w-hero-car"
            />
          </div>
        </div>

        <ScrollLink
          target={sectionIds.services}
          className={`relative z-10 mx-auto mt-5 inline-flex items-center gap-2 py-3 font-medium after:absolute after:inset-x-0 after:bottom-2 after:h-px after:bg-accent lg:hidden ${riseLater}`}
        >
          {dict.hero.checkPrice}
          <ArrowDownIcon size={16} />
        </ScrollLink>
      </div>
    </HeroStage>
  );
}
