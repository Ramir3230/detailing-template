"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useHeroInView } from "@/lib/use-in-view";

/*
 * Рамка шапки. До 1024 px шапка липнет к верху стеклом, а на главной ждёт, пока hero
 * целиком уйдёт с экрана, и тогда выезжает сверху; hero вернулся — уезжает (DESIGN.md,
 * «Hero и шапка»). Спрятанное состояние задаёт CSS по наличию hero на странице, поэтому
 * до гидрации шапка не мелькает. Уход быстрее появления и идёт ускорением.
 * Шапка живёт в layout и переживает переход между страницами: наблюдение перезапускается
 * со сменой адреса. Ушедшую главную Next держит в DOM скрытой — её hero не в счёт ни для
 * CSS (data-hidden), ни для наблюдения (у скрытого элемента нет размеров).
 */
export function HeaderReveal({ children }: { children: ReactNode }) {
  const heroVisible = useHeroInView(usePathname());

  return (
    <header
      data-shown={heroVisible ? undefined : ""}
      className="glass sticky top-0 z-20 border-b border-line transition-[translate,visibility] duration-200 ease-in data-shown:duration-300 data-shown:ease-warm max-lg:with-hero:invisible max-lg:with-hero:fixed max-lg:with-hero:inset-x-0 max-lg:with-hero:-translate-y-full data-shown:visible data-shown:translate-y-0 lg:static"
    >
      {children}
    </header>
  );
}
