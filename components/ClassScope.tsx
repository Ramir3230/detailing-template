"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { ClassSwitch, useCarClass } from "@/components/ClassSwitch";
import { Price, RollingPrice, type PriceSize } from "@/components/Price";
import type { CarClass } from "@/content/types";
import type { PriceParts } from "@/lib/format";
import type { Rolling } from "@/lib/price-list";

/* Отметка «класс выбрал человек» — от переключателя к рамке, которая включает переходы. */
const PickedContext = createContext<() => void>(() => {});

/** Отметить, что выбор сделал человек: переключатель размера диска включает те же переходы. */
export const usePicked = () => use(PickedContext);

/**
 * Рамка всего, что меняется с классом: прайс главной, переключатель и карточки страницы
 * группы. Переходы цен и описания включаются ([data-animate]), только когда класс выбрал
 * человек: подстройка под сохранённый класс после загрузки проходит без анимации.
 */
export function ClassScope({ className, children }: { className: string; children: ReactNode }) {
  const [animate, setAnimate] = useState(false);

  return (
    <PickedContext value={() => setAnimate(true)}>
      <div data-animate={animate ? "" : undefined} className={`[--engage:260ms] ${className}`}>
        {children}
      </div>
    </PickedContext>
  );
}

type PickerProps = {
  label: string;
  descriptions: Record<CarClass, string>;
  /** Плашка под переключателем при XL — у прайса главной. */
  xlNote?: ReactNode;
  /** Отступ сверху: у каждой страницы свой. */
  className: string;
};

/*
 * Переключатель классов и описание выбранного. Телефон — переключатель липнет под шапкой
 * (64 px); вырез экрана его не касается: страница не заходит под него (без
 * viewport-fit=cover), а шапка липнет выше. Десктоп (от 1024) — в потоке своей колонки,
 * липнет уже она. Описание держит высоту двух строк — список под ним не прыгает.
 */
export function ClassPicker({ label, descriptions, xlNote, className }: PickerProps) {
  const selected = useCarClass();
  const picked = use(PickedContext);

  return (
    <>
      <div
        className={`sticky top-16 z-10 -mx-6 bg-bg px-6 py-2 lg:static lg:mx-0 lg:bg-transparent lg:p-0 ${className}`}
      >
        <ClassSwitch label={label} onPick={picked} />
        {selected === "XL" && xlNote}
      </div>
      <p
        aria-live="polite"
        className="mt-2 min-h-[2.9em] text-center text-14 leading-note text-muted lg:mt-3 lg:text-left"
      >
        <span
          key={selected}
          className="block [[data-animate]_&]:animate-[fade-rise_0.22s_var(--ease-warm)_var(--engage)_both]"
        >
          {descriptions[selected]}
        </span>
      </p>
    </>
  );
}

/** Цена услуги для выбранного класса: лентами счётчика, где цену так можно показать. */
export function ClassPrice({
  prices,
  rolling,
  order,
  size,
}: {
  prices: Record<CarClass, PriceParts>;
  rolling?: Rolling;
  order: number;
  size?: PriceSize;
}) {
  const selected = useCarClass();
  return rolling ? (
    <RollingPrice rolling={rolling} prices={prices} selected={selected} order={order} size={size} />
  ) : (
    <Price parts={prices[selected]} size={size} />
  );
}
