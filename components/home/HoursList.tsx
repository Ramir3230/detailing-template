"use client";

import { useWarsawTime } from "@/lib/use-warsaw-time";

export type HoursRowView = { from: number; to: number; days: string; time: string };

/*
 * Часы с подсвеченным сегодняшним днём по варшавскому времени. Какой день сегодня,
 * знает только браузер: до гидрации все строки приглушены, метки «dziś» нет.
 */
export function HoursList({ rows, todayLabel }: { rows: HoursRowView[]; todayLabel: string }) {
  const now = useWarsawTime();

  return (
    <dl className="border-y border-line">
      {rows.map((row) => {
        const today = now !== null && now.day >= row.from && now.day <= row.to;
        return (
          <div
            key={row.from}
            className="flex items-center justify-between gap-4 border-line py-3 not-first:border-t"
          >
            <dt className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${today ? "" : "text-muted"}`}>
              {row.days}
              {today && (
                <span className="rounded-full border border-accent-mark px-2 text-13 text-accent">
                  {todayLabel}
                </span>
              )}
            </dt>
            <dd className={`whitespace-nowrap ${today ? "font-medium" : "text-muted"}`}>{row.time}</dd>
          </div>
        );
      })}
    </dl>
  );
}
