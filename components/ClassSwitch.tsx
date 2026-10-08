"use client";

import { useRef, useSyncExternalStore, type KeyboardEvent } from "react";
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

/**
 * Переключатель S/M/L/XL — радиогруппа: в порядке Tab одна кнопка, стрелки, Home и End
 * переключают класс и переносят фокус.
 */
export function ClassSwitch({ label }: { label: string }) {
  const selected = useCarClass();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = keySteps[event.key];
    if (!step) return;
    event.preventDefault();
    const index = (step(carClasses.indexOf(selected)) + carClasses.length) % carClasses.length;
    saveCarClass(carClasses[index]);
    buttons.current[index]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="grid grid-cols-4 gap-1 rounded-switch border border-line p-1"
    >
      {carClasses.map((carClass, index) => (
        <button
          key={carClass}
          ref={(button) => {
            buttons.current[index] = button;
          }}
          type="button"
          role="radio"
          aria-checked={carClass === selected}
          tabIndex={carClass === selected ? 0 : -1}
          onClick={() => saveCarClass(carClass)}
          className="display min-h-11 rounded-switch-item border border-transparent text-14 tracking-display text-muted transition-colors hover:text-fg aria-checked:border-accent aria-checked:bg-accent-selected aria-checked:text-fg"
        >
          {carClass}
        </button>
      ))}
    </div>
  );
}
