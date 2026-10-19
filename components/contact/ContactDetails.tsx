import type { ReactNode } from "react";
import { CallButton } from "@/components/CallButton";
import { ContactMap } from "@/components/contact/ContactMap";
import { HoursList } from "@/components/contact/HoursList";
import { FramePhoto } from "@/components/FramePhoto";
import { ArrowIcon } from "@/components/icons";
import { Messengers } from "@/components/Messengers";
import { OpenStatus } from "@/components/OpenStatus";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { addressLine } from "@/lib/contact";
import { formatDayRange, formatTimeRange } from "@/lib/format";
import { groupHours } from "@/lib/hours";
import { fill, type Lang } from "@/lib/i18n";
import { sectionIds } from "@/lib/nav";

type Props = {
  lang: Lang;
  dict: Dictionary;
  /** Заголовок со статусом внутри блока — на главной; на странице Kontakt они над картой. */
  heading?: ReactNode;
  /**
   * На главной фото входа далеко внизу и грузится лениво; на странице Kontakt оно на
   * первом экране телефона — самый крупный кадр, ждать прокрутки ему незачем.
   */
  photoLoading?: "lazy" | "eager";
  /**
   * Без фото входа — карта на его месте (DESIGN.md, «Контакты»): на главной. На странице
   * Kontakt карта уже стоит над блоком, второй там не нужно.
   */
  mapInPlace?: boolean;
};

/*
 * Контакты — одни на главной и на странице Kontakt. Телефон — одна колонка, как на
 * холсте: фото входа под заголовком. Десктоп с фото — фото до 520 слева, всё остальное
 * справа, до 536, по центру его высоты: 520, 80 и 536 — ровно контейнер, правый край на
 * линии прайса и до/после, как у ComparePairs. Карта на месте фото стоит так же. Без фото
 * и карты две колонки: слева заголовок и адрес, справа часы, звонок и мессенджеры.
 */
export function ContactDetails({ lang, dict, heading, photoLoading = "lazy", mapInPlace = false }: Props) {
  const { address } = studio;
  const rows = groupHours(studio.hours).map(({ from, to, hours }) => ({
    from,
    to,
    days: {
      long: formatDayRange(from, to, dict.days.long, lang, " – "),
      short: formatDayRange(from, to, dict.days.short, lang, " – "),
    },
    time: hours ? formatTimeRange(hours) : dict.hours.closed,
  }));

  const place = (
    <div className="flex items-center justify-between gap-4">
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
  );
  const reach = (
    <>
      <HoursList rows={rows} todayLabel={dict.hours.today} />
      <div id={sectionIds.contactCall} className="mt-6">
        <CallButton dict={dict} className="lg:inline-flex lg:w-auto lg:px-7" />
      </div>
      <Messengers dict={dict} variant="contact" className="mt-3" />
    </>
  );

  // Без заголовка блок начинается сразу с фото или адреса: отступ сверху ему не нужен
  const after = heading ? "mt-6" : "";
  const frame = `${after} lg:col-start-1 lg:row-span-full lg:mt-0 lg:self-center`;
  const media = address.photo ? (
    <FramePhoto photo={address.photo} lang={lang} caption={dict.photoExample} loading={photoLoading} className={frame} />
  ) : mapInPlace && address.map ? (
    <ContactMap
      map={address.map}
      label={fill(dict.contactPage.map, { address: addressLine(address) })}
      routeUrl={address.routeUrl}
      dict={dict}
      frame
      className={frame}
    />
  ) : null;

  return media ? (
    <div className="wrap lg:grid lg:grid-cols-[minmax(0,520px)_minmax(0,536px)] lg:grid-rows-[1fr_auto_auto_auto_1fr] lg:gap-x-20">
      {heading && <div className="lg:col-start-2 lg:row-start-2">{heading}</div>}
      {media}
      <div className={`mt-4 lg:col-start-2 lg:row-start-3 ${heading ? "lg:mt-7" : "lg:mt-0"}`}>
        {place}
      </div>
      <div className="mt-6 lg:col-start-2 lg:row-start-4 lg:mt-7">{reach}</div>
    </div>
  ) : (
    <div className="wrap lg:flex lg:flex-wrap lg:items-start lg:gap-x-20 lg:gap-y-12">
      <div className="lg:max-w-95 lg:flex-[1_1_300px]">
        {heading}
        <div className={`${after} ${heading ? "lg:mt-7" : ""}`}>{place}</div>
      </div>
      <div className="mt-6 lg:mt-0 lg:min-w-0 lg:flex-[999_1_560px]">{reach}</div>
    </div>
  );
}

/* Статус «otwarte / zamknięte» под заголовком контактов: на главной и на странице Kontakt. */
export function ContactStatus({ lang, dict, className }: { lang: Lang; dict: Dictionary; className: string }) {
  return (
    // Статус появляется только в браузере: место — на строку своего кегля (16 / 18)
    <p className={`min-h-lh ${className}`}>
      <OpenStatus
        hours={studio.hours}
        lang={lang}
        words={dict.status}
        daysOn={dict.days.on}
        className="text-muted"
      />
    </p>
  );
}
