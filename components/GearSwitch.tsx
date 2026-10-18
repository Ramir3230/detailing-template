"use client";

import { useLayoutEffect, useRef, type KeyboardEvent } from "react";

const keySteps: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (index) => index + 1,
  ArrowDown: (index) => index + 1,
  ArrowLeft: (index) => index - 1,
  ArrowUp: (index) => index - 1,
  Home: () => 0,
  End: (_, count) => count - 1,
};

/* Рамка стоит под выбранной кнопкой: равные колонки с зазором 4 px. */
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
 * Переключатель «коробка передач» — радиогруппа равных кнопок: в порядке Tab одна кнопка,
 * стрелки, Home и End переключают и переносят фокус. Классы авто и размеры диска.
 * onSelect — выбор сделал человек: только тогда смена анимируется, подстройка под
 * сохранённый выбор после загрузки проходит без неё.
 */
export function GearSwitch({
  label,
  options,
  index,
  onSelect,
  className = "",
}: {
  label: string;
  options: readonly string[];
  index: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const group = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const glow = useRef<HTMLSpanElement>(null);
  const shown = useRef(index);
  const picked = useRef(false);
  const count = options.length;

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

  function pick(next: number) {
    if (next === index) return;
    picked.current = true;
    onSelect(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = keySteps[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (step(index, count) + count) % count;
    pick(next);
    buttons.current[next]?.focus();
  }

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`relative grid gap-1 rounded-switch border border-line p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {/* Ширина рамки — колонка: поля 2 × 4 px и зазоры по 4 px между кнопками */}
      <span
        ref={thumb}
        aria-hidden="true"
        className="pointer-events-none absolute top-1 left-1 h-11 rounded-switch-item border border-accent bg-accent-selected"
        style={{ width: `calc((100% - ${4 * count + 4}px) / ${count})`, transform: thumbAt(index) }}
      >
        <span ref={glow} className="glow-call absolute inset-0 rounded-[inherit] opacity-0" />
      </span>
      {options.map((option, i) => (
        <button
          key={option}
          ref={(button) => {
            buttons.current[i] = button;
          }}
          type="button"
          role="radio"
          aria-checked={i === index}
          tabIndex={i === index ? 0 : -1}
          onClick={() => pick(i)}
          className="display relative min-h-11 rounded-switch-item text-14 tracking-display text-muted transition-colors hover:text-fg aria-checked:text-fg"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
