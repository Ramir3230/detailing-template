"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";

type Props = {
  openLabel: string;
  closeLabel: string;
  logo: ReactNode;
  children: ReactNode;
};

/*
 * Меню на весь экран для телефона и планшета. Модальный <dialog> сам закрывается по
 * Esc и делает страницу под собой недоступной для фокуса и диктора; прокрутку фона
 * гасит app/globals.css. Фокус при открытии — на «закрыть», при закрытии — обратно
 * на кнопку меню.
 */
export function Menu({ openLabel, closeLabel, logo, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const closer = useRef<HTMLButtonElement>(null);

  function open() {
    dialog.current?.showModal();
    closer.current?.focus();
  }

  function close() {
    dialog.current?.close();
  }

  // Переход по ссылке внутри меню — к блоку той же страницы или на другую: меню закрываем.
  function closeOnLink(event: MouseEvent<HTMLDialogElement>) {
    if ((event.target as Element).closest("a")) close();
  }

  return (
    <>
      <button
        ref={opener}
        type="button"
        aria-label={openLabel}
        aria-haspopup="dialog"
        onClick={open}
        className="grid size-11 place-items-center rounded-full border border-line-strong transition-colors hover:border-accent-border lg:hidden"
      >
        <MenuIcon />
      </button>
      <dialog
        ref={dialog}
        aria-label={openLabel}
        onClick={closeOnLink}
        onClose={() => opener.current?.focus()}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto border-0 bg-bg p-0 text-fg backdrop:bg-bg"
      >
        <div className="glow-top flex min-h-full flex-col">
          <div className="flex h-19 shrink-0 items-center justify-between pr-4 pl-6">
            {logo}
            <button
              ref={closer}
              type="button"
              aria-label={closeLabel}
              onClick={close}
              className="grid size-11 place-items-center rounded-full border border-line-strong transition-colors hover:border-accent-border"
            >
              <CloseIcon />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
