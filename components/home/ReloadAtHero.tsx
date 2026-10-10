"use client";

import { useEffect } from "react";

/*
 * Обновлённая главная открывается с hero и зажиганием, а не там, где посетитель был
 * (решение владельца 10.10.2026). Восстановление прокрутки браузер берёт у шага истории,
 * с которого уходит страница: на уходе его выключаем, на показе включаем обратно. Всё
 * время, пока посетитель на главной, оно работает: «Назад» после «Sprawdź cenę» и со
 * страницы группы возвращает туда, где он был. С якорем в адресе (#cennik из Instagram и
 * Maps, «Usługi» в шапке) обновление — как у всех сайтов: адрес сам говорит, куда
 * смотреть, а без восстановления Chromium открыл бы hero, а Safari — блок якоря.
 */
export function ReloadAtHero() {
  useEffect(() => {
    const restore = () => {
      history.scrollRestoration = "auto";
    };
    const leave = () => {
      if (!location.hash) history.scrollRestoration = "manual";
    };
    restore();
    // Возврат из кэша вкладки (bfcache) не перемонтирует страницу — только pageshow
    window.addEventListener("pageshow", restore);
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pageshow", restore);
      window.removeEventListener("pagehide", leave);
    };
  }, []);

  return null;
}
