"use client";

import type { MouseEvent, ReactNode } from "react";

type Props = { target: string; className: string; children: ReactNode };

/*
 * Ссылка к блоку этой же страницы, которая не оставляет якорь в адресе. С якорем
 * обновление страницы или повторное открытие из истории сразу уводили бы к блоку, мимо
 * hero. Плавность и её отключение при reduced motion задаёт CSS (scroll-behavior), отступ
 * под шапку — scroll-margin блока. Без JS и при открытии в новой вкладке — обычный якорь.
 */
export function ScrollLink({ target, className, children }: Props) {
  function scroll(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const element = document.getElementById(target);
    if (!element) return;
    event.preventDefault();
    element.scrollIntoView();
  }

  return (
    <a href={`#${target}`} onClick={scroll} className={className}>
      {children}
    </a>
  );
}
