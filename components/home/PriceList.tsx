"use client";

import type { ReactNode } from "react";
import { ClassSwitch, useCarClass } from "@/components/ClassSwitch";
import { PhoneIcon } from "@/components/icons";
import type { CarClass } from "@/content/types";
import type { PriceParts } from "@/lib/format";
import type { PriceGroup } from "@/lib/price-list";

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

  return (
    <div className="wrap lg:flex lg:flex-wrap lg:items-start lg:gap-x-20 lg:gap-y-12">
      <div className="contents lg:sticky lg:top-6 lg:block lg:max-w-95 lg:flex-[1_1_300px]">
        {heading}
        <div className="sticky top-16 z-10 -mx-6 mt-4 bg-bg px-6 py-2 lg:static lg:mx-0 lg:mt-6 lg:bg-transparent lg:p-0">
          <ClassSwitch label={words.classLabel} />
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
          {descriptions[selected]}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-7 lg:mt-0 lg:min-w-0 lg:flex-[999_1_560px] lg:gap-10">
        {groups.map((group) => (
          <div
            key={group.slug}
            id={group.slug}
            // под шапку и липкий переключатель, при XL — ещё под плашку
            className={`${selected === "XL" ? "scroll-mt-50" : "scroll-mt-36"} lg:scroll-mt-6`}
          >
            <h3 className="caps-label pb-2">{group.name}</h3>
            <ul>
              {group.rows.map((row) => (
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
                  <Price parts={row.prices[selected]} />
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
