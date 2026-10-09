import Link from "next/link";
import { CallButton } from "@/components/CallButton";
import { HeaderReveal } from "@/components/HeaderReveal";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { Menu } from "@/components/Menu";
import { Messengers } from "@/components/Messengers";
import { NavLink } from "@/components/NavLink";
import { OpenStatus } from "@/components/OpenStatus";
import { PhoneIcon } from "@/components/icons";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { telHref } from "@/lib/contact";
import { formatFrom, formatPhone, glue, lowestAmount } from "@/lib/format";
import { localePath, t, type Lang } from "@/lib/i18n";
import { groupPagesPath, groupPath, servicesPath, studioPages } from "@/lib/nav";

type Props = { lang: Lang; dict: Dictionary };

/*
 * Телефон и планшет: логотип и кнопка меню. Десктоп (от 1024): навигация, статус и
 * номер. На внутренних страницах шапка видна сразу; на главной до 1024 px ждёт, пока
 * уйдёт hero (HeaderReveal).
 */
export function Header({ lang, dict }: Props) {
  const status = (
    <OpenStatus hours={studio.hours} lang={lang} words={dict.status} daysOn={dict.days.on} />
  );

  return (
    <HeaderReveal>
      {/* Справа поле 12 px, а не 24: у круглой кнопки меню своё поле внутри */}
      <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between gap-10 pr-3 pl-6 lg:h-auto lg:min-h-header lg:px-8">
        <Link href={localePath(lang, "/")} className="flex min-h-11 items-center text-17 lg:text-20">
          <Logo />
        </Link>

        <nav aria-label={dict.header.mainNav} className="hidden gap-8 text-15 text-muted lg:flex">
          {[
            { key: "services" as const, path: servicesPath, currentOn: groupPagesPath },
            ...studioPages.map((page) => ({ ...page, currentOn: page.path })),
          ].map(({ key, path, currentOn }) => (
            <NavLink
              key={key}
              href={localePath(lang, path)}
              currentOn={currentOn}
              className="py-3 transition-colors hover:text-fg data-current:text-fg"
            >
              {dict.nav[key]}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-5 text-14 text-muted lg:flex">
          {status}
          <a
            href={telHref(studio.phone)}
            className="flex min-h-12 items-center gap-2 rounded-full border border-line-strong px-5 text-15 font-medium whitespace-nowrap text-fg transition-colors hover:border-accent-border"
          >
            <PhoneIcon size={16} />
            {formatPhone(studio.phone)}
          </a>
        </div>

        <Menu
          openLabel={dict.header.openMenu}
          closeLabel={dict.header.closeMenu}
          logo={<Logo className="text-18" />}
        >
          <nav aria-label={dict.header.mainNav} className="flex-1 px-6 pt-2">
            <p className="caps-label mb-1">{dict.menu.services}</p>
            {studio.services.map((group) => {
              const from = lowestAmount(group.services);
              return (
                <NavLink
                  key={group.slug}
                  href={localePath(lang, groupPath(group))}
                  currentOn={groupPath(group)}
                  className="flex min-h-13 items-center justify-between gap-3 border-t border-line text-20 font-medium"
                >
                  {glue(t(group.name, lang), lang)}
                  {from !== null && (
                    <span className="text-14 font-normal whitespace-nowrap text-muted">
                      {formatFrom(from, dict.price)}
                    </span>
                  )}
                </NavLink>
              );
            })}
            <p className="caps-label mt-6 mb-1">{dict.menu.studio}</p>
            {studioPages.map(({ key, path }) => (
              <Link
                key={key}
                href={localePath(lang, path)}
                className="flex min-h-12 items-center border-t border-line text-20 font-medium"
              >
                {dict.nav[key]}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 px-6 pt-6 pb-6">
            <p className="text-center text-14 text-muted">{status}</p>
            <CallButton dict={dict} />
            <Messengers dict={dict} variant="menu" />
            {studio.languages.length > 1 && (
              <div className="mt-1 flex justify-center text-13 text-muted">
                <LangSwitch lang={lang} words={dict.language} />
              </div>
            )}
          </div>
        </Menu>
      </div>
    </HeaderReveal>
  );
}
