import { describe, expect, it } from "vitest";
import type { WeekHours } from "@/content/types";
import { groupHours, openStatus, warsawTime } from "@/lib/hours";

const day = { open: "10:00", close: "22:00" };
const saturday = { open: "10:00", close: "18:00" };
const week: WeekHours = [day, day, day, day, day, saturday, null];

const at = (dayIndex: number, time: string) => {
  const [h, m] = time.split(":").map(Number);
  return { day: dayIndex, minutes: h * 60 + m };
};

describe("warsawTime", () => {
  it("reads Warsaw time in summer (UTC+2)", () => {
    // среда, 7 октября 2026, 18:34 UTC
    expect(warsawTime(new Date("2026-10-07T18:34:00Z"))).toEqual(at(2, "20:34"));
  });

  it("reads Warsaw time in winter (UTC+1) and crosses midnight", () => {
    // воскресенье, 6 декабря 2026, 23:30 UTC — в Варшаве уже понедельник
    expect(warsawTime(new Date("2026-12-06T23:30:00Z"))).toEqual(at(0, "00:30"));
  });
});

describe("openStatus", () => {
  it("is open inside working hours", () => {
    expect(openStatus(week, at(2, "10:00"))).toEqual({ open: true, until: "22:00" });
    expect(openStatus(week, at(5, "17:59"))).toEqual({ open: true, until: "18:00" });
  });

  it("opens later today before opening time", () => {
    expect(openStatus(week, at(2, "08:15"))).toEqual({
      open: false,
      opens: { when: "today", at: "10:00" },
    });
  });

  it("opens tomorrow after closing time", () => {
    expect(openStatus(week, at(2, "22:00"))).toEqual({
      open: false,
      opens: { when: "tomorrow", at: "10:00" },
    });
  });

  it("skips a day off and names the weekday", () => {
    expect(openStatus(week, at(5, "19:00"))).toEqual({
      open: false,
      opens: { when: "day", day: 0, at: "10:00" },
    });
    expect(openStatus(week, at(6, "12:00"))).toEqual({
      open: false,
      opens: { when: "tomorrow", at: "10:00" },
    });
  });

  it("finds the same weekday next week when it is the only working day", () => {
    const once: WeekHours = [null, null, day, null, null, null, null];
    expect(openStatus(once, at(2, "23:00"))).toEqual({
      open: false,
      opens: { when: "day", day: 2, at: "10:00" },
    });
  });

  it("has nowhere to point when the studio never opens", () => {
    const never: WeekHours = [null, null, null, null, null, null, null];
    expect(openStatus(never, at(0, "12:00"))).toEqual({ open: false, opens: null });
  });
});

describe("groupHours", () => {
  it("merges neighbouring days with equal hours", () => {
    expect(groupHours(week)).toEqual([
      { from: 0, to: 4, hours: day },
      { from: 5, to: 5, hours: saturday },
      { from: 6, to: 6, hours: null },
    ]);
  });

  it("compares hours by value, not by reference", () => {
    const copies: WeekHours = [
      { open: "09:00", close: "17:00" },
      { open: "09:00", close: "17:00" },
      null,
      null,
      { open: "09:00", close: "17:00" },
      null,
      null,
    ];
    expect(groupHours(copies).map(({ from, to }) => [from, to])).toEqual([
      [0, 1],
      [2, 3],
      [4, 4],
      [5, 6],
    ]);
  });
});
