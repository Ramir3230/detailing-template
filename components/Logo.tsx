import Image from "next/image";
import type { HTMLAttributes } from "react";
import { studio } from "@/content/studio";

/* Текст всегда — логотип из данных студии, своих детей у него нет */
type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & { unlit?: boolean };

/**
 * Логотип надписью; размер задаёт место, где он стоит. unlit — погашенная неоновая
 * трубка: приглушённый, без свечения (hero до зажигания). Знак студии из данных стоит
 * перед надписью высотой 1,5 em от её кегля (DESIGN.md, «Знак студии»): надпись — текстом,
 * буквы внутри знака в шапке не прочесть.
 */
export function Logo({ className = "", unlit = false, ...rest }: Props) {
  const mark = studio.logoMark;
  return (
    <span
      {...rest}
      className={`display leading-logo tracking-logo ${mark ? "inline-flex items-center gap-[0.45em]" : ""} ${unlit ? "text-muted" : "neon-text"} ${className}`}
    >
      {mark && (
        // Векторный знак: оптимизатору нечего сжимать. alt пустой — имя студии рядом текстом.
        // Сразу, не лениво: знак на первом экране — в hero телефона и в шапке десктопа
        <Image
          src={mark.src}
          width={mark.width}
          height={mark.height}
          alt=""
          unoptimized
          loading="eager"
          className={`h-[1.5em] w-auto ${unlit ? "mark-unlit" : "mark-lit"}`}
        />
      )}
      {studio.logo}
    </span>
  );
}
