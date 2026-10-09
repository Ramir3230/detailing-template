import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { studio } from "@/content/studio";
import type { Photo } from "@/content/types";
import { messengerHref, telHref } from "@/lib/contact";
import { hasGroupPage, sectionIds } from "@/lib/nav";

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

  it("has whole prices: the price counter shows digits only", () => {
    for (const group of studio.services) {
      for (const { price } of group.services) {
        const amounts =
          price.kind === "byClass" ? [price.S, price.M, price.L] : "amount" in price ? [price.amount] : [];
        for (const amount of amounts) expect(Number.isInteger(amount) && amount > 0).toBe(true);
      }
    }
  });

  it("has unique group slugs fit for an address and an anchor", () => {
    const slugs = studio.services.map(({ slug }) => slug);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(new Set(slugs).size).toBe(slugs.length);
    // slug — ещё и id группы в прайсе главной: не должен совпасть с якорем её секций
    for (const slug of slugs) expect(Object.values(sectionIds)).not.toContain(slug);
  });

  it("has at least one group page: the group route does not build without one", () => {
    expect(studio.services.filter(hasGroupPage).length).toBeGreaterThan(0);
  });

  it("gives every service of a group page its duration and scope", () => {
    for (const group of studio.services.filter(hasGroupPage)) {
      for (const service of group.services) {
        expect(service.duration, `${group.slug}: ${service.name.pl} без длительности`).toBeDefined();
        expect(service.scope?.length, `${group.slug}: ${service.name.pl} без состава`).toBeGreaterThan(0);
      }
    }
  });

  it("has https links for the route and the Google reviews", () => {
    for (const url of [studio.address.routeUrl, studio.rating.url]) {
      if (url) expect(new URL(url).protocol).toBe("https:");
    }
  });

  it("leaves no demo leftovers once the site is open for search", () => {
    if (!studio.indexed) return;
    expect(studio.rating.url).toBeTruthy();
    expect(studio.reviews.every((review) => review.source === "google")).toBe(true);
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

  it("has the hero car files in the size the data claims, headlights inside the frame", () => {
    const { car } = studio.hero;
    for (const src of [car.src, car.lights]) {
      expect(src).toMatch(/^\/[\w\-/]+\.webp$/);
      const size = webpSize(readFileSync(join(process.cwd(), "public", src)));
      expect(size).toEqual({ width: car.width, height: car.height });
    }
    if (car.depth) {
      // Три панели одна под другой, каждая — в пропорциях машины
      expect(car.depth).toMatch(/^\/[\w\-/]+\.webp$/);
      const map = webpSize(readFileSync(join(process.cwd(), "public", car.depth)));
      expect(map.height).toBe(3 * Math.round((map.width * car.height) / car.width));
    }
    if (car.underglow) {
      const { tube, wheels } = car.underglow;
      expect(tube[0]).toBeLessThan(tube[1]);
      expect(wheels[0].x).toBeLessThan(wheels[1].x);
      for (const value of [...tube, ...wheels.flatMap(({ x, w }) => [x, w])]) {
        expect(value > 0 && value < 100).toBe(true);
      }
    }
    expect(car.headlights[0].x).toBeLessThan(car.headlights[1].x);
    for (const { x, y, w } of car.headlights) {
      for (const value of [x, y, w]) expect(value > 0 && value < 100).toBe(true);
    }
  });

  it("has before/after pairs: one 4:5 size for both frames, sharp on a desktop 2x screen", () => {
    const pairs = studio.services.flatMap((group) =>
      group.services.flatMap(({ beforeAfter }) => (beforeAfter ? [beforeAfter] : [])),
    );
    // По кадру «po» React различает пары; у вкладок разные подписи
    expect(new Set(pairs.map(({ after }) => after.src)).size).toBe(pairs.length);
    expect(new Set(pairs.map(({ label }) => label.pl)).size).toBe(pairs.length);
    const ru = pairs.flatMap(({ label }) => (label.ru ? [label.ru] : []));
    expect(new Set(ru).size).toBe(ru.length);
    // Вкладки делят ширину телефона поровну: на 375 px помещаются четыре по 9 знаков
    // (DESIGN.md, «До/после»)
    expect(pairs.length).toBeLessThanOrEqual(4);
    for (const { label } of pairs) {
      for (const text of [label.pl, label.ru ?? ""]) expect(text.length).toBeLessThanOrEqual(9);
    }
    for (const { before, after } of pairs) {
      // Шторка режет один кадр по другому: разный размер — сдвиг на линии
      expect({ width: before.width, height: before.height }).toEqual({
        width: after.width,
        height: after.height,
      });
      for (const photo of [before, after]) expectFrame(photo);
    }
  });

  it("has a hero title and lead the low desktop window fit counts on", () => {
    // DESIGN.md, «Hero на низком окне десктопа»: заголовок — четыре строки колонки 380 px,
    // вводный текст — три. Строка сверх них вытолкнет статус под сгиб
    const { title, lead } = studio.hero;
    for (const text of [title.pl, title.ru ?? ""]) {
      const lines = text.split("\n");
      expect(lines.length).toBeLessThanOrEqual(2);
      // Строка данных встаёт в две строки экрана: два слова по 7 знаков на 52 px
      for (const line of lines) {
        const words = line.trim().split(/\s+/);
        expect(words.length).toBeLessThanOrEqual(2);
        for (const word of words) expect(word.length).toBeLessThanOrEqual(7);
      }
    }
    // Текст 18 px — около 40 знаков в строке колонки
    for (const text of [lead.pl, lead.ru ?? ""]) expect(text.length).toBeLessThanOrEqual(120);
  });

  it("has the entrance photo in 4:5, if there is one", () => {
    if (studio.address.photo) expectFrame(studio.address.photo);
  });

  it("has the map files in the size the data claims, enough for the map block on 2x", () => {
    const { map } = studio.address;
    if (!map) return;
    for (const { src, width, height } of [map.wide, map.narrow]) {
      expect(src).toMatch(/^\/[\w\-/]+\.webp$/);
      expect(webpSize(readFileSync(join(process.cwd(), "public", src)))).toEqual({ width, height });
    }
    // Блок карты (DESIGN.md, «Страница Kontakt»): десктоп — контент 1136 px в 8:3, телефон
    // и планшет — до 640 px в 4:3. Файл показывается в половину размера и не растягивается
    expect(map.wide.width).toBeGreaterThanOrEqual(2 * 1136);
    expect(map.wide.height).toBeGreaterThanOrEqual(2 * 426);
    expect(map.narrow.width).toBeGreaterThanOrEqual(2 * 640);
    expect(map.narrow.height).toBeGreaterThanOrEqual(2 * 480);
  });
});

/*
 * Кадр 4:5 (DESIGN.md, «Фотографии»: до/после от 1040×1300 — на десктопе кадр 520 px),
 * файл того размера, что в данных, с подписью для диктора.
 */
function expectFrame(photo: Photo) {
  expect(photo.src).toMatch(/^\/[\w\-/]+\.webp$/);
  expect(webpSize(readFileSync(join(process.cwd(), "public", photo.src)))).toEqual({
    width: photo.width,
    height: photo.height,
  });
  expect(photo.width * 5).toBe(photo.height * 4);
  expect(photo.width).toBeGreaterThanOrEqual(1040);
  expect(photo.alt.pl.trim()).not.toBe("");
}

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

/* Размер WebP из заголовка: VP8X (с прозрачностью), VP8L (без потерь) или VP8 (простой). */
function webpSize(file: Buffer): { width: number; height: number } {
  expect(file.toString("ascii", 0, 4) + file.toString("ascii", 8, 12)).toBe("RIFFWEBP");
  const chunk = file.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return { width: file.readUIntLE(24, 3) + 1, height: file.readUIntLE(27, 3) + 1 };
  }
  if (chunk === "VP8L") {
    const bits = file.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  expect(chunk).toBe("VP8 ");
  return { width: file.readUInt16LE(26) & 0x3fff, height: file.readUInt16LE(28) & 0x3fff };
}
