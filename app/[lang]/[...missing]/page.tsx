import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { notFoundSegment } from "@/lib/routing";
import { notFoundMetadata } from "@/lib/seo";

/*
 * Незнакомый адрес. Без этого маршрута он получал бы стандартную 404 Next — белую, на
 * английском, вне корневого layout. Здесь notFound() показывает app/[lang]/not-found.tsx:
 * в теме студии и на языке адреса. Конкретные маршруты Next выбирает раньше, чем этот.
 *
 * Собранный адрес — `/<язык>/404`: на него proxy.ts сразу ведёт незнакомый первый сегмент
 * (lib/routing.ts, notFoundPath). По запросу здесь рисуется только незнакомое под
 * известной страницей, вроде `/kontakt/x`.
 *
 * Как у страницы группы: Next дорисовывает адрес до конца и только потом отвечает — 404
 * уходит со статусом 404. С Cache Components маршруту нужен хотя бы один адрес для сборки.
 */
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return [{ missing: [notFoundSegment] }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[...missing]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return notFoundMetadata(lang);
}

export default function MissingPage(): never {
  notFound();
}
