import { describe, expect, it } from "vitest";
import type { ServiceGroup } from "@/content/types";
import { pl } from "@/dictionaries/pl";
import { ru } from "@/dictionaries/ru";
import { parseCarClass } from "@/lib/car-class";
import { priceList } from "@/lib/price-list";
import { storyDuration } from "@/lib/stories";

const groups: ServiceGroup[] = [
  {
    slug: "mycie-i-szyby",
    name: { pl: "Mycie i szyby", ru: "Мойка и стёкла" },
    services: [
      {
        name: { pl: "Mycie nadwozia" },
        price: { kind: "byClass", S: 200, M: 220, L: 250 },
        duration: { unit: "hour", min: 2, max: 3 },
      },
      {
        name: { pl: "Powłoka" },
        brand: "GYEON",
        note: { pl: "Wszystkie klasy" },
        price: { kind: "fixed", amount: 300 },
      },
    ],
  },
];

describe("priceList", () => {
  it("formats every class in advance", () => {
    const [group] = priceList(groups, "pl", pl);
    expect(group.rows[0].prices).toEqual({
      S: { kind: "amount", amount: "200\u00A0zł" },
      M: { kind: "amount", amount: "220\u00A0zł" },
      L: { kind: "amount", amount: "250\u00A0zł" },
      XL: { kind: "individual", text: "indywidualnie" },
    });
    expect(group.rows[1].prices.XL).toEqual({ kind: "amount", amount: "300\u00A0zł" });
  });

  it("links a group to its page in the page language, once it has one", () => {
    const withPage: ServiceGroup[] = [{ ...groups[0], slug: "lakier", intro: { pl: "Korekta usuwa rysy." } }];
    expect(priceList(withPage, "pl", pl)[0].page).toBe("/uslugi/lakier");
    expect(priceList(withPage, "ru", pl)[0].page).toBe("/ru/uslugi/lakier");
    expect(priceList(groups, "pl", pl)[0].page).toBeUndefined();
  });

  it("puts texts in the page language and glues short words", () => {
    expect(priceList(groups, "pl", pl)[0].name).toBe("Mycie i\u00A0szyby");
    expect(priceList(groups, "ru", pl)[0].name).toBe("Мойка и\u00A0стёкла");
  });

  it("prepares counter strips only for prices by class", () => {
    const [group] = priceList(groups, "pl", pl);
    expect(group.rows[0].rolling?.positions).toEqual({ S: [2, 0, 0], M: [2, 2, 0], L: [2, 5, 0] });
    expect(group.rows[0].rolling?.suffix).toBe("\u00A0zł");
    expect(group.rows[1].rolling).toBeUndefined();
  });

  it("formats the duration in the page language, one for all classes", () => {
    const [group] = priceList(groups, "pl", pl);
    expect(group.rows[0].duration).toBe("2–3 godziny");
    expect(priceList(groups, "ru", ru)[0].rows[0].duration).toBe("2–3 часа");
    expect(group.rows[1].duration).toBeUndefined();
  });

  it("keeps brand and note only where they exist", () => {
    const [group] = priceList(groups, "pl", pl);
    expect(group.rows[0]).not.toHaveProperty("brand", expect.anything());
    expect(group.rows[1]).toMatchObject({ brand: "GYEON", note: "Wszystkie klasy" });
  });
});

describe("parseCarClass", () => {
  it("accepts a known class and falls back to M", () => {
    expect(parseCarClass("XL")).toBe("XL");
    expect(parseCarClass("xl")).toBe("M");
    expect(parseCarClass(null)).toBe("M");
  });
});

describe("storyDuration", () => {
  it("keeps a review on screen between 6 and 14 seconds", () => {
    expect(storyDuration("Krótko.")).toBe(6_000);
    expect(storyDuration("słowo ".repeat(20))).toBe(8_900);
    expect(storyDuration("słowo ".repeat(80))).toBe(14_000);
  });
});
