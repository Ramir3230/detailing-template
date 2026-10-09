import { useSyncExternalStore } from "react";

/* Десктоп DESIGN.md — от 1024 px; тот же запрос у меню (components/Menu.tsx). */
const desktopQuery = "(width >= 64rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Шире ли экран 1024 px. На сервере и при гидрации — нет: раскладка телефона первой. */
export function useDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(desktopQuery).matches,
    () => false,
  );
}
