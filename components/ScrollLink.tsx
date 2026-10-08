"use client";

import type { MouseEvent, ReactNode } from "react";

type Props = { target: string; className: string; children: ReactNode };

/*
 * Ссылка к блоку этой же страницы, которая не оставляет якорь в адресе. С якорем
 * повторное открытие адреса (из истории, закладки, присланной ссылки) сразу уводило бы к
 * блоку, мимо hero. Остальное — как у якоря: шаг в истории («Назад» возвращает к hero),
 * фокус на блоке (Tab и экранный диктор продолжают с него; блоку нужен tabIndex={-1}).
 * Плавность и её отключение при reduced motion задаёт CSS (scroll-behavior), отступ под
 * шапку — scroll-margin блока. Без JS и при открытии в новой вкладке — обычный якорь.
 */
export function ScrollLink({ target, className, children }: Props) {
  function scroll(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const element = document.getElementById(target);
    if (!element) return;
    event.preventDefault();
    // Сначала шаг в истории: браузер запоминает прокрутку прежнего шага — hero
    history.pushState(history.state, "", location.pathname + location.search);
    element.scrollIntoView();
    element.focus({ preventScroll: true });
  }

  return (
    <a href={`#${target}`} onClick={scroll} className={className}>
      {children}
    </a>
  );
}
