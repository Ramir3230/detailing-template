"use client";

import { useState, type ReactNode } from "react";
import { ClassSwitch, useCarClass } from "@/components/ClassSwitch";
import { PhoneIcon } from "@/components/icons";
import type { CarClass } from "@/content/types";
import type { PriceParts } from "@/lib/format";
import { splitAmount, stripPositions, stripSymbols } from "@/lib/odometer";
import type { PriceGroup, PriceRow } from "@/lib/price-list";

/* Передача «встаёт» через 0,26 с после выбора — тогда меняются цены и описание. */
const engageMs = 260;

/* Переходы включаются, только когда класс выбрал человек: подстройка под
   сохранённый класс после загрузки проходит без анимации. */
const fadeAfterEngage =
  "[[data-animate]_&]:transition-opacity [[data-animate]_&]:duration-200 [[data-animate]_&]:delay-[260ms] [[data-animate]_&]:ease-warm";

type Props = {
  /** Заголовок и подсказка секции — рисует сервер. */
  heading: ReactNode;
  groups: PriceGroup[];
  descriptions: Record<CarClass, string>;
  words: { classLabel: string; individualQuote: string; call: string };
  telHref: string;
};

/*
 * Прайс главной: в строке одна цена для выбранного класса. Телефон — переключатель
 * липнет под шапкой (64 px), пока на экране прайс. Десктоп (от 1024) — переключатель
 * в липкой боковой колонке слева, список справа. На телефоне колонка «растворяется»
 * (display: contents), чтобы липкий блок жил в границах всей секции.
 */
export function PriceList({ heading, groups, descriptions, words, telHref }: Props) {
  const selected = useCarClass();
  const [animate, setAnimate] = useState(false);
  // Номер строки во всём прайсе: счётчики трогаются лёгкой волной сверху вниз.
  const firstRow = groups.map((_, i) =>
    groups.slice(0, i).reduce((count, group) => count + group.rows.length, 0),
  );

  return (
    <div
      data-animate={animate ? "" : undefined}
      className="wrap lg:flex lg:flex-wrap lg:items-start lg:gap-x-20 lg:gap-y-12"
    >
      <div className="contents lg:sticky lg:top-6 lg:block lg:max-w-95 lg:flex-[1_1_300px]">
        {heading}
        <div className="sticky top-16 z-10 -mx-6 mt-4 bg-bg px-6 py-2 lg:static lg:mx-0 lg:mt-6 lg:bg-transparent lg:p-0">
          <ClassSwitch label={words.classLabel} onPick={() => setAnimate(true)} />
          {selected === "XL" && (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-badge border border-accent-badge pr-3 pl-4">
              <p className="text-14">{words.individualQuote}</p>
              <a
                href={telHref}
                className="inline-flex min-h-11 items-center gap-2 font-medium text-accent"
              >
                <PhoneIcon size={16} />
                {words.call}
              </a>
            </div>
          )}
        </div>
        <p
          aria-live="polite"
          className="mt-2 min-h-[2.9em] text-center text-14 leading-note text-muted lg:mt-3 lg:text-left"
        >
          <span
            key={selected}
            className="block [[data-animate]_&]:animate-[fade-rise_0.22s_cubic-bezier(0.65,0,0.35,1)_0.26s_both]"
          >
            {descriptions[selected]}
          </span>
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-7 lg:mt-0 lg:min-w-0 lg:flex-[999_1_560px] lg:gap-10">
        {groups.map((group, groupIndex) => (
          <div
            key={group.slug}
            id={group.slug}
            // под шапку и липкий переключатель, при XL — ещё под плашку
            className={`${selected === "XL" ? "scroll-mt-50" : "scroll-mt-36"} lg:scroll-mt-6`}
          >
            <h3 className="caps-label pb-2">{group.name}</h3>
            <ul>
              {group.rows.map((row, rowIndex) => (
                <li
                  key={row.name}
                  className="flex min-h-14 items-start gap-4 border-t border-line py-4 lg:gap-6"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-15 leading-item font-medium lg:text-16">
                      {row.name}
                      {row.brand && <span className="text-accent"> {row.brand}</span>}
                    </span>
                    {row.note && (
                      <span className="text-13 leading-note text-muted lg:text-14">{row.note}</span>
                    )}
                  </div>
                  {isByClass(row) ? (
                    <RollingPrice
                      prices={row.prices}
                      selected={selected}
                      order={firstRow[groupIndex] + rowIndex}
                    />
                  ) : (
                    <Price parts={row.prices[selected]} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Price({ parts }: { parts: PriceParts }) {
  if (parts.kind === "individual") {
    return (
      <span className="shrink-0 text-14 leading-heading text-muted lg:text-15">{parts.text}</span>
    );
  }
  return (
    <span className="shrink-0 text-16 leading-heading font-medium whitespace-nowrap tabular-nums lg:text-17">
      {parts.prefix && <span className="font-normal text-muted">{parts.prefix}</span>}
      {parts.amount}
    </span>
  );
}

/** Цена по классу: S, M и L — числа без «od», XL — «indywidualnie». */
function isByClass(row: PriceRow): boolean {
  return (
    row.prices.XL.kind === "individual" &&
    (["S", "M", "L"] as const).every((carClass) => {
      const parts = row.prices[carClass];
      return parts.kind === "amount" && !parts.prefix;
    })
  );
}

/*
 * Цена-счётчик: цифры прокручиваются к новой цене, когда передача встала, правая —
 * первой. При XL цифры стоят на цене L и гаснут, проявляется «indywidualnie». Глазу
 * видны ленты, диктор слышит только текущую цену.
 */
function RollingPrice({
  prices,
  selected,
  order,
}: {
  prices: Record<CarClass, PriceParts>;
  selected: CarClass;
  order: number;
}) {
  const numbers = (["S", "M", "L"] as const).map((carClass) => {
    const parts = prices[carClass];
    return splitAmount(parts.kind === "amount" ? parts.amount : "");
  });
  const width = Math.max(...numbers.map(({ number }) => number.length));
  const parts = prices[selected];
  const individual = parts.kind === "individual";
  const shown = parts.kind === "amount" ? splitAmount(parts.amount) : numbers[2];
  const individualText = prices.XL.kind === "individual" ? prices.XL.text : "";

  return (
    <span className="grid shrink-0 justify-items-end text-16 leading-heading font-medium whitespace-nowrap tabular-nums lg:text-17">
      <span
        aria-hidden="true"
        className={`col-start-1 row-start-1 inline-flex ${fadeAfterEngage} ${individual ? "opacity-0" : ""}`}
      >
        {stripPositions(shown.number, width).map((position, i) => (
          <span key={i} className="inline-block h-[1lh] overflow-hidden">
            <span
              className="block [[data-animate]_&]:transition-transform [[data-animate]_&]:duration-[420ms] [[data-animate]_&]:ease-warm"
              style={{
                transform: `translateY(calc(${-position} * 1lh))`,
                transitionDelay: `${engageMs + (width - 1 - i) * 35 + order * 12}ms`,
              }}
            >
              {stripSymbols.map((symbol, s) => (
                <span key={s} className="block h-[1lh] text-center">
                  {symbol}
                </span>
              ))}
            </span>
          </span>
        ))}
        {shown.suffix}
      </span>
      <span
        aria-hidden="true"
        className={`col-start-1 row-start-1 text-14 font-normal text-muted lg:text-15 ${fadeAfterEngage} ${individual ? "" : "opacity-0"}`}
      >
        {individualText}
      </span>
      <span className="sr-only">{parts.kind === "amount" ? parts.amount : parts.text}</span>
    </span>
  );
}
