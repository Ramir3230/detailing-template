"use client";

import { useEffect } from "react";

/*
 * Обновлённая главная открывается с hero и зажиганием, а не там, где посетитель был
 * (решение владельца 10.10.2026). Восстановление прокрутки браузер берёт у шага истории,
 * с которого уходит страница: на уходе его выключаем, после загрузки включаем обратно. Всё
 * время, пока посетитель на главной, оно работает: «Назад» после «Sprawdź cenę» и со
 * страницы группы возвращает туда, где он был. С якорем в адресе (#cennik из Instagram и
 * Maps, «Usługi» в шапке) обновление — как у всех сайтов: адрес сам говорит, куда
 * смотреть, а без восстановления Chromium открыл бы hero, а Safari — блок якоря.
 */
export function ReloadAtHero() {
  useEffect(() => {
    // Safari восстанавливает прокрутку обновлённой страницы в самом конце загрузки, уже
    // после load: включённое раньше восстановление вернуло бы посетителя к старому месту
    const restore = () => {
      setTimeout(() => {
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
    };
  }, []);

  return null;
}
