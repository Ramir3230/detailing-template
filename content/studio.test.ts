import { describe, expect, it } from "vitest";
import { studio } from "@/content/studio";
import { messengerHref, telHref } from "@/lib/contact";

/*
 * Из этих полей строятся ссылки и статус «Otwarte» на каждой странице. Ошибка в них
 * не видна при сборке и молча ломает звонок — ловим её до деплоя.
 */
describe("active studio data", () => {
  const phone = /^\+\d{8,15}$/;
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;

  it("has phones in the international format", () => {
    expect(studio.phone).toMatch(phone);
    expect(telHref(studio.phone)).toBe(`tel:${studio.phone}`);
    for (const messenger of studio.messengers) {
      if ("phone" in messenger) expect(messenger.phone).toMatch(phone);
      else expect(messenger.username).toMatch(/^[A-Za-z0-9._]{3,32}$/);
      expect(() => new URL(messengerHref(messenger))).not.toThrow();
    }
  });

  it("has https links for the route and the Google reviews", () => {
    for (const url of [studio.address.routeUrl, studio.rating.url]) {
      if (url) expect(new URL(url).protocol).toBe("https:");
    }
  });

  it("has a readable theme: hex colors, text and accent at 4.5:1 to the background", () => {
    const { bg, fg, muted, accent } = studio.theme;
    for (const color of [bg, fg, muted, accent]) expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    for (const color of [fg, muted, accent]) expect(contrast(color, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("has working hours that close after they open", () => {
    for (const day of studio.hours) {
      if (!day) continue;
      expect(day.open).toMatch(time);
      expect(day.close).toMatch(time);
      expect(day.close > day.open).toBe(true);
    }
  });
});

/* Контраст по WCAG 2: относительная яркость двух цветов #rrggbb. */
function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
