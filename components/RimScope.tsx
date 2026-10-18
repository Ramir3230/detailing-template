"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { usePicked } from "@/components/ClassScope";
import { GearSwitch } from "@/components/GearSwitch";
import { RimPrice } from "@/components/Price";
import type { RimSize } from "@/content/types";
import type { RimRow } from "@/lib/price-list";
import { defaultRim, rimFraction } from "@/lib/rims";

/*
 * Размер диска группы с шиномонтажом (DESIGN.md, «Прайс»): переключатель над её списком
 * выбирает размер, строки с ценой по диску показывают цену за колесо и комплект. Выбор —
 * у группы, между страницами не помнится: переключатель один, на главной.
 */
const RimContext = createContext({ at: 0, select: (() => {}) as (index: number) => void });

export function RimScope({ sizes, children }: { sizes: readonly RimSize[]; children: ReactNode }) {
  const [at, setAt] = useState(() => defaultRim(sizes.length));
  return <RimContext value={{ at, select: setAt }}>{children}</RimContext>;
}

/* Переходы колеса — когда размер выбрал человек и передача встала, как ленты цен */
const turn =
  "[[data-animate]_&]:transition-transform [[data-animate]_&]:duration-[420ms] [[data-animate]_&]:delay-(--engage) [[data-animate]_&]:ease-warm";

/*
 * Колесо, нарисованное линией: шина одна, обод растёт с диском, а профиль тоньше. При
 * смене размера колесо катится на пол-спицы за размер. Спицы и обод — в одной группе,
 * которая масштабируется; толщину линий масштаб не трогает.
 */
function Wheel({ sizes, at }: { sizes: readonly RimSize[]; at: number }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-12 shrink-0">
      <circle cx="24" cy="24" r="23" className="fill-line stroke-line-strong" strokeWidth="1" />
      <g
        className={turn}
        style={{
          transform: `rotate(${at * 36}deg) scale(${rimFraction(sizes[at], sizes)})`,
          transformOrigin: "24px 24px",
        }}
      >
        <circle
          cx="24"
          cy="24"
          r="23"
          className="fill-bg stroke-accent"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {[0, 72, 144, 216, 288].map((angle) => (
          <line
            key={angle}
            x1="24"
            y1="18"
            x2="24"
            y2="2.5"
            transform={`rotate(${angle} 24 24)`}
            className="stroke-muted"
            strokeWidth="1.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      <circle cx="24" cy="24" r="2.5" className="fill-accent" />
    </svg>
  );
}

/** Колесо и кнопки размеров — над списком группы. */
export function RimPicker({ sizes, label }: { sizes: readonly RimSize[]; label: string }) {
  const { at, select } = use(RimContext);
  const picked = usePicked();
  return (
    <div className="flex items-center gap-3 pb-3">
      <Wheel sizes={sizes} at={at} />
      <GearSwitch
        label={label}
        options={sizes}
        index={at}
        onSelect={(index) => {
          picked();
          select(index);
        }}
        // На десктопе — шириной с переключатель классов в боковой колонке, а не во весь список
        className="min-w-0 flex-1 lg:max-w-95"
      />
    </div>
  );
}

/** Цена за колесо на выбранном размере — справа в строке. */
export function RimRowPrice({ rim, order }: { rim: RimRow; order: number }) {
  const { at } = use(RimContext);
  return <RimPrice rim={rim} at={at} order={order} />;
}

/**
 * «Za koło · komplet 4 szt.: 180 zł» — под названием; проявляется, когда передача встала.
 * Объявляется диктору при смене размера, как описание класса.
 */
export function RimSet({ rim }: { rim: RimRow }) {
  const { at } = use(RimContext);
  return (
    <span aria-live="polite" className="text-13 leading-note text-muted lg:text-14">
      <span
        key={at}
        className="block [[data-animate]_&]:animate-[fade-rise_0.22s_var(--ease-warm)_var(--engage)_both]"
      >
        {rim.sets[at]}
      </span>
    </span>
  );
}
