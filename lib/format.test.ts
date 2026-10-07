import { describe, expect, it } from "vitest";
import type { Service } from "@/content/types";
import { pl } from "@/dictionaries/pl";
import { ru } from "@/dictionaries/ru";
import {
  formatAmount,
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
    expect(formatAmount(1000, pl.price)).toBe("1000 zł");
    expect(formatAmount(3300, pl.price)).toBe("3300 zł");
  });

  it("splits five digits and more with a non-breaking space", () => {
    expect(formatAmount(15000, pl.price)).toBe("15 000 zł");
    expect(formatAmount(120000, pl.price)).toBe("120 000 zł");
  });

  it("keeps the Polish number format on the Russian page", () => {
    expect(formatAmount(1000, ru.price)).toBe("1000 zł");
  });
});

describe("priceParts", () => {
  const byClass = { kind: "byClass", S: 1000, M: 1150, L: 1300 } as const;

  it("takes the price of the chosen class", () => {
    expect(priceParts(byClass, "S", pl.price)).toEqual({ kind: "amount", amount: "1000 zł" });
    expect(priceParts(byClass, "L", pl.price)).toEqual({ kind: "amount", amount: "1300 zł" });
  });

  it("turns XL into individual pricing", () => {
    expect(priceParts(byClass, "XL", pl.price)).toEqual({ kind: "individual", text: "indywidualnie" });
  });

  it("keeps fixed and from prices for every class, XL included", () => {
    expect(priceParts({ kind: "fixed", amount: 300 }, "XL", pl.price)).toEqual({
      kind: "amount",
      amount: "300 zł",
    });
    expect(priceParts({ kind: "from", amount: 1500 }, "XL", pl.price)).toEqual({
      kind: "amount",
      prefix: "od ",
      amount: "1500 zł",
    });
  });

  it("speaks the page language", () => {
    expect(priceParts({ kind: "from", amount: 600 }, "M", ru.price)).toMatchObject({ prefix: "от " });
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
    expect(formatFrom(200, pl.price)).toBe("od 200 zł");
  });
});

describe("formatDuration", () => {
  it("picks the Polish plural form", () => {
    expect(formatDuration({ unit: "day", min: 1 }, "pl", pl.units)).toBe("1 dzień");
    expect(formatDuration({ unit: "day", min: 3, max: 4 }, "pl", pl.units)).toBe("3–4 dni");
    expect(formatDuration({ unit: "hour", min: 2 }, "pl", pl.units)).toBe("2 godziny");
    expect(formatDuration({ unit: "hour", min: 5 }, "pl", pl.units)).toBe("5 godzin");
    expect(formatDuration({ unit: "hour", min: 22 }, "pl", pl.units)).toBe("22 godziny");
    expect(formatDuration({ unit: "hour", min: 1.5 }, "pl", pl.units)).toBe("1,5 godziny");
  });

  it("picks the Russian plural form", () => {
    expect(formatDuration({ unit: "day", min: 1 }, "ru", ru.units)).toBe("1 день");
    expect(formatDuration({ unit: "day", min: 3, max: 4 }, "ru", ru.units)).toBe("3–4 дня");
    expect(formatDuration({ unit: "hour", min: 5 }, "ru", ru.units)).toBe("5 часов");
    expect(formatDuration({ unit: "hour", min: 21 }, "ru", ru.units)).toBe("21 час");
    expect(formatDuration({ unit: "hour", min: 1.5 }, "ru", ru.units)).toBe("1,5 часа");
  });
});

describe("small formats", () => {
  it("writes hours with an en dash", () => {
    expect(formatTimeRange({ open: "10:00", close: "22:00" })).toBe("10:00–22:00");
  });

  it("writes the rating with a comma", () => {
    expect(formatRating(5)).toBe("5,0");
    expect(formatRating(4.86)).toBe("4,9");
  });

  it("groups a Polish phone number and leaves others alone", () => {
    expect(formatPhone("+48123456789")).toBe("+48 123 456 789");
    expect(formatPhone("+380441234567")).toBe("+380441234567");
  });
});

describe("glue", () => {
  it("glues single-letter Polish words to the next word", () => {
    expect(glue("Mycie i szyby", "pl")).toBe("Mycie i szyby");
    expect(glue("W zakresie", "pl")).toBe("W zakresie");
    expect(glue("auto z rysami i hologramami", "pl")).toBe("auto z rysami i hologramami");
  });

  it("handles chains of short words", () => {
    expect(glue("a w środę", "pl")).toBe("a w środę");
  });

  it("leaves letters inside words alone", () => {
    expect(glue("Polerowanie szyb", "pl")).toBe("Polerowanie szyb");
    expect(glue("SUV-y i pickupy", "pl")).toBe("SUV-y i pickupy");
  });

  it("glues Russian prepositions on the Russian page", () => {
    expect(glue("откроемся в понедельник", "ru")).toBe("откроемся в понедельник");
  });
});
