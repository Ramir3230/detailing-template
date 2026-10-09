import Image from "next/image";
import type { ReactNode } from "react";
import { CallButton } from "@/components/CallButton";
import { HoursList } from "@/components/home/HoursList";
import { ArrowIcon } from "@/components/icons";
import { Messengers } from "@/components/Messengers";
import { OpenStatus } from "@/components/OpenStatus";
import { studio } from "@/content/studio";
import type { Photo } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";
import { formatDayRange, formatTimeRange } from "@/lib/format";
import { frameSizes } from "@/lib/frame";
import { groupHours } from "@/lib/hours";
import { t, type Lang } from "@/lib/i18n";
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
};

/*
 * Контакты — одни на главной и на странице Kontakt. Телефон — одна колонка, как на
 * холсте: фото входа под заголовком. Десктоп с фото — фото слева, всё остальное справа
 * по центру его высоты. Без фото две колонки: слева заголовок и адрес, справа часы,
 * звонок и мессенджеры.
 */
export function ContactDetails({ lang, dict, heading, photoLoading = "lazy" }: Props) {
  const { address } = studio;
  const rows = groupHours(studio.hours).map(({ from, to, hours }) => ({
    from,
    to,
    days: formatDayRange(from, to, dict.days.long, lang, " – "),
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

  return address.photo ? (
    <div className="wrap lg:grid lg:grid-cols-[minmax(0,520px)_minmax(0,520px)] lg:grid-rows-[1fr_auto_auto_auto_1fr] lg:gap-x-20">
      {heading && <div className="lg:col-start-2 lg:row-start-2">{heading}</div>}
      <EntrancePhoto
        photo={address.photo}
        lang={lang}
        caption={dict.contact.photoExample}
        loading={photoLoading}
        className={`${after} lg:col-start-1 lg:row-span-full lg:mt-0 lg:self-center`}
      />
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
    <p className={`min-h-6 ${className}`}>
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

/* Вход в студию 4:5: на телефоне во всю ширину, на десктопе до 520 px. */
function EntrancePhoto({
  photo,
  lang,
  caption,
  loading,
  className,
}: {
  photo: Photo;
  lang: Lang;
  caption: string;
  loading: "lazy" | "eager";
  className: string;
}) {
  return (
    <figure className={className}>
      <Image
        src={photo.src}
        width={photo.width}
        height={photo.height}
        alt={t(photo.alt, lang)}
        sizes={frameSizes}
        loading={loading}
        className="aspect-[4/5] w-full rounded-card bg-surface object-cover lg:rounded-card-lg"
      />
      {photo.ai && <figcaption className="mt-2 text-12 leading-body text-muted">{caption}</figcaption>}
    </figure>
  );
}
