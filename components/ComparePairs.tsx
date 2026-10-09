"use client";

import Image from "next/image";
import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Price, ServiceName } from "@/components/Price";
import { DragSidewaysIcon } from "@/components/icons";
import type { ComparePair } from "@/lib/compare";
import { columnFrameSizes, frameSizes } from "@/lib/frame";

type Words = { before: string; after: string; pairs: string; examples: string };

const tagClass =
  "glass-float pointer-events-none absolute top-3 rounded-full px-3 py-1 text-13 leading-body font-medium";

const clamp = (value: number) => Math.min(100, Math.max(0, value));

const keySteps: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (index) => index + 1,
  ArrowLeft: (index) => index - 1,
  Home: () => 0,
  End: (_, count) => count - 1,
};

/*
 * Раскладка; до 1024 px обе — телефонная. «section» — секция главной во всю ширину: кадр
 * до 520 слева, текст до 460 справа. «column» — основная колонка страницы группы: кадр и
 * текст встают рядом, только когда самой колонке хватает места — 728 px: кадр 420, 48
 * между ними и 260 тексту (запрос к ширине контейнера, контейнер — родитель с
 * `@container`); иначе друг под другом, кадр и подпись под ним не шире 420.
 */
const layouts = {
  section: {
    sizes: frameSizes,
    root: "lg:grid lg:grid-cols-[minmax(0,520px)_minmax(0,460px)] lg:grid-rows-[1fr_auto_auto_auto_auto_1fr] lg:gap-x-20",
    heading: "lg:col-start-2 lg:row-start-2",
    tabs: "lg:col-start-2 lg:row-start-3 lg:mt-7",
    panel: "lg:col-start-1 lg:row-span-full lg:mt-0",
    caption: "lg:col-start-2 lg:row-start-4 lg:mt-6 lg:border-t lg:border-line lg:pt-4",
    examples: "lg:col-start-2 lg:row-start-5",
  },
  column: {
    sizes: columnFrameSizes,
    root: "lg:@min-[728px]:grid lg:@min-[728px]:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:@min-[728px]:grid-rows-[1fr_auto_auto_auto_auto_1fr] lg:@min-[728px]:gap-x-12",
    heading: "lg:@min-[728px]:col-start-2 lg:@min-[728px]:row-start-2",
    tabs: "lg:max-w-105 lg:@min-[728px]:col-start-2 lg:@min-[728px]:row-start-3 lg:@min-[728px]:max-w-none",
    panel: "lg:max-w-105 lg:@min-[728px]:col-start-1 lg:@min-[728px]:row-span-full lg:@min-[728px]:mt-0",
    caption:
      "lg:max-w-105 lg:@min-[728px]:col-start-2 lg:@min-[728px]:row-start-4 lg:@min-[728px]:mt-6 lg:@min-[728px]:max-w-none lg:@min-[728px]:border-t lg:@min-[728px]:border-line lg:@min-[728px]:pt-4",
    examples: "lg:@min-[728px]:col-start-2 lg:@min-[728px]:row-start-5",
  },
} as const;

/**
 * До/после главной и страницы группы: вкладки пар, шторка, услуга с ценой «od …».
 * Телефон — одной колонкой, как на холсте; десктоп — кадр слева, заголовок, вкладки и
 * услуга справа, по центру высоты кадра.
 */
export function ComparePairs({
  heading,
  pairs,
  words,
  layout = "section",
}: {
  heading: ReactNode;
  pairs: ComparePair[];
  words: Words;
  layout?: keyof typeof layouts;
}) {
  const place = layouts[layout];
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState(50);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const pair = pairs[active];
  const withTabs = pairs.length > 1;

  // Новая пара — шторка снова посередине
  function show(index: number) {
    if (index === active) return;
    setActive(index);
    setPosition(50);
  }

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    const step = keySteps[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (step(active, pairs.length) + pairs.length) % pairs.length;
    show(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className={place.root}>
      <div className={place.heading}>{heading}</div>

      {withTabs && (
        <div
          role="tablist"
          aria-label={words.pairs}
          onKeyDown={onTabKey}
          className={`mt-6 grid auto-cols-fr grid-flow-col gap-1 rounded-switch border border-line p-1 ${place.tabs}`}
        >
          {pairs.map((item, index) => (
            <button
              key={item.after.src}
              ref={(button) => {
                tabs.current[index] = button;
              }}
              id={`${id}-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-controls={`${id}-panel`}
              tabIndex={index === active ? 0 : -1}
              onClick={() => show(index)}
              className="min-h-11 rounded-switch-item border border-transparent text-15 leading-item font-medium text-muted transition-colors hover:text-fg aria-selected:border-accent aria-selected:bg-accent-selected aria-selected:text-fg"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div
        id={`${id}-panel`}
        role={withTabs ? "tabpanel" : undefined}
        aria-labelledby={withTabs ? `${id}-tab-${active}` : undefined}
        className={`mt-4 ${place.panel}`}
      >
        <Slider
          pairs={pairs}
          active={active}
          position={position}
          onMove={setPosition}
          words={words}
          sizes={place.sizes}
        />
      </div>

      <div className={`mt-4 flex items-baseline justify-between gap-3 ${place.caption}`}>
        <ServiceName name={pair.service} brand={pair.brand} />
        <Price parts={pair.price} />
      </div>
      {pairs.some((item) => item.examples) && (
        // Место держится и под парой без ИИ: строка не прыгает при смене вкладки
        <p
          className={`mt-2 text-12 leading-body text-muted ${place.examples} ${pair.examples ? "" : "invisible"}`}
        >
          {words.examples}
        </p>
      )}
    </div>
  );
}

/**
 * Шторка: мышью, пальцем и стрелками. Кадры всех пар лежат в рамке друг на друге, видна
 * только выбранная: браузер грузит их вместе, когда блок подходит к экрану, и смена
 * вкладки не показывает пустую рамку.
 */
function Slider({
  pairs,
  active,
  position,
  onMove,
  words,
  sizes,
}: {
  pairs: ComparePair[];
  active: number;
  position: number;
  onMove: (position: number) => void;
  words: Words;
  /** Ширина кадра на экране для next/image — у каждой раскладки своя. */
  sizes: string;
}) {
  // Палец ведёт шторку один: второй (щипок) не перехватывает
  const drag = useRef<{ id: number; x: number; from: number } | null>(null);
  const range = useRef<HTMLInputElement>(null);

  // Щелчок мышью по кадру отдаёт фокус ползунку: иначе фокус уходит на страницу, и
  // стрелки, обещанные подсказкой, листают её, а не двигают шторку. Кольцо фокуса после
  // мыши не нужно: focusVisible пока не знают типы DOM в TypeScript, отсюда приведение
  function onMouseDown(event: MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    range.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const box = event.currentTarget.getBoundingClientRect();
    // Мышь ставит шторку под курсор. Палец двигает её на пройденное расстояние: пока
    // браузер решает, отдать ли вертикальный жест прокрутке страницы, он присылает
    // несколько pointermove — они не должны дёргать шторку туда, где палец коснулся
    const from =
      event.pointerType === "mouse"
        ? clamp(((event.clientX - box.left) / box.width) * 100)
        : position;
    onMove(from);
    drag.current = { id: event.pointerId, x: event.clientX, from };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    const { width } = event.currentTarget.getBoundingClientRect();
    onMove(clamp(drag.current.from + ((event.clientX - drag.current.x) / width) * 100));
  }

  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id === event.pointerId) drag.current = null;
  }

  const pair = pairs[active];

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onMouseDown={onMouseDown}
      className="relative aspect-[4/5] cursor-ew-resize touch-pan-y touch-pinch-zoom overflow-hidden rounded-tile bg-surface select-none lg:rounded-card-lg"
    >
      {pairs.map((item, index) => (
        <div key={item.after.src} className={index === active ? undefined : "invisible"}>
          <Image
            src={item.after.src}
            width={item.after.width}
            height={item.after.height}
            alt={item.after.alt}
            sizes={sizes}
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
          <span aria-hidden="true" className={`${tagClass} right-3`}>
            {words.after}
          </span>
          {/* «До» со своей меткой поверх «после»: метка видна только над своим кадром */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            <Image
              src={item.before.src}
              width={item.before.width}
              height={item.before.height}
              alt={item.before.alt}
              sizes={sizes}
              draggable={false}
              className="absolute inset-0 size-full object-cover"
            />
            <span aria-hidden="true" className={`${tagClass} left-3`}>
              {words.before}
            </span>
          </div>
        </div>
      ))}

      {/* Клавиатура и диктор двигают ту же шторку обычным ползунком */}
      <input
        ref={range}
        type="range"
        min={0}
        max={100}
        value={Math.round(position)}
        onChange={(event) => onMove(Number(event.target.value))}
        aria-label={pair.compare}
        className="peer sr-only"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-slider"
        style={{ left: `${position}%` }}
      />
      <div
        aria-hidden="true"
        className="glass-float pointer-events-none absolute top-1/2 grid size-11 -translate-1/2 place-items-center rounded-full border-2 border-slider text-slider peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent lg:size-12"
        style={{ left: `${position}%` }}
      >
        <DragSidewaysIcon size={22} />
      </div>
    </div>
  );
}
