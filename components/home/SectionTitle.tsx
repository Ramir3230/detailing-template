import type { ReactNode } from "react";

/** H2 секции главной: 22 / 28, по центру на телефоне, слева на десктопе. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="display text-center text-22 leading-hero tracking-display lg:text-left lg:text-28">
      {children}
    </h2>
  );
}
