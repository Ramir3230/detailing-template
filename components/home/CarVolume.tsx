"use client";

import { createContext, use, useEffect, useRef, type RefObject } from "react";
import { approach, brightness, rgb, rotation } from "@/lib/car-volume";
import { createVolume, PAD, type Volume } from "@/lib/car-volume-gl";

export type VolumeSettings = {
  /** Выключенный объём показывает статичную машину. */
  on: boolean;
  /** Наибольший поворот, градусы; вверх-вниз — вдвое меньше. */
  angle: number;
  /** Глубина рельефа, в высотах кадра. */
  depth: number;
  /** Сила отсвета неона пола на кузове. */
  light: number;
};

export const defaultVolume: VolumeSettings = { on: true, angle: 5, depth: 0.3, light: 0.6 };

/** Почему машина осталась статичной. */
export type VolumeOff = "reduced-motion" | "save-data" | "no-webgl" | "no-image" | "slow" | "lost";
export type VolumeStatus = "loading" | "live" | VolumeOff;

/* Без провайдера — значения по умолчанию, и отчёт о состоянии никуда не идёт.
   Провайдер ставит лаборатория /lab/car */
export const VolumeContext = createContext<{
  settings: VolumeSettings;
  report: (status: VolumeStatus) => void;
}>({ settings: defaultVolume, report: () => {} });

/* Догоняние цели, с: за курсором — мягко, за прокруткой — почти сразу, она и так плавная */
const POINTER_TAU = 0.35;
const SCROLL_TAU = 0.12;
/* Отсвет неона на кузове проявляется после подмены картинки, а не появляется рывком */
const LIGHT_IN_MS = 600;
/* Устройство не тянет: медиана кадра при движении дольше 50 мс (меньше 20 кадров/с) */
const SLOW_SAMPLES = 30;
const SLOW_FRAME_MS = 50;
/* Плотность холста — как у экрана, до 3 (iPhone): реже — машина при подмене мягчеет.
   Плотнее разницы не видно, а работы больше */
const MAX_DPR = 3;

/*
 * Программная отрисовка вместо видеокарты — тоже «нет WebGL»: процессор телефона
 * задохнулся бы. failIfMajorPerformanceCaveat её не ловит (SwiftShader в Chromium
 * проходит), поэтому смотрим имя рендерера; браузер его скрыл — решит замер кадров.
 */
function software(gl: WebGL2RenderingContext): boolean {
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
}

type Props = {
  /** Карта объёма из данных студии. */
  map: string;
  aspect: number;
  /** Слои статичной машины: из них берутся текстуры и значения зажигания. */
  body: RefObject<HTMLImageElement | null>;
  rings: RefObject<HTMLImageElement | null>;
  bloom: RefObject<HTMLImageElement | null>;
  floor: RefObject<HTMLDivElement | null>;
  /** Холст нарисовал машину и подменяет статичные слои — или вернул их. */
  onLive: (live: boolean) => void;
};

/*
 * Объёмная машина hero (ROADMAP 3b, эксперимент). Холст лежит поверх статичной машины
 * и невидим, пока не нарисовал первый кадр; тогда HeroCar прячет фото, кольца и ореол
 * фар. В покое кадр совпадает с фото, поэтому подмена не видна.
 *
 * Зажигание не ждёт объёма и остаётся на CSS: холст каждый кадр читает у спрятанных
 * слоёв яркость кузова и видимость колец, ореола и неона пола — тайминги живут в одном
 * месте, app/globals.css.
 *
 * На десктопе машина поворачивается за курсором, на телефоне — от прокрутки hero.
 * Статичной остаётся при reduced motion, в режиме экономии трафика, без WebGL2, на
 * программной отрисовке и когда устройство не тянет.
 */
export function CarVolume({ map, aspect, body, rings, bloom, floor, onLive }: Props) {
  const { settings, report } = use(VolumeContext);
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(settings);
  const wake = useRef(() => {});

  useEffect(() => {
    latest.current = settings;
    wake.current();
  }, [settings]);

  useEffect(() => {
    const element = canvas.current;
    const photo = body.current;
    const leds = rings.current;
    if (!element || !photo || !leds) return;

    let stopped = false;
    let volume: Volume | null = null;
    const cleanups: (() => void)[] = [];
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      for (const cleanup of cleanups.splice(0)) cleanup();
      volume?.destroy();
      volume = null;
    };
    const off = (reason: VolumeOff) => {
      stop();
      onLive(false);
      report(reason);
    };

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    let frame = 0;
    if (reducedMotion.matches) {
      off("reduced-motion");
      return;
    }
    if (connection?.saveData) {
      off("save-data");
      return;
    }
    const gl = element.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      failIfMajorPerformanceCaveat: true,
    });
    if (!gl || software(gl)) {
      off("no-webgl");
      return;
    }
    report("loading");

    const loaded = async (image: HTMLImageElement) => {
      if (!image.complete) {
        await new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      }
      if (!image.naturalWidth) throw new Error(`no image: ${image.currentSrc}`);
      // Отказ раскодировать заранее не мешает: texImage2D раскодирует сам
      await image.decode().catch(() => {});
      return image;
    };
    const depthMap = new Image();
    depthMap.src = map;

    const run = (scene: Volume) => {
      const stage = element.closest("[data-ignition]");
      const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
      let visible = true;
      let pointer: { x: number; y: number } | null = null;
      let yaw = 0;
      let pitch = 0;
      let last = 0;
      let shownAt = 0;
      const samples: number[] = [];

      // Холст в точных пикселях устройства, где браузер их сообщает: при округлении
      // CSS-размера экран растягивает кадр на доли пикселя, и он мягчеет. Точному
      // размеру верим, только если он сходится с CSS × плотность: эмуляция телефона в
      // Chromium отдаёт его без плотности, и холст выходил втрое реже
      const size = (entry?: ResizeObserverEntry) => {
        const { width, height } = element.getBoundingClientRect();
        const exact = entry?.devicePixelContentBoxSize?.[0];
        const trusted = exact && Math.abs(exact.inlineSize - width * devicePixelRatio) < 2;
        const scale = Math.min(1, MAX_DPR / devicePixelRatio);
        element.width = Math.round((trusted ? exact.inlineSize : width * devicePixelRatio) * scale);
        element.height = Math.round((trusted ? exact.blockSize : height * devicePixelRatio) * scale);
        scene.resize(element.width, element.height, width / (1 + 2 * PAD));
      };

      const tick = (now: number) => {
        frame = 0;
        const { on, angle, depth, light } = latest.current;
        if (!on) {
          if (shownAt) onLive(false);
          shownAt = 0;
          last = 0;
          return;
        }

        const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
        const box = element.getBoundingClientRect();
        let yawTarget = 0;
        let pitchTarget = 0;
        if (fine && pointer) {
          // Курсор относительно центра машины, в полуэкранах
          const x = (pointer.x - (box.left + box.width / 2)) / (innerWidth / 2);
          const y = (box.top + box.height / 2 - pointer.y) / (innerHeight / 2);
          yawTarget = Math.max(-1, Math.min(1, x)) * angle;
          pitchTarget = (Math.max(-1, Math.min(1, y)) * angle) / 2;
        } else if (!fine && stage) {
          // Доля прокрученного hero: машина уходит вверх — видна чуть снизу и сбоку
          const hero = stage.getBoundingClientRect();
          const scrolled = Math.max(0, Math.min(1, -hero.top / hero.height));
          yawTarget = scrolled * angle;
          pitchTarget = (scrolled * angle) / 2;
        }
        const tau = fine ? POINTER_TAU : SCROLL_TAU;
        yaw = approach(yaw, yawTarget, dt, tau);
        pitch = approach(pitch, pitchTarget, dt, tau);
        const moving = Math.abs(yaw - yawTarget) > 0.01 || Math.abs(pitch - pitchTarget) > 0.01;

        // Скорость меряем только на движении после зажигания: загрузка страницы не в счёт
        const ignited = !stage || stage.hasAttribute("data-ignited");
        if (last && moving && ignited && samples.length < SLOW_SAMPLES) {
          samples.push(now - last);
          if (samples.length === SLOW_SAMPLES) {
            const median = [...samples].sort((a, b) => a - b)[SLOW_SAMPLES / 2];
            if (median > SLOW_FRAME_MS) return off("slow");
          }
        }
        last = now;

        const lightIn = shownAt ? Math.min(1, (now - shownAt) / LIGHT_IN_MS) : 0;
        const opacity = (layer: Element | null) => (layer ? Number(getComputedStyle(layer).opacity) : 1);
        scene.draw({
          rotation: rotation(yaw, pitch),
          depth,
          body: brightness(getComputedStyle(photo).filter),
          rings: opacity(leds),
          bloom: opacity(bloom.current),
          light: light * opacity(floor.current) * lightIn,
        });
        if (!shownAt) {
          shownAt = now;
          onLive(true);
          report("live");
        }

        if (visible && (moving || !ignited || lightIn < 1)) frame = requestAnimationFrame(tick);
        else last = 0;
      };

      const awake = () => {
        if (!stopped && visible && !frame) frame = requestAnimationFrame(tick);
      };
      wake.current = awake;

      size();
      const resized = new ResizeObserver(([entry]) => {
        size(entry);
        awake();
      });
      try {
        resized.observe(element, { box: "device-pixel-content-box" });
      } catch {
        resized.observe(element);
      }
      const seen = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        awake();
      });
      seen.observe(element);

      const onPointer = (event: PointerEvent) => {
        pointer = { x: event.clientX, y: event.clientY };
        awake();
      };
      const onLeave = () => {
        pointer = null;
        awake();
      };
      const onMotion = () => reducedMotion.matches && off("reduced-motion");
      const onLost = () => off("lost");
      if (fine) {
        addEventListener("pointermove", onPointer, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      } else {
        addEventListener("scroll", awake, { passive: true });
      }
      reducedMotion.addEventListener("change", onMotion);
      element.addEventListener("webglcontextlost", onLost);

      cleanups.push(() => {
        wake.current = () => {};
        resized.disconnect();
        seen.disconnect();
        removeEventListener("pointermove", onPointer);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        removeEventListener("scroll", awake);
        reducedMotion.removeEventListener("change", onMotion);
        element.removeEventListener("webglcontextlost", onLost);
      });
      awake();
    };

    Promise.all([loaded(photo), loaded(leds), loaded(depthMap)]).then(
      () => {
        if (stopped) return;
        // Цвет акцента темы — у холста стоит text-accent
        const accent = rgb(getComputedStyle(element).color) ?? [0, 0, 0];
        try {
          volume = createVolume(gl, { color: photo, lights: leds, map: depthMap }, { aspect, accent });
        } catch {
          off("no-webgl");
          return;
        }
        run(volume);
      },
      () => {
        if (!stopped) off("no-image");
      },
    );

    return () => {
      stop();
      onLive(false);
    };
  }, [map, aspect, body, rings, bloom, floor, onLive, report]);

  // Холст — машина с полем PAD её ширины со всех сторон: при повороте кромка не режется
  const padX = PAD * 100;
  const padY = PAD * aspect * 100;
  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      style={{
        left: `-${padX}%`,
        top: `-${padY}%`,
        width: `${100 + 2 * padX}%`,
        height: `${100 + 2 * padY}%`,
      }}
      className="pointer-events-none invisible absolute text-accent in-data-volume:visible"
    />
  );
}
