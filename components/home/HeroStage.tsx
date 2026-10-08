"use client";

import Image from "next/image";
import { createContext, use, useState, type ReactNode } from "react";
import type { HeroCar as HeroCarData } from "@/content/types";

/* Фото машины загружено и раскодировано — сцена загорается */
const Ignite = createContext<() => void>(() => {});

type StageProps = { id: string; className: string; children: ReactNode };

/*
 * Секция hero со сценой зажигания (DESIGN.md, «Движение»). Когда машина загрузилась,
 * на секции появляется data-lit, и app/globals.css зажигает фары, кузов, неон пола и
 * логотип. Сама сцена — CSS, здесь только момент старта.
 */
export function HeroStage({ id, className, children }: StageProps) {
  const [lit, setLit] = useState(false);

  return (
    <section id={id} data-ignition="" data-lit={lit ? "" : undefined} className={className}>
      <Ignite value={() => setLit(true)}>{children}</Ignite>
    </section>
  );
}

/* Машина на телефоне — 92% ширины экрана, на десктопе — до 780 px */
const sizes = "(min-width: 1024px) 780px, 92vw";

const layer = "pointer-events-none absolute mix-blend-screen";

/*
 * Машина: вырезка, под ней неон пола, поверх — светодиоды фар двумя слоями (резкий и
 * размытый ореолом) и ореол каждой фары. Слои фар того же размера, что машина, поэтому
 * совпадают при любой ширине. Картинки декоративные: смысл несёт заголовок.
 */
export function HeroCar({ car, className = "" }: { car: HeroCarData; className?: string }) {
  const ignite = use(Ignite);
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
        onLoad={ignite}
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
        className={`${layer} ignite-rings inset-0 size-full`}
      />
      {headlights.map(({ x, y }) => (
        <div
          key={`${x}-${y}`}
          aria-hidden="true"
          style={{ left: `${x}%`, top: `${y}%` }}
          className={`${layer} glow-headlight ignite-headlight aspect-[2/1] w-[34%] -translate-x-1/2 -translate-y-1/2`}
        />
      ))}
    </div>
  );
}
