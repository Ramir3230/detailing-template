"use client";

import { useEffect } from "react";

/*
 * Обновлённая главная открывается с hero и зажиганием, а не там, где посетитель был
 * (решение владельца 10.10.2026). Восстановление прокрутки браузер берёт у шага истории,
 * с которого уходит страница: на уходе его выключаем, после загрузки включаем обратно. С
 * загрузки и до ухода оно работает: «Назад» после «Sprawdź cenę» и со страницы группы
 * возвращает туда, где посетитель был. С якорем в адресе (#cennik из Instagram и
 * Maps, «Usługi» в шапке) обновление — как у всех сайтов: адрес сам говорит, куда
 * смотреть, а без восстановления Chromium открыл бы hero, а Safari — блок якоря.
 */
export function ReloadAtHero() {
  useEffect(() => {
    let restored = false;
    // Safari восстанавливает прокрутку обновлённой страницы в самом конце загрузки, уже
    // после load: включённое раньше восстановление вернуло бы посетителя к старому месту
    const restore = () => {
      setTimeout(() => {
        restored = true;
        history.scrollRestoration = "auto";
      });
    };
    // В кэш вкладки (bfcache) страница уходит вместе с прокруткой: при возврате она та же,
    // а обновление туда не попадает никогда
    const leave = (event: PageTransitionEvent) => {
      if (!location.hash && !event.persisted) history.scrollRestoration = "manual";
    };
    if (document.readyState === "complete") restore();
    else window.addEventListener("load", restore, { once: true });
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("load", restore);
      window.removeEventListener("pagehide", leave);
      // Ушли на другую страницу сайта до конца загрузки: Next уже сделал шаг в истории, и
      // выключенное восстановление переехало бы на него и на следующие
      if (!restored) history.scrollRestoration = "auto";
    };
  }, []);

  return null;
}
