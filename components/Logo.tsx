import type { HTMLAttributes } from "react";
import { studio } from "@/content/studio";

/* Текст всегда — логотип из данных студии, своих детей у него нет */
type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & { unlit?: boolean };

/**
 * Логотип-заглушка надписью; размер задаёт место, где он стоит. unlit — погашенная
 * неоновая трубка: приглушённый, без свечения (hero до зажигания).
 */
export function Logo({ className = "", unlit = false, ...rest }: Props) {
  return (
    <span
      {...rest}
      className={`display leading-logo tracking-logo ${unlit ? "text-muted" : "neon-text"} ${className}`}
    >
      {studio.logo}
    </span>
  );
}
