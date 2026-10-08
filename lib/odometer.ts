import { NBSP } from "@/lib/format";

/*
 * Цена-счётчик (переключатель классов «коробка передач»): каждая цифра — лента
 * символов, которая прокручивается к нужному. Позиции на ленте: 0–9 — цифры,
 * 10 — пусто (у числа короче самого длинного в строке). Разделитель разрядов лентой
 * не крутится: он стоит на своём месте у всех классов и рисуется обычным пробелом.
 */
export const stripSymbols = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ""];
const blank = 10;

export type RollColumn = "digit" | "separator";

/** «1150 zł» → число «1150» и хвост « zł»; разрезаем по последнему неразрывному пробелу. */
export function splitAmount(amount: string): { number: string; suffix: string } {
  const cut = amount.lastIndexOf(NBSP);
  return cut === -1
    ? { number: amount, suffix: "" }
    : { number: amount.slice(0, cut), suffix: amount.slice(cut) };
}

/**
 * Колонки и позиции лент для чисел одной строки прайса, выровненных вправо. Null —
 * если числа лентами не показать: есть символы кроме цифр и разделителя (дробь) или
 * разделитель у разных классов стоит на разных местах (9800 и 12 000). Такая строка
 * меняет цену без прокрутки.
 */
export function rollColumns(
  numbers: readonly string[],
): { columns: RollColumn[]; positions: number[][] } | null {
  const width = Math.max(...numbers.map((number) => number.length));
  const padded = numbers.map((number) => number.padStart(width, " "));
  const columns: RollColumn[] = [];
  for (let i = 0; i < width; i++) {
    const symbols = padded.map((number) => number[i]).filter((symbol) => symbol !== " ");
    if (symbols.every((symbol) => symbol === NBSP)) columns.push("separator");
    else if (symbols.every((symbol) => symbol >= "0" && symbol <= "9")) columns.push("digit");
    else return null;
  }
  const positions = padded.map((number) =>
    number.split("").map((symbol) => (symbol >= "0" && symbol <= "9" ? Number(symbol) : blank)),
  );
  return { columns, positions };
}
