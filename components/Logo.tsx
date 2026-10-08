import type { HTMLAttributes } from "react";
import { studio } from "@/content/studio";

type Props = HTMLAttributes<HTMLSpanElement> & { unlit?: boolean };

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
