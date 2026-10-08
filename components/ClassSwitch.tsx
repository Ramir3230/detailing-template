"use client";

import { useLayoutEffect, useRef, useSyncExternalStore, type KeyboardEvent } from "react";
import type { CarClass } from "@/content/types";
import {
  carClasses,
  defaultCarClass,
  readCarClass,
  saveCarClass,
  subscribeCarClass,
} from "@/lib/car-class";

/** Выбранный класс авто, общий для всех переключателей. На сервере — класс по умолчанию. */
export function useCarClass(): CarClass {
  return useSyncExternalStore(subscribeCarClass, readCarClass, () => defaultCarClass);
}

const keySteps: Record<string, (index: number) => number> = {
  ArrowRight: (index) => index + 1,
  ArrowDown: (index) => index + 1,
  ArrowLeft: (index) => index - 1,
  ArrowUp: (index) => index - 1,
  Home: () => 0,
  End: () => carClasses.length - 1,
};

/* Рамка стоит под кнопкой класса: четыре равные колонки с зазором 4 px. */
const thumbAt = (index: number) => `translateX(calc(${index} * (100% + 4px)))`;

/*
 * Смена передачи (решение владельца 08.10.2026): рамка, как рычаг, уходит вниз в
 * «нейтраль», вбок и вверх в новую передачу с отдачей; переключатель вздрагивает,
 * рамка коротко вспыхивает. Прерванная смена продолжается с того места, где рамка была.
 */
function shiftGear(
  thumb: HTMLElement,
  glow: HTMLElement,
  group: HTMLElement,
  from: number,
  to: number,
) {
  // Прерванная смена: рычаг продолжает из того положения, где был, со всем наклоном.
  const interrupted = thumb.getAnimations().length > 0;
  const current = getComputedStyle(thumb).transform;
  const startX = interrupted ? `translateX(${new DOMMatrix(current).m41}px)` : thumbAt(from);
  [thumb, glow, group].forEach((element) =>
    element.getAnimations().forEach((animation) => animation.cancel()),
  );
  const end = thumbAt(to);
  thumb.animate(
    [
      {
        transform: interrupted ? current : `${startX} translateY(0) scale(1)`,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
      },
      {
        transform: `${startX} translateY(5px) scale(0.92)`,
        offset: 0.2,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      {
        transform: `${end} translateY(5px) scale(0.92)`,
        offset: 0.65,
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      { transform: `${end} translateY(0) scale(1)` },
    ],
    { duration: 440 },
  );
  group.animate(
    [{ transform: "none" }, { transform: "translateY(1px)" }, { transform: "none" }],
    { duration: 90, delay: 420 },
  );
  glow.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 360, delay: 400 });
}

/**
 * Переключатель S/M/L/XL — радиогруппа: в порядке Tab одна кнопка, стрелки, Home и End
 * переключают класс и переносят фокус. onPick — выбор сделал человек, а не подстройка
 * под сохранённый класс после загрузки: только тогда смена анимируется.
 */
export function ClassSwitch({ label, onPick }: { label: string; onPick?: () => void }) {
  const selected = useCarClass();
  const index = carClasses.indexOf(selected);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const group = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const glow = useRef<HTMLSpanElement>(null);
  const shown = useRef(index);
  const picked = useRef(false);

  // До отрисовки: рамка уже стоит на новом месте в стиле, анимация ведёт её со старого.
  useLayoutEffect(() => {
    const from = shown.current;
    shown.current = index;
    const byUser = picked.current;
    picked.current = false;
    if (!byUser || from === index) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (thumb.current && glow.current && group.current) {
      shiftGear(thumb.current, glow.current, group.current, from, index);
    }
  }, [index]);

  function pick(carClass: CarClass) {
    if (carClass === selected) return;
    picked.current = true;
    onPick?.();
    saveCarClass(carClass);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = keySteps[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (step(index) + carClasses.length) % carClasses.length;
    pick(carClasses[next]);
    buttons.current[next]?.focus();
  }

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="relative grid grid-cols-4 gap-1 rounded-switch border border-line p-1"
    >
      <span
        ref={thumb}
        aria-hidden="true"
        className="pointer-events-none absolute top-1 left-1 h-11 w-[calc((100%-20px)/4)] rounded-switch-item border border-accent bg-accent-selected"
        style={{ transform: thumbAt(index) }}
      >
        <span ref={glow} className="glow-call absolute inset-0 rounded-[inherit] opacity-0" />
      </span>
      {carClasses.map((carClass, i) => (
        <button
          key={carClass}
          ref={(button) => {
            buttons.current[i] = button;
          }}
          type="button"
          role="radio"
          aria-checked={carClass === selected}
          tabIndex={carClass === selected ? 0 : -1}
          onClick={() => pick(carClass)}
          className="display relative min-h-11 rounded-switch-item text-14 tracking-display text-muted transition-colors hover:text-fg aria-checked:text-fg"
        >
          {carClass}
        </button>
      ))}
    </div>
  );
}
