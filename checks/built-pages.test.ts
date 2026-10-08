import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { studio } from "@/content/studio";
import { langs, type Lang } from "@/lib/i18n";

/*
 * Проверки собранных страниц: то, чего не видят tsc, eslint и модульные тесты, а сломать
 * легко и незаметно. Идут в `npm run check` после `next build` — по HTML, который сборка
 * отрендерила заранее.
 */
const built = (lang: Lang) => join(process.cwd(), ".next", "server", "app", `${lang}.html`);

function page(lang: Lang): { html: string; head: string } {
  const html = readFileSync(built(lang), "utf-8");
  return { html, head: html.slice(0, html.indexOf("</head>")) };
}

/* Файл машины hero из данных так, как он стоит в адресах next/image */
const carFile = encodeURIComponent(studio.hero.car.src);
const tags = (html: string, pattern: RegExp) => html.match(pattern) ?? [];

describe.each(langs)("built home page /%s", (lang) => {
  it("is prerendered: `npm run build` has run", () => {
    expect(existsSync(built(lang)), `${built(lang)} нет — сначала npm run build`).toBe(true);
  });

  it("names its language and keeps route changes instant", () => {
    const tag = page(lang).html.match(/<html\b[^>]*>/)?.[0] ?? "";
    expect(tag).toContain(`lang="${lang}"`);
    expect(tag).toContain('data-scroll-behavior="smooth"');
  });

  it("is closed from search exactly when the studio data says so", () => {
    const published = (studio.languages as readonly Lang[]).includes(lang);
    const robots = page(lang).head.match(/<meta name="robots" content="([^"]*)"/)?.[1];
    if (studio.indexed && published) expect(robots ?? "").not.toContain("noindex");
    else expect(robots).toContain("noindex");
  });

  it("preloads the hero car and never loads it lazily", () => {
    const { html, head } = page(lang);
    const preloads = tags(head, /<link rel="preload" as="image"[^>]*>/g);
    expect(preloads.some((tag) => tag.includes(carFile))).toBe(true);
    const car = tags(html, /<img\b[^>]*>/g).find((tag) => tag.includes(carFile));
    expect(car, "нет <img> машины hero").toBeDefined();
    expect(car).not.toContain('loading="lazy"');
  });

  it("serves the hero unlit: ignition starts in the browser", () => {
    const { html } = page(lang);
    expect(html).toMatch(/<section\b[^>]*\bid="top"[^>]*\bdata-ignition=""/);
    // Атрибуты, а не подстрока: имя есть и в классах (in-data-ignited:animate-none)
    expect(html).not.toMatch(/\sdata-(lit|ignited)=/);
  });

  it("has one main heading", () => {
    expect(page(lang).html.match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it("carries no real brands from the mockup", () => {
    expect(page(lang).html).not.toMatch(/spectre|mansory/i);
  });
});
