"use client";

import { useEffect } from "react";

/* Navigation API: в lib.dom TypeScript 5.9 его ещё нет */
type NavigateEvent = Event & { destination: { url: string; sameDocument: boolean } };
type WithNavigation = Window & { navigation?: EventTarget };

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
    let leavingByNavigation = false;
    // Safari восстанавливает прокрутку обновлённой страницы в самом конце загрузки, уже
    // после load: включённое раньше восстановление вернуло бы посетителя к старому месту
    const restore = () => {
      setTimeout(() => {
        restored = true;
        history.scrollRestoration = "auto";
      });
    };
    // Уход на другой документ — ссылкой (переключатель языка) или «Назад» и «Вперёд» — не
    // обновление: на нём восстановление не трогаем. Обновление события navigate не даёт.
    // Иначе «Назад» на эту страницу открыл бы hero, а WebKit, уходя «Назад», выключил бы
    // восстановление уже у шага, куда идёт. tel: и мессенджеры страницу не уводят. Без
    // Navigation API (Safari до 26.2) так остаётся только без кэша вкладки
    const navigate = (event: Event) => {
      const { destination } = event as NavigateEvent;
      if (!destination.sameDocument && /^https?:$/.test(new URL(destination.url).protocol)) {
        leavingByNavigation = true;
      }
    };
    // В кэш вкладки (bfcache) страница уходит вместе с прокруткой: при возврате она та же,
    // а обновление туда не попадает никогда
    const leave = (event: PageTransitionEvent) => {
      if (!location.hash && !event.persisted && !leavingByNavigation) history.scrollRestoration = "manual";
    };
    const { navigation } = window as WithNavigation;
    if (document.readyState === "complete") restore();
    else window.addEventListener("load", restore, { once: true });
    window.addEventListener("pagehide", leave);
    navigation?.addEventListener("navigate", navigate);
    return () => {
      window.removeEventListener("load", restore);
      window.removeEventListener("pagehide", leave);
      navigation?.removeEventListener("navigate", navigate);
      // Ушли на другую страницу сайта до конца загрузки: Next уже сделал шаг в истории, и
      // выключенное восстановление переехало бы на него и на следующие
      if (!restored) history.scrollRestoration = "auto";
    };
  }, []);

  return null;
}
