"use client";

/*
 * Встроенный скрипт, который исполняется из HTML сервера, ещё при разборе страницы — до
 * первой отрисовки и гидрации (node_modules/next/dist/docs/01-app/02-guides/
 * preventing-flash-before-hydration.md). Отрисованный в браузере — переходом или на
 * странице, которую Next рисует по данным, — он text/plain: вставленный скрипт браузер всё
 * равно не исполнит, а React в разработке предупреждал бы о нём. Разницу типов гасит
 * suppressHydrationWarning.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
