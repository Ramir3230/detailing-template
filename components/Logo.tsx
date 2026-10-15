import Image from "next/image";
import type { HTMLAttributes } from "react";
import { studio } from "@/content/studio";

/* Текст всегда — логотип из данных студии, своих детей у него нет */
type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & { unlit?: boolean; stacked?: boolean };

/**
 * Логотип надписью; размер задаёт место, где он стоит. unlit — погашенная неоновая
 * трубка: приглушённый, без свечения (hero до зажигания). Знак студии из данных стоит
 * перед надписью высотой 1,5 em от её кегля (DESIGN.md, «Знак студии»): надпись — текстом,
 * буквы внутри знака в шапке не прочесть. stacked — знак над надписью (hero телефона,
 * подвал): там надпись рядом со знаком в колонку не встаёт. Выравнивание столбца —
 * items-center или items-start — задаёт место: без него знак растянулся бы на ширину.
 */
export function Logo({ className = "", unlit = false, stacked = false, ...rest }: Props) {
  const mark = studio.logoMark;
  const layout = !mark ? "" : stacked ? "inline-flex flex-col gap-[0.3em]" : "inline-flex items-center gap-[0.45em]";
  return (
    <span
      {...rest}
      className={`display leading-logo tracking-logo ${layout} ${unlit ? "text-muted" : "neon-text"} ${className}`}
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
          className={`${stacked ? "h-[1.4em]" : "h-[1.5em]"} w-auto ${unlit ? "mark-unlit" : "mark-lit"}`}
        />
      )}
      {studio.logo}
    </span>
  );
}
