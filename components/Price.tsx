import type { CSSProperties } from "react";
import type { CarClass } from "@/content/types";
import { NBSP, type PriceParts } from "@/lib/format";
import { stripSymbols } from "@/lib/odometer";
import type { Rolling } from "@/lib/price-list";

/*
 * Цена и название услуги — одни для строки прайса главной, карточки страницы группы и
 * подписи под до/после. Размеры — из шкалы DESIGN.md: строка прайса и карточка группы.
 */
const sizes = {
  row: {
    name: "text-15 lg:text-16",
    amount: "text-16 lg:text-17",
    individual: "text-14 lg:text-15",
  },
  card: {
    name: "text-17 lg:text-20",
    amount: "text-20 lg:text-24",
    individual: "text-14 lg:text-15",
  },
} as const;

export type PriceSize = keyof typeof sizes;

/*
 * Переходы включаются, только когда класс выбрал человек ([data-animate] ставит
 * ClassScope): подстройка под сохранённый класс после загрузки проходит без анимации.
 * --engage — момент, когда «передача встала» (0,26 с): тогда меняются цены и описание.
 * Уходящий слой гаснет быстрее и с ускорением, приходящий проявляется «прогревом».
 */
const leaving =
  "[[data-animate]_&]:transition-opacity [[data-animate]_&]:duration-150 [[data-animate]_&]:delay-(--engage) [[data-animate]_&]:ease-in";
const arriving =
  "[[data-animate]_&]:transition-opacity [[data-animate]_&]:duration-200 [[data-animate]_&]:delay-(--engage) [[data-animate]_&]:ease-warm";

/** Название услуги, марка продукта — акцентом. */
export function ServiceName({ name, brand, size = "row" }: { name: string; brand?: string; size?: PriceSize }) {
  return (
    <span className={`${sizes[size].name} leading-item font-medium`}>
      {name}
      {brand && <span className="text-accent"> {brand}</span>}
    </span>
  );
}

/** Цена строкой: «od» приглушённым, цифры моноширинные. */
export function Price({ parts, size = "row" }: { parts: PriceParts; size?: PriceSize }) {
  if (parts.kind === "individual") {
    return (
      <span className={`shrink-0 ${sizes[size].individual} leading-heading text-muted`}>{parts.text}</span>
    );
  }
  return (
    <span
      className={`shrink-0 ${sizes[size].amount} leading-heading font-medium whitespace-nowrap tabular-nums`}
    >
      {parts.prefix && <span className="font-normal text-muted">{parts.prefix}</span>}
      {parts.amount}
    </span>
  );
}

/*
 * Цена по классу лентами счётчика: когда передача встала, цифры прокручиваются к новой
 * цене, правая — первой. При XL цифры стоят на цене L и гаснут, проявляется
 * «indywidualnie». Глазу видны ленты, диктор слышит только текущую цену.
 */
export function RollingPrice({
  rolling,
  prices,
  selected,
  order,
  size = "row",
}: {
  rolling: Rolling;
  prices: Record<CarClass, PriceParts>;
  selected: CarClass;
  /** Номер строки сверху вниз: счётчики трогаются лёгкой волной. */
  order: number;
  size?: PriceSize;
}) {
  const parts = prices[selected];
  const individual = selected === "XL";
  const positions = rolling.positions[individual ? "L" : selected];
  // Сколько цифр правее колонки: правая лента трогается первой.
  const fromRight = rolling.columns.map(
    (_, i) => rolling.columns.slice(i + 1).filter((column) => column === "digit").length,
  );

  return (
    <span
      className={`grid shrink-0 justify-items-end ${sizes[size].amount} leading-heading font-medium whitespace-nowrap tabular-nums`}
    >
      <span
        aria-hidden="true"
        className={`col-start-1 row-start-1 inline-flex select-none ${individual ? `opacity-0 ${leaving}` : arriving}`}
      >
        {rolling.columns.map((column, i) => {
          if (column === "separator") return <span key={i}>{NBSP}</span>;
          return (
            <span key={i} className="inline-block h-[1lh] overflow-hidden">
              <span
                className="block [[data-animate]_&]:transition-transform [[data-animate]_&]:duration-[420ms] [[data-animate]_&]:delay-[calc(var(--engage)+var(--roll-delay))] [[data-animate]_&]:ease-warm"
                style={
                  {
                    transform: `translateY(calc(${-positions[i]} * 1lh))`,
                    "--roll-delay": `${fromRight[i] * 35 + order * 12}ms`,
                  } as CSSProperties
                }
              >
                {stripSymbols.map((symbol, s) => (
                  <span key={s} className="block h-[1lh] text-center">
                    {symbol}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
        {rolling.suffix}
      </span>
      {/* По центру строки цифр: мельче их, а прижатая кверху стояла бы выше названия */}
      <span
        aria-hidden="true"
        className={`col-start-1 row-start-1 self-center ${sizes[size].individual} font-normal text-muted select-none ${individual ? arriving : `opacity-0 ${leaving}`}`}
      >
        {prices.XL.kind === "individual" ? prices.XL.text : ""}
      </span>
      <span className="sr-only">{parts.kind === "amount" ? parts.amount : parts.text}</span>
    </span>
  );
}
