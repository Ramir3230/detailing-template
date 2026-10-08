import { studio } from "@/content/studio";

/**
 * Логотип-заглушка надписью; размер задаёт место, где он стоит. unlit — погашенная
 * неоновая трубка: приглушённый, без свечения (hero до зажигания).
 */
export function Logo({ className = "", unlit = false }: { className?: string; unlit?: boolean }) {
  return (
    <span
      className={`display leading-logo tracking-logo ${unlit ? "text-muted" : "neon-text"} ${className}`}
    >
      {studio.logo}
    </span>
  );
}
