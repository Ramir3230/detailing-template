import { describe, expect, it } from "vitest";
import { fill, isLang, localePath, stripLang, t } from "@/lib/i18n";

describe("localePath", () => {
  it("keeps Polish addresses without a prefix", () => {
    expect(localePath("pl", "/")).toBe("/");
    expect(localePath("pl", "/#kontakt")).toBe("/#kontakt");
  });

  it("prefixes Russian addresses", () => {
    expect(localePath("ru", "/")).toBe("/ru");
    expect(localePath("ru", "/kontakt")).toBe("/ru/kontakt");
    expect(localePath("ru", "/#kontakt")).toBe("/ru#kontakt");
    expect(localePath("ru", "/uslugi/lakier#faq")).toBe("/ru/uslugi/lakier#faq");
  });
});

describe("stripLang", () => {
  it("removes a language prefix and nothing else", () => {
    expect(stripLang("/ru")).toBe("/");
    expect(stripLang("/ru/kontakt")).toBe("/kontakt");
    expect(stripLang("/pl/kontakt")).toBe("/kontakt");
    expect(stripLang("/kontakt")).toBe("/kontakt");
    expect(stripLang("/rules")).toBe("/rules");
  });
});

describe("t", () => {
  it("falls back to Polish until the Russian text exists", () => {
    expect(t({ pl: "Lakier" }, "ru")).toBe("Lakier");
    expect(t({ pl: "Lakier", ru: "Лак" }, "ru")).toBe("Лак");
    expect(t({ pl: "Lakier", ru: "Лак" }, "pl")).toBe("Lakier");
  });
});

describe("fill", () => {
  it("substitutes known keys and leaves unknown ones visible", () => {
    expect(fill("{day} od {time}", { day: "w środę", time: "10:00" })).toBe("w środę od 10:00");
    expect(fill("do {time}", {})).toBe("do {time}");
  });
});

describe("isLang", () => {
  it("accepts only supported languages", () => {
    expect(isLang("pl")).toBe(true);
    expect(isLang("ru")).toBe(true);
    expect(isLang("en")).toBe(false);
  });
});
