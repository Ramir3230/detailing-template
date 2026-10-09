import type { ReactNode } from "react";

/** H2 внутри страницы группы — до/после, частые вопросы: 20 / 24, слева. */
export function PageHeading({ children }: { children: ReactNode }) {
  return <h2 className="display text-20 leading-heading tracking-display lg:text-24">{children}</h2>;
}
