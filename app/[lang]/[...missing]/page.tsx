import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { notFoundMetadata } from "@/lib/seo";

/*
 * Незнакомый адрес. proxy.ts уводит в app/[lang] любой адрес, поэтому без этого маршрута
 * он не находил бы страницы и получал стандартную 404 Next — белую, на английском, вне
 * корневого layout. Здесь notFound() показывает app/[lang]/not-found.tsx: в теме студии и
 * на языке адреса. Конкретные маршруты Next выбирает раньше, чем этот.
 *
 * Как у страницы группы: Next дорисовывает адрес до конца и только потом отвечает — 404
 * уходит со статусом 404. С Cache Components маршруту нужен хотя бы один адрес для сборки.
 */
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return [{ missing: ["404"] }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[...missing]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return notFoundMetadata(lang);
}

export default function MissingPage(): never {
  notFound();
}
