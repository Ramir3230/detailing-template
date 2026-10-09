"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ClassPicker, ClassPrice, ClassScope } from "@/components/ClassScope";
import { useCarClass } from "@/components/ClassSwitch";
import { ServiceName } from "@/components/Price";
import { PhoneIcon } from "@/components/icons";
import type { CarClass } from "@/content/types";
import type { PriceGroup } from "@/lib/price-list";

type Props = {
  /** Заголовок и подсказка секции — рисует сервер. */
  heading: ReactNode;
  groups: PriceGroup[];
  descriptions: Record<CarClass, string>;
  words: { classLabel: string; individualQuote: string; call: string; whatsIncluded: string };
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
  // Номер строки во всём прайсе: счётчики трогаются лёгкой волной сверху вниз.
  const firstRow = groups.map((_, i) =>
    groups.slice(0, i).reduce((count, group) => count + group.rows.length, 0),
  );

  return (
    <ClassScope className="wrap lg:flex lg:flex-wrap lg:items-start lg:gap-x-20 lg:gap-y-12">
      <div className="contents lg:sticky lg:top-6 lg:block lg:max-w-95 lg:flex-[1_1_300px]">
        {heading}
        <ClassPicker
          label={words.classLabel}
          descriptions={descriptions}
          className="mt-4 lg:mt-6"
          xlNote={
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
          }
        />
      </div>

      <div className="mt-5 flex flex-col gap-7 lg:mt-0 lg:min-w-0 lg:flex-[999_1_560px] lg:gap-10">
        {groups.map((group, groupIndex) => (
          <div
            key={group.slug}
            id={group.slug}
            // под шапку и липкий переключатель, при XL — ещё под плашку
            className={`${selected === "XL" ? "scroll-mt-50" : "scroll-mt-36"} lg:scroll-mt-6`}
          >
            <div className="flex items-baseline justify-between gap-3 pb-2">
              <h3 className="caps-label">{group.name}</h3>
              {/* Главная отвечает «сколько», страница группы — «что за эти деньги» */}
              {group.page && (
                <Link
                  href={group.page}
                  className="-my-3 inline-flex min-h-11 shrink-0 items-center text-13 whitespace-nowrap text-muted underline decoration-accent underline-offset-4 transition-colors hover:text-fg lg:text-14"
                >
                  {words.whatsIncluded}
                  {/* Диктор в списке ссылок различает четыре «Co wchodzi» по группе */}
                  <span className="sr-only">: {group.name}</span>
                </Link>
              )}
            </div>
            <ul>
              {group.rows.map((row, rowIndex) => (
                <li
                  key={row.name}
                  className="flex min-h-14 items-start gap-4 border-t border-line py-4 lg:gap-6"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <ServiceName name={row.name} brand={row.brand} />
                    {row.note && (
                      <span className="text-13 leading-note text-muted lg:text-14">{row.note}</span>
                    )}
                  </div>
                  <ClassPrice
                    prices={row.prices}
                    rolling={row.rolling}
                    order={firstRow[groupIndex] + rowIndex}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ClassScope>
  );
}
