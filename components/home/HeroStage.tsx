"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  createContext,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { VolumeState } from "@/components/home/CarVolume";
import type { HeroCar as HeroCarData } from "@/content/types";
import { heroCarSizes } from "@/lib/frame";

/* Код WebGL — отдельным куском и только у машины с картой объёма. Грузится после
   гидрации: фото машины и зажигание его не ждут */
const CarVolume = dynamic(() => import("@/components/home/CarVolume").then((m) => m.CarVolume), {
  ssr: false,
});

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
 * - --hero-h — высота экрана на момент открытия, вместе с окном не растёт (см. ниже).
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
   * Hero на телефоне — высотой в экран (100svh). Safari, пряча свои панели при прокрутке,
   * svh не меняет, а сторонние браузеры iPhone (Arc) и браузеры внутри приложений
   * растягивают само окно страницы: hero рос, и машина уезжала от логотипа. Поэтому
   * высота берётся при открытии и вместе с окном не растёт; уменьшается с ним (окно
   * сделали ниже) и пересчитывается при смене ширины — повороте. Замер живёт в ref:
   * возврат на скрытую страницу (cacheComponents) не должен мерить растянутое окно.
   * Ширина — раскладки, а не видимой области: масштаб щипком её не меняет.
   */
  const ruler = useRef<HTMLDivElement>(null);
  const frozen = useRef({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = section.current;
    const probe = ruler.current;
    if (!element || !probe) return;
    const freeze = () => {
      const width = document.documentElement.clientWidth;
      const height = probe.getBoundingClientRect().height;
      const last = frozen.current;
      if (width === last.width && height >= last.height) return;
      frozen.current = { width, height };
      element.style.setProperty("--hero-h", `${height}px`);
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
      {/* Линейка: 100svh в пикселях для --hero-h */}
      <div
        ref={ruler}
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 h-svh"
      />
      <Ready value={{ car: () => setCar(true), lights: () => setLights(true) }}>{children}</Ready>
    </section>
  );
}

const layer = "pointer-events-none absolute mix-blend-screen";

/*
 * Машина: вырезка, под ней неон пола, поверх — светодиоды фар двумя слоями (резкий и
 * размытый ореолом) и ореол каждой фары. Слои фар того же размера, что машина, поэтому
 * совпадают при любой ширине. Картинки декоративные: смысл несёт заголовок.
 * У машины с картой объёма (depth в данных) под фото лежит холст CarVolume: рисует
 * неон на полу вместо CSS-слоя (data-neon, если в данных есть underglow) и, когда
 * сцена отыграла, машину со всем светом фар вместо фото (data-volume). Пока он не готов
 * или если холста не будет, остаются эти слои.
 */
export function HeroCar({ car, className = "" }: { car: HeroCarData; className?: string }) {
  const ready = use(Ready);
  const { src, lights, depth, width, height, headlights, underglow, halo } = car;
  const body = useRef<HTMLImageElement>(null);
  const rings = useRef<HTMLImageElement>(null);
  const floor = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<VolumeState>({ car: false, neon: false });

  return (
    <div
      data-volume={shown.car ? "" : undefined}
      data-neon={shown.neon ? "" : undefined}
      className={`relative ${className}`}
      style={{ aspectRatio: `${width} / ${height}`, "--car-aspect": width / height, "--halo": halo } as CSSProperties}
    >
      {/* Неон на CSS прячется, а не убирается: по его вспышке зажигается неон холста */}
      <div
        ref={floor}
        aria-hidden="true"
        className="glow-floor ignite-floor pointer-events-none absolute top-[96%] h-[38%] in-data-neon:invisible"
      />
      {depth && (
        <CarVolume
          map={depth}
          aspect={width / height}
          headlights={headlights}
          underglow={underglow}
          halo={halo}
          body={body}
          rings={rings}
          floor={floor}
          onState={setShown}
        />
      )}
      <Image
        ref={body}
        src={src}
        width={width}
        height={height}
        sizes={heroCarSizes}
        alt=""
        preload
        onLoad={ready.car}
        onError={ready.car}
        className="fade-bottom ignite-body relative block size-full in-data-neon:fade-bottom-short in-data-volume:invisible"
      />
      <Image
        src={lights}
        width={width}
        height={height}
        sizes={heroCarSizes}
        alt=""
        loading="eager"
        className={`${layer} lights-bloom ignite-bloom inset-0 size-full in-data-volume:invisible`}
      />
      <Image
        ref={rings}
        src={lights}
        width={width}
        height={height}
        sizes={heroCarSizes}
        alt=""
        loading="eager"
        onLoad={ready.lights}
        onError={ready.lights}
        className={`${layer} ignite-rings inset-0 size-full in-data-volume:invisible`}
      />
      {/* Ореол вдвое шире светодиодов фары: ложится на фару и край крыла */}
      {headlights.map(({ x, y, w }) => (
        <div
          key={`${x}-${y}`}
          aria-hidden="true"
          style={{ left: `${x}%`, top: `${y}%`, width: `${w * 2}%` }}
          className={`${layer} glow-headlight ignite-headlight aspect-[2/1] -translate-x-1/2 -translate-y-1/2 in-data-volume:invisible`}
        />
      ))}
    </div>
  );
}
