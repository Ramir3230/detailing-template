"use client";

import { useSyncExternalStore } from "react";
import type { WeekHours } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";
import { glue } from "@/lib/format";
import { openStatus, warsawTime, type OpenStatus as Status } from "@/lib/hours";
import { fill, type Lang } from "@/lib/i18n";

/*
 * Статус зависит от момента, а страница собирается заранее. Поэтому на сервере и при
 * гидрации его нет вовсе (снимок сервера — null), а время читается только в браузере:
 * так разметка сервера и клиента не расходится. Дальше статус сверяется раз в 30 с.
 */
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 30_000);
  return () => clearInterval(timer);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);
const noTimeOnServer = () => null;

type Props = {
  hours: WeekHours;
  lang: Lang;
  words: Dictionary["status"];
  daysOn: Dictionary["days"]["on"];
  className?: string;
};

export function OpenStatus({ hours, lang, words, daysOn, className }: Props) {
  const minute = useSyncExternalStore(subscribe, currentMinute, noTimeOnServer);
  if (minute === null) return null;

  const status = openStatus(hours, warsawTime(new Date(minute * 60_000)));
  const detail = describe(status, words, daysOn);

  return (
    <span className={className}>
      {status.open && <span aria-hidden="true" className="status-dot mr-2 align-middle" />}
      <span className="font-medium text-fg">{status.open ? words.open : words.closed}</span>
      {detail && (
        <>
          {" "}
          <span aria-hidden="true">·</span> {glue(detail, lang)}
        </>
      )}
    </span>
  );
}

function describe(
  status: Status,
  words: Dictionary["status"],
  daysOn: Dictionary["days"]["on"],
): string | null {
  if (status.open) return fill(words.until, { time: status.until });
  const { opens } = status;
  if (!opens) return null;
  switch (opens.when) {
    case "today":
      return fill(words.opensToday, { time: opens.at });
    case "tomorrow":
      return fill(words.opensTomorrow, { time: opens.at });
    case "day":
      return fill(words.opensOn, { day: daysOn[opens.day], time: opens.at });
  }
}
