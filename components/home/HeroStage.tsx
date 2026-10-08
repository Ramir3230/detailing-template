"use client";

import Image from "next/image";
import {
  createContext,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { HeroCar as HeroCarData } from "@/content/types";

/*
 * Фото загружено и раскодировано: машина и слой фар — каждый своим сигналом. Не
 * загрузилось — тоже сигнал: погашенная навсегда сцена оставила бы логотип тусклым.
 */
const Ready = createContext({ car: () => {}, lights: () => {} });

type StageProps = { id: string; className: string; children: ReactNode };

/*
 * Секция hero со сценой зажигания (DESIGN.md, «Движение»). Когда готовы и машина, и
 * слой фар, на секции появляется data-lit, и app/globals.css зажигает фары, кузов, неон
 * пола и логотип. Сама сцена — CSS, здесь только её моменты:
 * - data-ignited — сцена отыграла. Next держит ушедшую страницу в DOM скрытой
 *   (cacheComponents) и при возврате показывает снова, а показ перезапускает CSS-анимации:
 *   после data-ignited их на сцене нет, остаётся финальный кадр;
 * - data-hidden — страница скрыта: для CSS шапки hero на ней больше нет;
 * - --hero-h — высота экрана на момент открытия (см. ниже).
 */
export function HeroStage({ id, className, children }: StageProps) {
  const section = useRef<HTMLElement>(null);
  const [car, setCar] = useState(false);
  const [lights, setLights] = useState(false);
  const [ignited, setIgnited] = useState(false);
  const lit = car && lights;

  // Очистка срабатывает и тогда, когда Next прячет страницу, а не только при размонтировании
  useLayoutEffect(() => {
    const element = section.current;
    element?.removeAttribute("data-hidden");
    return () => element?.setAttribute("data-hidden", "");
  }, []);

  /*
   * Hero на телефоне — высотой в экран (100svh). Safari, прячя свои панели при прокрутке,
   * svh не меняет, а сторонние браузеры iPhone (Arc) и браузеры внутри приложений
   * растягивают само окно страницы: hero рос, и машина уезжала от логотипа. Поэтому
   * высота берётся один раз при открытии и меняется только с шириной — при повороте.
   */
  useLayoutEffect(() => {
    const element = section.current;
    if (!element) return;
    let width = 0;
    const freeze = () => {
      if (innerWidth === width) return;
      width = innerWidth;
      element.style.removeProperty("--hero-h");
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;visibility:hidden;height:100svh";
      element.append(probe);
      element.style.setProperty("--hero-h", `${probe.getBoundingClientRect().height}px`);
      probe.remove();
    };
    freeze();
    addEventListener("resize", freeze);
    return () => removeEventListener("resize", freeze);
  }, []);

  // Сцена отыграла, когда закончились все её анимации и переходы
  useEffect(() => {
    if (!lit || ignited || !section.current) return;
    let current = true;
    const running = section.current.getAnimations({ subtree: true }).map((a) => a.finished);
    Promise.allSettled(running).then(() => {
      if (current) setIgnited(true);
    });
    return () => {
      current = false;
    };
  }, [lit, ignited]);

  return (
    <section
      ref={section}
      id={id}
      data-ignition=""
      data-lit={lit ? "" : undefined}
      data-ignited={ignited ? "" : undefined}
      className={className}
    >
      <Ready value={{ car: () => setCar(true), lights: () => setLights(true) }}>{children}</Ready>
    </section>
  );
}

/* Машина на телефоне — 92% ширины экрана, на десктопе — до 780 px (--container-hero-car) */
const sizes = "(min-width: 1024px) 780px, 92vw";

const layer = "pointer-events-none absolute mix-blend-screen";

/*
 * Машина: вырезка, под ней неон пола, поверх — светодиоды фар двумя слоями (резкий и
 * размытый ореолом) и ореол каждой фары. Слои фар того же размера, что машина, поэтому
 * совпадают при любой ширине. Картинки декоративные: смысл несёт заголовок.
 */
export function HeroCar({ car, className = "" }: { car: HeroCarData; className?: string }) {
  const ready = use(Ready);
  const { src, lights, width, height, headlights } = car;

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
      <div
        aria-hidden="true"
        className="glow-floor ignite-floor pointer-events-none absolute inset-x-[-4%] top-[96%] h-[38%]"
      />
      <Image
        src={src}
        width={width}
        height={height}
        sizes={sizes}
        alt=""
        preload
        onLoad={ready.car}
        onError={ready.car}
        className="fade-bottom ignite-body relative block size-full"
      />
      <Image
        src={lights}
        width={width}
        height={height}
        sizes={sizes}
        alt=""
        loading="eager"
        className={`${layer} lights-bloom ignite-bloom inset-0 size-full`}
      />
      <Image
        src={lights}
        width={width}
        height={height}
        sizes={sizes}
        alt=""
        loading="eager"
        onLoad={ready.lights}
        onError={ready.lights}
        className={`${layer} ignite-rings inset-0 size-full`}
      />
      {/* Ореол вдвое шире светодиодов фары: ложится на фару и край крыла */}
      {headlights.map(({ x, y, w }) => (
        <div
          key={`${x}-${y}`}
          aria-hidden="true"
          style={{ left: `${x}%`, top: `${y}%`, width: `${w * 2}%` }}
          className={`${layer} glow-headlight ignite-headlight aspect-[2/1] -translate-x-1/2 -translate-y-1/2`}
        />
      ))}
    </div>
  );
}
