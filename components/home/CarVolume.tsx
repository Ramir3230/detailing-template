"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Headlight, Underglow } from "@/content/types";
import { approach, rotation } from "@/lib/car-volume";
import { createVolume, FIELD, type Volume } from "@/lib/car-volume-gl";

/** Что холст сейчас подменяет: машину (фото и свет фар) и неон пола на CSS. */
export type VolumeState = { car: boolean; neon: boolean };

/* Объёмная машина — DESIGN.md, «Движение», «Объёмная машина». Значения выбрал владелец
   в лаборатории 09.10.2026 (ветка exp/car-depth): тихий неон на зеркальном полу */
/* Наибольший поворот, градусы; вверх-вниз — вдвое меньше */
const ANGLE = 5;
/* Глубина рельефа, в высотах кадра */
const DEPTH = 0.2;
/* Сила отсвета неона пола на кузове */
const BODY_LIGHT = 0.3;
/* Яркость неона на полу */
const GLOW = 0.3;
/* Глянец пола 0..1: от матового бетона до зеркальной эпоксидки */
const GLOSS = 1;
/* Сила отражения машины в полу */
const MIRROR = 0.5;
/* Догоняние цели, с: за курсором — мягко, за прокруткой — почти сразу, она и так плавная */
const POINTER_TAU = 0.35;
const SCROLL_TAU = 0.12;
/* Ближе к цели, градусы, — уже цель: сдвиг меньше пикселя, а кадры шли бы ещё секунды */
const SETTLED = 0.1;
/* Отсвет на кузове и отражение проявляются после подмены, а не появляются рывком */
const FADE_IN_MS = 600;
/* Устройство не тянет: медиана кадра при движении дольше 50 мс (меньше 20 кадров/с) */
const SLOW_SAMPLES = 30;
const SLOW_FRAME_MS = 50;
/* Низ машины растворяется в полу с этой доли высоты — как .fade-bottom и .fade-bottom-short
   в app/globals.css: на неоне кодом машина стоит на освещённом полу */
const FADE = 0.7;
const FADE_ON_NEON = 0.96;
/* Плотность холста — как у экрана, до 3 (iPhone): реже — машина при подмене мягчеет.
   Плотнее разницы не видно, а работы больше */
const MAX_DPR = 3;

/*
 * Программная отрисовка вместо видеокарты — тоже «нет WebGL»: процессор телефона
 * задохнулся бы. failIfMajorPerformanceCaveat её не ловит (SwiftShader в Chromium
 * проходит), поэтому смотрим имя рендерера. Chrome и Safari прячут его за «WebKit
 * WebGL» — тогда спрашиваем расширение; Firefox отдаёт сразу, а на расширение ругается
 * в консоль. Имя скрыто совсем — решит замер кадров.
 */
function software(gl: WebGL2RenderingContext): boolean {
  let renderer = String(gl.getParameter(gl.RENDERER));
  if (/^webkit webgl$/i.test(renderer)) {
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
  }
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
}

/* Вычисленный цвет в доли 0..1 через холст 1×1: так понятен любой формат темы —
   hex, oklch(), color-mix() */
function components(color: string): [number, number, number] {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return [0, 0, 0];
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

async function loaded(image: HTMLImageElement): Promise<HTMLImageElement> {
  if (!image.complete) {
    await new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  }
  if (!image.naturalWidth) throw new Error(`no image: ${image.currentSrc || image.src}`);
  // Отказ раскодировать заранее не мешает: texImage2D раскодирует сам
  await image.decode().catch(() => {});
  return image;
}

type Props = {
  /** Карта объёма из данных студии. */
  map: string;
  aspect: number;
  headlights: readonly Headlight[];
  underglow?: Underglow;
  /** Фото и светодиоды фар статичной машины — из них берутся текстуры. */
  body: RefObject<HTMLImageElement | null>;
  rings: RefObject<HTMLImageElement | null>;
  /** Неон пола на CSS: по его видимости холст зажигает свой неон в те же моменты. */
  floor: RefObject<HTMLDivElement | null>;
  onState: (state: VolumeState) => void;
};

/*
 * Объёмная машина hero (DESIGN.md, «Движение»). Холст лежит под фото машины: пока
 * машину показывает фото, свет пола и отражение уходят под неё, как и должны.
 *
 * Неон на полу холст рисует с самого начала, вместо CSS-слоя: вспышку берёт у этого
 * слоя — спрятанного, но анимированного, — так тайминги зажигания живут в одном месте,
 * app/globals.css. Машину холст подменяет, когда сцена отыграла (data-ignited): сборка
 * текстур не попадает на моргание ксенона. В покое кадр машины совпадает с фото,
 * поэтому подмена не видна; отражение и отсвет на кузове после неё проявляются.
 *
 * На десктопе машина поворачивается за курсором, на телефоне — от прокрутки hero. При
 * reduced motion — неподвижный кадр: неон и отражение есть, поворота нет. Без холста
 * совсем — в режиме экономии трафика, без WebGL2, на программной отрисовке и когда
 * устройство не тянет: тогда фото и неон на CSS.
 */
export function CarVolume({ map, aspect, headlights, underglow, body, rings, floor, onState }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const photo = body.current;
    const leds = rings.current;
    if (!element || !photo || !leds) return;

    let stopped = false;
    let frame = 0;
    let volume: Volume | null = null;
    const cleanups: (() => void)[] = [];
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      for (const cleanup of cleanups.splice(0)) cleanup();
      volume?.destroy();
      volume = null;
    };
    // Холста больше нет: машина — фото, неон — на CSS
    const off = () => {
      stop();
      onState({ car: false, neon: false });
    };

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return off();
    const gl = element.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      failIfMajorPerformanceCaveat: true,
    });
    if (!gl || software(gl)) return off();

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let still = reducedMotion.matches;
    const stage = element.closest("[data-ignition]");
    const ignited = new Promise<void>((resolve) => {
      if (!stage || stage.hasAttribute("data-ignited")) return resolve();
      const watch = new MutationObserver(() => {
        if (!stage.hasAttribute("data-ignited")) return;
        watch.disconnect();
        resolve();
      });
      watch.observe(stage, { attributes: true, attributeFilter: ["data-ignited"] });
      cleanups.push(() => watch.disconnect());
    });
    const depthMap = new Image();
    depthMap.src = map;

    try {
      // Цвет акцента темы — у холста стоит text-accent
      const accent = components(getComputedStyle(element).color);
      volume = createVolume(gl, { aspect, accent, headlights, underglow });
    } catch {
      // Шейдер не собрался на этом устройстве
      return off();
    }
    const scene = volume;

    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    let visible = true;
    let pointer: { x: number; y: number } | null = null;
    let yaw = 0;
    let pitch = 0;
    let last = 0;
    let carAt = 0;
    let shown: VolumeState = { car: false, neon: false };
    // Размер холста, который видела эта сцена: сам холст мог остаться от прошлой
    // (StrictMode, возврат на страницу), и его размер новой сцене ничего не говорит
    let drawn = [0, 0];
    // Что на холсте сейчас: тот же кадр второй раз не рисуется
    let painted = "";
    // Программы ещё собираются — кадры повторяются, пока не соберутся
    let waiting = true;
    // Прошлый кадр рисовал неон на полу — самый тяжёлый проход
    let heavy = false;
    const samples: number[] = [];

    const opacity = (layer: Element | null) => (layer ? Number(getComputedStyle(layer).opacity) : 1);
    /* Кадр по текущему состоянию; force — холст стёрт или сменились текстуры. Возвращает
       проявление после подмены и силу неона; null — шейдер не собрался, холста больше нет */
    const paint = (now: number, force = false) => {
      const lit = Boolean(underglow);
      // При reduced motion — сразу финальный кадр, без проявления
      const fadeIn = carAt ? (still ? 1 : Math.min(1, (now - carAt) / FADE_IN_MS)) : 0;
      const neon = lit ? GLOW * opacity(floor.current) : 0;
      const car = Boolean(carAt) && !still;
      const key = [yaw, pitch, neon, fadeIn, car].join();
      if (!force && !waiting && key === painted) return { fadeIn, neon };
      painted = key;
      let result;
      try {
        result = scene.draw({
          rotation: rotation(yaw, pitch),
          yaw,
          depth: DEPTH,
          car,
          light: BODY_LIGHT * fadeIn,
          neon,
          fade: lit ? FADE_ON_NEON : FADE,
          gloss: GLOSS,
          reflection: MIRROR * fadeIn,
        });
      } catch {
        off();
        return null;
      }
      waiting = result.waiting;
      const next = { car: result.car, neon: lit && result.floor };
      if (next.car !== shown.car || next.neon !== shown.neon) {
        shown = next;
        onState(shown);
      }
      return { fadeIn, neon };
    };

    // Холст в точных пикселях устройства, где браузер их сообщает: при округлении
    // CSS-размера экран растягивает кадр на доли пикселя, и он мягчеет. Точному
    // размеру верим, только если он сходится с CSS × плотность: эмуляция телефона в
    // Chromium отдаёт его без плотности, и холст выходил втрое реже
    const size = (entry?: ResizeObserverEntry) => {
      const { width, height } = element.getBoundingClientRect();
      // Страница спрятана (cacheComponents) — размер придёт, когда её покажут
      if (!width || !height) return;
      const exact = entry?.devicePixelContentBoxSize?.[0];
      const trusted = exact && Math.abs(exact.inlineSize - width * devicePixelRatio) < 2;
      const scale = Math.min(1, MAX_DPR / devicePixelRatio);
      const w = Math.round((trusted ? exact.inlineSize : width * devicePixelRatio) * scale);
      const h = Math.round((trusted ? exact.blockSize : height * devicePixelRatio) * scale);
      if (w === drawn[0] && h === drawn[1]) return;
      drawn = [w, h];
      // Присваивание размера стирает холст — только когда он и правда другой
      if (element.width !== w) element.width = w;
      if (element.height !== h) element.height = h;
      scene.resize(w, h, width / (1 + (2 * FIELD.side) / aspect));
      // Стёртый холст перерисовать до показа экрана, иначе всё моргнёт
      paint(performance.now(), true);
    };

    const tick = (now: number) => {
      frame = 0;
      const turning = Boolean(carAt) && !still;

      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      let yawTarget = 0;
      let pitchTarget = 0;
      if (turning && fine && pointer) {
        // Курсор относительно центра машины, в полуэкранах
        const box = element.getBoundingClientRect();
        const x = (pointer.x - (box.left + box.width / 2)) / (innerWidth / 2);
        const y = (box.top + box.height / 2 - pointer.y) / (innerHeight / 2);
        yawTarget = Math.max(-1, Math.min(1, x)) * ANGLE;
        pitchTarget = (Math.max(-1, Math.min(1, y)) * ANGLE) / 2;
      } else if (turning && !fine && stage) {
        // Доля прокрученного hero: машина уходит вверх — видна чуть снизу и сбоку
        const hero = stage.getBoundingClientRect();
        const scrolled = Math.max(0, Math.min(1, -hero.top / hero.height));
        yawTarget = scrolled * ANGLE;
        pitchTarget = (scrolled * ANGLE) / 2;
      }
      const tau = fine ? POINTER_TAU : SCROLL_TAU;
      yaw = approach(yaw, yawTarget, dt, tau);
      pitch = approach(pitch, pitchTarget, dt, tau);
      const moving = Math.abs(yaw - yawTarget) > SETTLED || Math.abs(pitch - pitchTarget) > SETTLED;
      // Остановка — ровно в цели: в покое кадр совпадает с фото
      if (!moving) [yaw, pitch] = [yawTarget, pitchTarget];

      // Скорость меряем на тяжёлых кадрах: машина движется или на полу горит неон, — в
      // том числе на зажигании. Пустые кадры до вспышки занизили бы медиану
      if (last && (moving || heavy) && samples.length < SLOW_SAMPLES) {
        samples.push(now - last);
        if (samples.length === SLOW_SAMPLES) {
          const median = [...samples].sort((a, b) => a - b)[SLOW_SAMPLES / 2];
          if (median > SLOW_FRAME_MS) return off();
        }
      }
      last = now;

      const result = paint(now);
      if (!result) return;
      heavy = result.neon > 0;
      // Пока сцена не отыграла, неон следует за вспышкой CSS-слоя каждый кадр
      const igniting = stage ? !stage.hasAttribute("data-ignited") : false;
      const fading = Boolean(carAt) && result.fadeIn < 1;
      if (visible && (moving || igniting || fading || waiting)) frame = requestAnimationFrame(tick);
      else last = 0;
    };

    const awake = () => {
      if (!stopped && visible && !frame) frame = requestAnimationFrame(tick);
    };

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

    // Окно стало шире или телефон повернули — браузер берёт из srcset кадр крупнее
    const onPhoto = () => {
      scene.refresh();
      paint(performance.now(), true);
    };
    const onPointer = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      awake();
    };
    const onLeave = () => {
      pointer = null;
      awake();
    };
    const listen = () => {
      if (fine) {
        addEventListener("pointermove", onPointer, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      } else {
        addEventListener("scroll", awake, { passive: true });
      }
    };
    const unlisten = () => {
      removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      removeEventListener("scroll", awake);
    };
    // Уменьшение движения включили при открытой странице — машина сразу встаёт в покой
    const onMotion = () => {
      still = reducedMotion.matches;
      if (still) {
        unlisten();
        yaw = 0;
        pitch = 0;
      } else {
        listen();
      }
      awake();
    };
    photo.addEventListener("load", onPhoto);
    leds.addEventListener("load", onPhoto);
    if (!still) listen();
    reducedMotion.addEventListener("change", onMotion);
    // WebGL сбросился — холст не восстанавливаем
    element.addEventListener("webglcontextlost", off);
    cleanups.push(() => {
      resized.disconnect();
      seen.disconnect();
      photo.removeEventListener("load", onPhoto);
      leds.removeEventListener("load", onPhoto);
      unlisten();
      reducedMotion.removeEventListener("change", onMotion);
      element.removeEventListener("webglcontextlost", off);
    });
    awake();

    Promise.all([loaded(photo), loaded(leds), loaded(depthMap), ignited]).then(
      () => {
        if (stopped) return;
        scene.setCar({ color: photo, lights: leds, map: depthMap });
        carAt = performance.now();
        awake();
      },
      // Не загрузились картинки
      () => {
        if (!stopped) off();
      },
    );

    return () => {
      stop();
      onState({ car: false, neon: false });
    };
  }, [map, aspect, headlights, underglow, body, rings, floor, onState]);

  // Холст — кадр машины с полями FIELD: свет на полу и отражение, запас на поворот
  const side = (FIELD.side / aspect) * 100;
  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      style={{
        left: `-${side}%`,
        top: `-${FIELD.top * 100}%`,
        width: `${100 + 2 * side}%`,
        height: `${(1 + FIELD.top + FIELD.bottom) * 100}%`,
      }}
      className="pointer-events-none invisible absolute text-accent in-data-neon:visible in-data-volume:visible"
    />
  );
}
