import type { ReactNode } from "react";

/** H2 внутри страницы — до/после и вопросы группы, главы O nas: 20 / 24, слева. */
export function PageHeading({ children }: { children: ReactNode }) {
  return <h2 className="display text-20 leading-heading tracking-display lg:text-24">{children}</h2>;
}
