import { CallButton } from "@/components/CallButton";
import { HoursList } from "@/components/home/HoursList";
import { SectionTitle } from "@/components/home/SectionTitle";
import { ArrowIcon } from "@/components/icons";
import { Messengers } from "@/components/Messengers";
import { OpenStatus } from "@/components/OpenStatus";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { formatDayRange, formatTimeRange } from "@/lib/format";
import { groupHours } from "@/lib/hours";
import type { Lang } from "@/lib/i18n";
import { sectionIds } from "@/lib/nav";

/*
 * Контакты главной. Телефон — одна колонка, как на холсте. Десктоп — две: слева
 * заголовок, статус и адрес, справа часы, звонок и мессенджеры. Фото входа появится
 * вместе с кадром (ROADMAP, 3c): тогда оно встанет слева, как на холсте.
 */
export function Contact({ lang, dict }: { lang: Lang; dict: Dictionary }) {
  const { address } = studio;
  const rows = groupHours(studio.hours).map(({ from, to, hours }) => ({
    from,
    to,
    days: formatDayRange(from, to, dict.days.long, lang, " – "),
    time: hours ? formatTimeRange(hours) : dict.hours.closed,
  }));

  return (
    <section
      id={sectionIds.contact}
      className="scroll-mt-16 py-14 lg:scroll-mt-0 lg:border-t lg:border-line lg:py-24"
    >
      <div className="wrap lg:flex lg:flex-wrap lg:items-start lg:gap-x-20 lg:gap-y-12">
        <div className="lg:max-w-95 lg:flex-[1_1_300px]">
          <SectionTitle>{dict.contact.title}</SectionTitle>
          <p className="mt-3 min-h-6 text-center lg:mt-4 lg:text-left">
            <OpenStatus
              hours={studio.hours}
              lang={lang}
              words={dict.status}
              daysOn={dict.days.on}
              className="text-muted"
            />
          </p>
          <div className="mt-6 flex items-center justify-between gap-4 lg:mt-7">
            <address className="flex flex-col not-italic lg:text-17">
              <span>{address.street}</span>
              <span className="text-muted">{address.area}</span>
            </address>
            {address.routeUrl && (
              <a
                href={address.routeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border border-line-strong px-4 text-15 font-medium transition-colors hover:border-accent-border"
              >
                {dict.contact.route}
                <span className="sr-only"> ({dict.newTab})</span>
                <ArrowIcon size={16} />
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 lg:mt-0 lg:min-w-0 lg:flex-[999_1_560px]">
          <HoursList rows={rows} todayLabel={dict.hours.today} />
          <CallButton dict={dict} className="mt-6 lg:inline-flex lg:w-auto lg:px-7" />
          <Messengers dict={dict} variant="contact" className="mt-3" />
        </div>
      </div>
    </section>
  );
}
