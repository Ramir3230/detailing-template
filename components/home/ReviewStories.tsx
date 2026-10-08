"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type PointerEvent,
} from "react";
import { ChevronIcon, PauseIcon, PlayIcon } from "@/components/icons";
import { fill } from "@/lib/i18n";

type Story = { author: string; text: string; label: string; duration: number };

type Props = {
  stories: Story[];
  words: {
    carousel: string;
    previous: string;
    next: string;
    pause: string;
    resume: string;
    position: string;
  };
};

const swipePx = 40;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const isReducedMotion = () => window.matchMedia(reducedMotionQuery).matches;

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}
const isTabHidden = () => document.hidden;

const falseOnServer = () => false;

/*
 * Отзывы-сторис (механика мокапа, DESIGN.md «Движение»). Листаются сами, пока карточка
 * видна хотя бы наполовину, вкладка открыта, карточку не держат пальцем, в ней нет фокуса
 * с клавиатуры и не нажата пауза. При reduced motion сами не листаются. Новый отзыв
 * проявляется стадиями: кавычка ударом неона, ореол, текст из размытия, автор.
 * Прогресс пишется прямо в стиль полоски на каждом кадре, мимо React.
 */
export function ReviewStories({ stories, words }: Props) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, isReducedMotion, falseOnServer);
  const tabHidden = useSyncExternalStore(subscribeVisibility, isTabHidden, falseOnServer);
  const count = stories.length;
  const autoplay = !reducedMotion && count > 1;

  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [inView, setInView] = useState(false);
  const [started, setStarted] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const elapsed = useRef(0);
  const press = useRef<{ id: number; x: number } | null>(null);

  useEffect(() => {
    const element = card.current;
    if (!element) return;
    // Видна — значит хотя бы наполовину. isIntersecting с порогом движки считают по-разному.
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.intersectionRatio >= 0.5;
        setInView(visible);
        if (visible) setStarted(true);
      },
      { threshold: [0, 0.5] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const playing =
    autoplay && started && inView && !userPaused && !holding && !focusInside && !tabHidden;

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      const progress = Math.min(1, elapsed.current / stories[index].duration);
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
      if (progress >= 1) {
        elapsed.current = 0;
        setIndex((current) => (current + 1) % count);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, index, stories, count]);

  function go(step: number) {
    elapsed.current = 0;
    setIndex((current) => (current + step + count) % count);
  }

  // Нажатие держит сторис на паузе, свайп в сторону при отпускании листает.
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    press.current = { id: event.pointerId, x: event.clientX };
    setHolding(true);
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (press.current?.id !== event.pointerId) return;
    const dx = event.clientX - press.current.x;
    press.current = null;
    setHolding(false);
    if (Math.abs(dx) > swipePx) go(dx < 0 ? 1 : -1);
  }
  function onPointerCancel() {
    press.current = null;
    setHolding(false);
  }

  // Пауза только от фокуса с клавиатуры: клик мышью тоже ставит фокус на кнопку.
  function onFocus(event: FocusEvent<HTMLDivElement>) {
    if (event.target.matches(":focus-visible")) setFocusInside(true);
  }
  function onBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false);
  }

  // Диктор слышит новый отзыв, только когда его переключили руками.
  const announce = !autoplay || userPaused || focusInside;

  const iconButton =
    "grid size-11 place-items-center rounded-full text-fg-dim transition-colors hover:text-fg";

  return (
    <div
      ref={card}
      role="region"
      aria-label={words.carousel}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerCancel}
      onFocus={onFocus}
      onBlur={onBlur}
      className="relative isolate mt-6 flex min-h-110 touch-pan-y flex-col overflow-hidden rounded-card border border-line bg-surface p-6 select-none lg:mt-0 lg:min-h-90 lg:min-w-0 lg:flex-[999_1_520px] lg:rounded-card-lg lg:p-8"
    >
      {count > 1 && (
        <div className="-my-3 flex items-center gap-3">
          <div className="flex flex-1 gap-1">
            {stories.map((story, i) => {
              const full = i < index || (!autoplay && i === index);
              return (
                <span key={story.author} className="h-0.5 flex-1 overflow-hidden rounded-full bg-line-strong">
                  {/* Активную полоску двигает кадр анимации мимо React; новый ключ на смену
                      роли пересоздаёт её с нулевого состояния. */}
                  <span
                    key={i === index ? "active" : "idle"}
                    ref={i === index ? bar : undefined}
                    className="block h-full origin-left bg-accent"
                    style={{ transform: `scaleX(${full ? 1 : 0})` }}
                  />
                </span>
              );
            })}
          </div>
          <div className="-mr-3 flex">
            <button type="button" onClick={() => go(-1)} aria-label={words.previous} className={iconButton}>
              <ChevronIcon back size={16} />
            </button>
            {autoplay && (
              <button
                type="button"
                onClick={() => setUserPaused((paused) => !paused)}
                aria-label={userPaused ? words.resume : words.pause}
                className={iconButton}
              >
                {userPaused ? <PlayIcon size={14} /> : <PauseIcon size={14} />}
              </button>
            )}
            <button type="button" onClick={() => go(1)} aria-label={words.next} className={iconButton}>
              <ChevronIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Все отзывы в одной ячейке сетки: карточка высотой с самый длинный на любой ширине. */}
      <div className="mt-9 grid flex-1 lg:mt-10" aria-live={announce ? "polite" : "off"}>
        {stories.map((story, i) => {
          const active = i === index;
          return (
            <figure
              key={story.author}
              role="group"
              aria-label={fill(words.position, { n: String(i + 1), total: String(count) })}
              aria-hidden={!active}
              data-shown={started && active ? "" : undefined}
              className="group col-start-1 row-start-1 flex flex-col"
            >
              <div
                aria-hidden="true"
                className="glow-halo pointer-events-none absolute -top-20 -left-20 -z-10 size-64 opacity-0 transition-opacity duration-300 ease-in group-data-shown:opacity-100 group-data-shown:delay-300 group-data-shown:duration-[1200ms] group-data-shown:ease-warm lg:-top-25 lg:-left-25 lg:size-80"
              />
              <span
                aria-hidden="true"
                className="display neon-text h-7 text-64 leading-[0.5] text-accent opacity-0 group-data-shown:animate-[quote-strike_0.5s_linear_0.3s_both] lg:text-72"
              >
                “
              </span>
              <div className="flex flex-1 items-center py-4 lg:py-5">
                <blockquote className="translate-y-1.5 text-16 leading-long opacity-0 blur-[10px] brightness-30 transition-[opacity,translate,filter] duration-300 ease-in group-data-shown:translate-y-0 group-data-shown:opacity-100 group-data-shown:blur-[0px] group-data-shown:brightness-100 group-data-shown:delay-[450ms] group-data-shown:duration-[900ms] group-data-shown:ease-warm lg:text-19">
                  {story.text}
                </blockquote>
              </div>
              <figcaption className="flex translate-y-1 items-center gap-3 opacity-0 transition-[opacity,translate] duration-300 ease-in group-data-shown:translate-y-0 group-data-shown:opacity-100 group-data-shown:delay-[800ms] group-data-shown:duration-500 group-data-shown:ease-warm">
                <span
                  aria-hidden="true"
                  className="display grid size-10 shrink-0 place-items-center rounded-full border border-accent-mark bg-accent-selected text-14 lg:size-11 lg:text-15"
                >
                  {story.author.charAt(0)}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-15 font-medium lg:text-16">{story.author}</span>
                  <span className="text-13 text-muted lg:text-14">{story.label}</span>
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
