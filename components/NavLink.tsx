"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { stripLang } from "@/lib/i18n";

type Props = {
  href: string;
  /** Адрес без языка, на котором ссылка — текущая страница, а под которым — текущий раздел. */
  currentOn: string;
  className: string;
  children: ReactNode;
};

/**
 * Ссылка навигации, которая знает, что посетитель уже здесь: на холсте подвал красит
 * текущую группу акцентом, а шапка десктопа — пункт «Usługi» на странице группы; в меню
 * вид не меняется. Диктор везде слышит «текущая страница» или «текущий раздел»; вид
 * задаёт `data-current:`.
 */
export function NavLink({ href, currentOn, className, children }: Props) {
  const path = stripLang(usePathname());
  const current = path === currentOn ? "page" : path.startsWith(`${currentOn}/`) ? "true" : undefined;

  return (
    <Link
      href={href}
      aria-current={current}
      data-current={current ? "" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}
