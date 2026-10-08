import { NBSP } from "@/lib/format";

/*
 * Цена-счётчик (переключатель классов «коробка передач»): каждая позиция числа — лента
 * символов, которая прокручивается к нужному. Позиции на ленте: 0–9 — цифры,
 * 10 — разделитель разрядов, 11 — пусто (у числа короче самого длинного в строке).
 */
export const stripSymbols = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", NBSP, ""];
const separator = 10;
const blank = 11;

/** «1150 zł» → число «1150» и хвост « zł»; разрезаем по последнему неразрывному пробелу. */
export function splitAmount(amount: string): { number: string; suffix: string } {
  const cut = amount.lastIndexOf(NBSP);
  return cut === -1
    ? { number: amount, suffix: "" }
    : { number: amount.slice(0, cut), suffix: amount.slice(cut) };
}

/** Позиции лент для числа, выровненного вправо по ширине самого длинного числа строки. */
export function stripPositions(number: string, width: number): number[] {
  return number
    .padStart(width, " ")
    .split("")
    .map((symbol) => (symbol === " " ? blank : symbol === NBSP ? separator : Number(symbol)));
}
