import type { Price, RimSize, Service } from "@/content/types";

/*
 * Цена за колесо по размеру диска — шиномонтаж (DESIGN.md, «Прайс»). Прайс главной
 * выбирает размер переключателем над группой, остальные места показывают «od» самой
 * низкой.
 */

export type RimPrice = Extract<Price, { kind: "byRim" }>;

/** Колёс в комплекте: строка «komplet» под ценой за колесо. */
export const RIM_SET = 4;

/** Больше размеров рядом с колесом на 375 не встаёт: шестая кнопка была бы уже 44 px. */
export const RIMS_MAX = 5;

export const inches = (size: RimSize) => Number(size.slice(1));

/** Размеры и цены по возрастанию диска. */
export function rimAmounts(price: RimPrice): { size: RimSize; amount: number }[] {
  return (Object.entries(price.rims) as [RimSize, number | undefined][])
    .flatMap(([size, amount]) => (amount === undefined ? [] : [{ size, amount }]))
    .sort((a, b) => inches(a.size) - inches(b.size));
}

/** Размеры переключателя группы — у всех её услуг по диску одни (тест данных); нет таких — null. */
export function groupRims(services: readonly Service[]): RimSize[] | null {
  const priced = services.find((service): service is Service & { price: RimPrice } => service.price.kind === "byRim");
  return priced ? rimAmounts(priced.price).map(({ size }) => size) : null;
}

/** Размер по умолчанию — средний: как класс M, самый ходовой. */
export const defaultRim = (count: number) => Math.floor((count - 1) / 2);

/**
 * Обод в кадре колеса — доля внешнего диаметра шины. Шина одна и та же: с диском растёт
 * обод, а профиль тоньше, как в жизни. Доля — по ряду размеров студии, от половины до 0,8:
 * настоящая разница R15 и R19 на колесе в 48 px едва видна.
 */
export function rimFraction(size: RimSize, sizes: readonly RimSize[]): number {
  const [smallest, largest] = [inches(sizes[0]), inches(sizes[sizes.length - 1])];
  return 0.5 + (0.3 * (inches(size) - smallest)) / (largest - smallest);
}
