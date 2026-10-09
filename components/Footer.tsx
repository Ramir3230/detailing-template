import { cacheLife } from "next/cache";
import Link from "next/link";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { formatDayRange, formatTimeRange, glue } from "@/lib/format";
import { groupHours } from "@/lib/hours";
import { localePath, t, type Lang } from "@/lib/i18n";
import { groupPath, studioPages } from "@/lib/nav";

type Props = { lang: Lang; dict: Dictionary };

/* Год для «©» вычисляется при сборке и раз в сутки обновляется: страница статичная. */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const linkClass = "flex min-h-11 items-center text-15";

export async function Footer({ lang, dict }: Props) {
  const year = await currentYear();

  return (
    <footer className="border-t border-line pt-10 pb-8 lg:pt-16">
      <div className="wrap">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-10">
          <div className="col-span-2 lg:col-span-1">
            <Logo className="text-18 lg:text-20" />
            <p className="mt-2 text-14 text-muted lg:mt-3 lg:text-15">
              {t(studio.tagline, lang)}
              <span className="lg:hidden"> · {studio.address.area}</span>
              <span className="hidden lg:block">
                {studio.address.street},{" "}
                <span className="whitespace-nowrap">{studio.address.area}</span>
              </span>
            </p>
          </div>

          <nav aria-label={dict.footer.services}>
            <p className="caps-label mb-1">{dict.footer.services}</p>
            {studio.services.map((group) => (
              <NavLink
                key={group.slug}
                href={localePath(lang, groupPath(group))}
                currentOn={groupPath(group)}
                className={`${linkClass} data-current:text-accent`}
              >
                {glue(t(group.name, lang), lang)}
              </NavLink>
            ))}
          </nav>

          <nav aria-label={dict.footer.studio}>
            <p className="caps-label mb-1">{dict.footer.studio}</p>
            {studioPages.map(({ key, path }) => (
              <Link key={key} href={localePath(lang, path)} className={linkClass}>
                {dict.nav[key]}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:block">
            <p className="caps-label mb-3">{dict.hours.title}</p>
            <dl className="text-15 leading-hours">
              {groupHours(studio.hours).map(({ from, to, hours }) => (
                <div key={from} className={`flex gap-2 ${hours ? "" : "text-muted"}`}>
                  <dt>{formatDayRange(from, to, dict.days.short, lang)}</dt>
                  <dd>{hours ? formatTimeRange(hours) : dict.hours.closed}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-13 text-muted lg:mt-12">
          <span>
            © {year} {studio.name}
          </span>
          {studio.languages.length > 1 && <LangSwitch lang={lang} words={dict.language} />}
        </div>
      </div>
    </footer>
  );
}
