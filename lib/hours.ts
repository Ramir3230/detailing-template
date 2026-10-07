import type { DayHours, WeekHours } from "@/content/types";

/** День недели (0 — понедельник) и минуты от полуночи по варшавскому времени. */
export type WarsawTime = { day: number; minutes: number };

const weekdays: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

const warsawFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Warsaw",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Все студии в Польше: время посетителя не важно, важно время студии. */
export function warsawTime(date: Date): WarsawTime {
  const parts = Object.fromEntries(
    warsawFormat.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return {
    day: weekdays[parts.weekday],
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export type OpenStatus =
  | { open: true; until: string }
  | {
      open: false;
      /** null — у студии нет ни одного рабочего дня. */
      opens:
        | { when: "today" | "tomorrow"; at: string }
        | { when: "day"; day: number; at: string }
        | null;
    };

export function openStatus(hours: WeekHours, now: WarsawTime): OpenStatus {
  const today = hours[now.day];
  if (today && now.minutes < toMinutes(today.open)) {
    return { open: false, opens: { when: "today", at: today.open } };
  }
  if (today && now.minutes < toMinutes(today.close)) {
    return { open: true, until: today.close };
  }
  for (let ahead = 1; ahead <= 7; ahead++) {
    const day = (now.day + ahead) % 7;
    const next = hours[day];
    if (!next) continue;
    return {
      open: false,
      opens:
        ahead === 1 ? { when: "tomorrow", at: next.open } : { when: "day", day, at: next.open },
    };
  }
  return { open: false, opens: null };
}

/** Подряд идущие дни с одинаковыми часами — одной строкой: «Pn–pt 10:00–22:00». */
export type HoursRow = { from: number; to: number; hours: DayHours };

export function groupHours(hours: WeekHours): HoursRow[] {
  const rows: HoursRow[] = [];
  hours.forEach((day, index) => {
    const last = rows.at(-1);
    if (last && sameHours(last.hours, day)) last.to = index;
    else rows.push({ from: index, to: index, hours: day });
  });
  return rows;
}

function sameHours(a: DayHours, b: DayHours): boolean {
  return a === b || (a !== null && b !== null && a.open === b.open && a.close === b.close);
}
