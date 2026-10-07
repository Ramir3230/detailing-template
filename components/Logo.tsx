import { studio } from "@/content/studio";

/** Логотип-заглушка надписью; размер задаёт место, где он стоит. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`display neon-text leading-logo tracking-logo ${className}`}>
      {studio.logo}
    </span>
  );
}
