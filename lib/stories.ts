/** Сколько отзыв стоит на экране: успеть прочитать, но в пределах 6–14 с (DESIGN.md). */
export function storyDuration(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.min(14_000, Math.max(6_000, 4_500 + words * 220));
}
