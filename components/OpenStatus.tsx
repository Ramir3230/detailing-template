"use client";

import type { WeekHours } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";
import { glue } from "@/lib/format";
import { openStatus, type OpenStatus as Status } from "@/lib/hours";
import { fill, type Lang } from "@/lib/i18n";
import { useWarsawTime } from "@/lib/use-warsaw-time";

type Props = {
  hours: WeekHours;
  lang: Lang;
  words: Dictionary["status"];
  daysOn: Dictionary["days"]["on"];
  className?: string;
};

export function OpenStatus({ hours, lang, words, daysOn, className }: Props) {
  const now = useWarsawTime();
  if (!now) return null;

  const status = openStatus(hours, now);
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
