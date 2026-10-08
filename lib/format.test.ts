import { describe, expect, it } from "vitest";
import type { Service } from "@/content/types";
import { pl } from "@/dictionaries/pl";
import { ru } from "@/dictionaries/ru";
import {
  formatAmount,
  formatCount,
  formatDayRange,
  formatDuration,
  formatFrom,
  formatPhone,
  formatRating,
  formatTimeRange,
  glue,
  lowestAmount,
  priceParts,
} from "@/lib/format";

describe("formatAmount", () => {
  it("does not split four digits, as Polish norm says", () => {
    expect(formatAmount(1000, pl.price)).toBe("1000\u00A0zł");
    expect(formatAmount(3300, pl.price)).toBe("3300\u00A0zł");
  });

  it("splits five digits and more with a non-breaking space", () => {
    expect(formatAmount(15000, pl.price)).toBe("15\u00A0000\u00A0zł");
    expect(formatAmount(120000, pl.price)).toBe("120\u00A0000\u00A0zł");
  });

  it("keeps the Polish number format on the Russian page", () => {
    expect(formatAmount(1000, ru.price)).toBe("1000\u00A0zł");
  });
});

describe("priceParts", () => {
  const byClass = { kind: "byClass", S: 1000, M: 1150, L: 1300 } as const;

  it("takes the price of the chosen class", () => {
    expect(priceParts(byClass, "S", pl.price)).toEqual({ kind: "amount", amount: "1000\u00A0zł" });
    expect(priceParts(byClass, "L", pl.price)).toEqual({ kind: "amount", amount: "1300\u00A0zł" });
  });

  it("turns XL into individual pricing", () => {
    expect(priceParts(byClass, "XL", pl.price)).toEqual({ kind: "individual", text: "indywidualnie" });
  });

  it("keeps fixed and from prices for every class, XL included", () => {
    expect(priceParts({ kind: "fixed", amount: 300 }, "XL", pl.price)).toEqual({
      kind: "amount",
      amount: "300\u00A0zł",
    });
    expect(priceParts({ kind: "from", amount: 1500 }, "XL", pl.price)).toEqual({
      kind: "amount",
      prefix: "od\u00A0",
      amount: "1500\u00A0zł",
    });
  });

  it("speaks the page language", () => {
    expect(priceParts({ kind: "from", amount: 600 }, "M", ru.price)).toMatchObject({ prefix: "от\u00A0" });
    expect(priceParts({ kind: "individual" }, "M", ru.price)).toEqual({
      kind: "individual",
      text: "индивидуально",
    });
  });
});

describe("lowestAmount", () => {
  const service = (price: Service["price"]): Service => ({ name: { pl: "x" }, price });

  it("finds the lowest price across kinds", () => {
    expect(
      lowestAmount([
        service({ kind: "byClass", S: 300, M: 330, L: 350 }),
        service({ kind: "fixed", amount: 120 }),
        service({ kind: "from", amount: 1500 }),
      ]),
    ).toBe(120);
  });

  it("ignores individual prices and returns null when nothing has a number", () => {
    expect(lowestAmount([service({ kind: "individual" }), service({ kind: "from", amount: 600 })])).toBe(600);
    expect(lowestAmount([service({ kind: "individual" })])).toBeNull();
  });
});

describe("formatFrom", () => {
  it("glues every part with non-breaking spaces", () => {
    expect(formatFrom(200, pl.price)).toBe("od\u00A0200\u00A0zł");
  });
});

describe("formatDuration", () => {
  it("picks the Polish plural form", () => {
    expect(formatDuration({ unit: "day", min: 1 }, "pl", pl.units)).toBe("1\u00A0dzień");
    expect(formatDuration({ unit: "day", min: 3, max: 4 }, "pl", pl.units)).toBe("3–4\u00A0dni");
    expect(formatDuration({ unit: "hour", min: 2 }, "pl", pl.units)).toBe("2\u00A0godziny");
    expect(formatDuration({ unit: "hour", min: 5 }, "pl", pl.units)).toBe("5\u00A0godzin");
    expect(formatDuration({ unit: "hour", min: 22 }, "pl", pl.units)).toBe("22\u00A0godziny");
    expect(formatDuration({ unit: "hour", min: 1.5 }, "pl", pl.units)).toBe("1,5\u00A0godziny");
  });

  it("picks the Russian plural form", () => {
    expect(formatDuration({ unit: "day", min: 1 }, "ru", ru.units)).toBe("1\u00A0день");
    expect(formatDuration({ unit: "day", min: 3, max: 4 }, "ru", ru.units)).toBe("3–4\u00A0дня");
    expect(formatDuration({ unit: "hour", min: 5 }, "ru", ru.units)).toBe("5\u00A0часов");
    expect(formatDuration({ unit: "hour", min: 21 }, "ru", ru.units)).toBe("21\u00A0час");
    expect(formatDuration({ unit: "hour", min: 1.5 }, "ru", ru.units)).toBe("1,5\u00A0часа");
  });
});

describe("small formats", () => {
  it("writes hours with an en dash", () => {
    expect(formatTimeRange({ open: "10:00", close: "22:00" })).toBe("10:00–22:00");
  });

  it("writes a range of days with the second one in lower case", () => {
    expect(formatDayRange(0, 4, pl.days.short, "pl")).toBe("Pn–pt");
    expect(formatDayRange(5, 5, pl.days.short, "pl")).toBe("Sob");
    expect(formatDayRange(0, 4, ru.days.short, "ru")).toBe("Пн–пт");
    expect(formatDayRange(0, 4, pl.days.long, "pl", " – ")).toBe("Poniedziałek – piątek");
    expect(formatDayRange(6, 6, ru.days.long, "ru", " – ")).toBe("Воскресенье");
  });

  it("puts the noun in the right form for the count", () => {
    expect(formatCount(1, pl.reviews.count, "pl")).toBe("1\u00A0opinia");
    expect(formatCount(24, pl.reviews.count, "pl")).toBe("24\u00A0opinie");
    expect(formatCount(25, pl.reviews.count, "pl")).toBe("25\u00A0opinii");
    expect(formatCount(21, ru.reviews.count, "ru")).toBe("21\u00A0отзыв");
    expect(formatCount(24, ru.reviews.count, "ru")).toBe("24\u00A0отзыва");
    expect(formatCount(1200, pl.reviews.count, "pl")).toBe("1200\u00A0opinii");
  });

  it("writes the rating with a comma", () => {
    expect(formatRating(5)).toBe("5,0");
    expect(formatRating(4.86)).toBe("4,9");
  });

  it("groups a Polish phone number and leaves others alone", () => {
    expect(formatPhone("+48123456789")).toBe("+48\u00A0123\u00A0456\u00A0789");
    expect(formatPhone("+380441234567")).toBe("+380441234567");
  });
});

describe("glue", () => {
  it("glues single-letter Polish words to the next word", () => {
    expect(glue("Mycie i szyby", "pl")).toBe("Mycie i\u00A0szyby");
    expect(glue("W zakresie", "pl")).toBe("W\u00A0zakresie");
    expect(glue("auto z rysami i hologramami", "pl")).toBe("auto z\u00A0rysami i\u00A0hologramami");
  });

  it("handles chains of short words", () => {
    expect(glue("a w środę", "pl")).toBe("a\u00A0w\u00A0środę");
  });

  it("leaves letters inside words alone", () => {
    expect(glue("Polerowanie szyb", "pl")).toBe("Polerowanie szyb");
    expect(glue("SUV-y i pickupy", "pl")).toBe("SUV-y i\u00A0pickupy");
  });

  it("glues Russian prepositions on the Russian page", () => {
    expect(glue("откроемся в понедельник", "ru")).toBe("откроемся в\u00A0понедельник");
  });
});
