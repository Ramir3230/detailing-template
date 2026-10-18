import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { studio } from "@/content/studio";
import type { Service } from "@/content/types";
import { getDictionary } from "@/dictionaries";
import { defaultCarClass } from "@/lib/car-class";
import { spectrumStops } from "@/lib/car-volume";
import { homePairServices } from "@/lib/compare";
import { messengerHref } from "@/lib/contact";
import { formatDayRange, formatDuration, glue, priceParts } from "@/lib/format";
import { groupHours } from "@/lib/hours";
import { markShapes } from "@/lib/mark";
import { defaultLang, fill, langs, localePath, t, type Lang } from "@/lib/i18n";
import {
  aboutCallId,
  aboutPagePath,
  contactPagePath,
  groupPagePath,
  groupPagesPath,
  groupSectionIds,
  hasGroupPage,
  sectionIds,
  servicesPath,
} from "@/lib/nav";
import { classPriced, quoteOnly } from "@/lib/price-list";
import { isPublished, publishedLangs } from "@/lib/seo";

/*
 * Проверки собранных страниц: то, чего не видят tsc, eslint и модульные тесты, а сломать
 * легко и незаметно. Идут в `npm run check` после `next build` — по HTML, который сборка
 * отрендерила заранее.
 */

/* Адрес страницы так, как сборка кладёт её HTML: `pl`, `pl/uslugi/lakier`. */
const built = (route: string) => join(process.cwd(), ".next", "server", "app", `${route}.html`);

function page(route: string): { html: string; head: string } {
  const html = readFileSync(built(route), "utf-8");
  return { html, head: html.slice(0, html.indexOf("</head>")) };
}

/* Файл машины hero из данных так, как он стоит в адресах next/image */
const carFile = encodeURIComponent(studio.hero.car.src);
const tags = (html: string, pattern: RegExp) => html.match(pattern) ?? [];

/* Текст так, как React кладёт его в HTML */
const escaped = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

function expectPrerendered(route: string) {
  expect(
    existsSync(built(route)),
    `${built(route)} нет — сборка не запускалась или Next изменил раскладку .next/server/app`,
  ).toBe(true);
}

function expectLang(route: string, lang: Lang) {
  const tag = page(route).html.match(/<html\b[^>]*>/)?.[0] ?? "";
  expect(tag).toContain(`lang="${lang}"`);
  expect(tag).toContain('data-scroll-behavior="smooth"');
}

function expectSearchRule(route: string, lang: Lang) {
  const { head } = page(route);
  // Открытый сайт: noindex нигде в <head> — ни в robots, ни в googlebot, ни в другом виде
  if (studio.indexed && isPublished(lang)) expect(head).not.toMatch(/noindex/i);
  else expect(head.match(/<meta name="robots" content="([^"]*)"/)?.[1]).toContain("noindex");
}

/* Адрес из href ссылки: полный у <link>, от корня у <a> */
const hrefPath = (tag: string) => new URL(tag.match(/href="([^"]*)"/)?.[1] ?? "", "http://site").pathname;
const hreflang = (tag: string) => tag.match(/hreflang="([^"]*)"/i)?.[1];
const sorted = (pairs: (string | undefined)[][]) => pairs.map((pair) => pair.join(" ")).sort();

/*
 * Поиск и переключатель ведут на эту же страницу: canonical — она сама, hreflang и
 * ссылки переключателя — она же на остальных опубликованных языках. path — без языка.
 */
function expectLanguageLinks(route: string, lang: Lang, path: string) {
  const links = tags(page(route).head, /<link\b[^>]*>/g);
  const canonical = links.filter((tag) => tag.includes('rel="canonical"'));
  expect(canonical.map(hrefPath)).toEqual([localePath(lang, path)]);

  const alternate = links.filter((tag) => tag.includes('rel="alternate"') && hreflang(tag));
  const several = publishedLangs.length > 1;
  const expected = several ? [...publishedLangs.map((code) => [code, code]), ["x-default", defaultLang]] : [];
  expect(sorted(alternate.map((tag) => [hreflang(tag), hrefPath(tag)]))).toEqual(
    sorted(expected.map(([code, target]) => [code, localePath(target as Lang, path)])),
  );

  // Переключатель — в меню и подвале: каждая ссылка дважды
  const switchLinks = tags(markup(route), /<a\b[^>]*hreflang="[^"]*"[^>]*>/gi);
  const others = several ? publishedLangs.filter((code) => code !== lang) : [];
  expect(sorted(switchLinks.map((tag) => [hreflang(tag), hrefPath(tag)]))).toEqual(
    sorted([...others, ...others].map((code) => [code, localePath(code, path)])),
  );
}

/* Кадры до/после у этих услуг */
const pairPhotos = (services: readonly Service[]) =>
  services.flatMap(({ beforeAfter }) => (beforeAfter ? [beforeAfter.before.src, beforeAfter.after.src] : []));

/* Каждый кадр — одной картинкой, лениво и без preload: не спорит с тем, что наверху */
function expectLazyPhotos(route: string, srcs: readonly string[]) {
  const { html } = page(route);
  for (const file of srcs.map((src) => encodeURIComponent(src))) {
    const images = tags(html, /<img\b[^>]*>/g).filter((tag) => tag.includes(file));
    expect(images, `нет <img> кадра ${decodeURIComponent(file)}`).toHaveLength(1);
    expect(images[0]).toContain('loading="lazy"');
    const preloads = tags(html, /<link\b[^>]*>/g).filter((tag) => tag.includes(file));
    expect(preloads, `кадр ${decodeURIComponent(file)} в preload`).toEqual([]);
  }
}

/* Разметка без скриптов: в данных для гидрации те же тексты лежат пропсами */
const markup = (route: string) => page(route).html.replace(/<script\b[\s\S]*?<\/script>/g, "");

describe.each(langs)("built home page /%s", (lang) => {
  it("is prerendered: `npm run build` has run", () => expectPrerendered(lang));

  it("names its language and keeps route changes instant", () => expectLang(lang, lang));

  it("is closed from search exactly when the studio data says so", () => expectSearchRule(lang, lang));

  it("leads search and the language switch to this page", () => expectLanguageLinks(lang, lang, "/"));

  it("preloads the hero car and never loads it lazily", () => {
    const { html, head } = page(lang);
    // Порядок атрибутов у <link> не важен: без srcset React ставит href между rel и as
    const preload = tags(head, /<link\b[^>]*>/g).find(
      (tag) => tag.includes('rel="preload"') && tag.includes('as="image"') && tag.includes(carFile),
    );
    expect(preload, "нет preload машины hero в <head>").toBeDefined();
    const car = tags(html, /<img\b[^>]*>/g).find((tag) => tag.includes(carFile));
    expect(car, "нет <img> машины hero").toBeDefined();
    expect(car).not.toContain('loading="lazy"');
  });

  it("leaves the volumetric car to the browser: the photo comes first", () => {
    const { html } = page(lang);
    // Холст рисует только браузер, после гидрации: без WebGL и до него машина — фото
    expect(html).not.toMatch(/<canvas\b/);
    // Карта объёма грузится после фото машины и не спорит с ним за канал. Путь — как есть
    // и так, как его кодирует next/image
    const { depth } = studio.hero.car;
    if (depth) {
      const files = [depth, encodeURIComponent(depth)];
      const preloads = tags(html, /<link\b[^>]*>/g).filter((tag) => files.some((file) => tag.includes(file)));
      expect(preloads, "карта объёма в preload").toEqual([]);
    }
    // Код WebGL — отдельный кусок после гидрации: ни в одном скрипте, который страница
    // грузит сразу или заранее
    const chunks = [...html.matchAll(/(?:src|href)="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map((m) => m[1]);
    expect(chunks.length, "в HTML нет скриптов Next — раскладка .next изменилась").toBeGreaterThan(0);
    const eager = chunks.filter((chunk) =>
      readFileSync(join(process.cwd(), ".next", chunk.replace("/_next/", "")), "utf-8").includes("webgl2"),
    );
    expect(eager, "код WebGL в скриптах, которые грузятся сразу").toEqual([]);
  });

  it("serves the hero unlit: ignition starts in the browser", () => {
    const { html } = page(lang);
    const hero = tags(html, /<section\b[^>]*>/g).find((tag) => tag.includes(`id="${sectionIds.hero}"`));
    expect(hero, "нет секции hero").toContain('data-ignition=""');
    // Атрибуты, а не подстрока: имя есть и в классах (in-data-ignited:animate-none)
    expect(html).not.toMatch(/\sdata-(lit|ignited)=/);
  });

  it("keeps the price list at #cennik: the studio's Instagram and Maps link there", () => {
    // Буквально, а не через sectionIds: ссылки в профилях студии мы не исправим, и
    // переименованный якорь сломал бы их молча
    const prices = tags(page(lang).html, /<section\b[^>]*>/g).find((tag) => tag.includes('id="cennik"'));
    expect(prices, "нет секции прайса с якорем cennik").toBeDefined();
  });

  it("serves the price list with durations and the line on how prices are set", () => {
    const prices = markup(lang).match(/<section\b[^>]*id="cennik"[\s\S]*?<\/section>/)?.[0] ?? "";
    const { units } = getDictionary(lang);
    // Счётом, а не наличием: у разных услуг одна длительность («1 dzień» дважды), и
    // пропажа её у одной строки иначе прошла бы незамеченной
    const expected = new Map<string, number>();
    for (const { duration } of studio.services.flatMap((group) => group.services)) {
      if (!duration) continue;
      const text = escaped(formatDuration(duration, lang, units));
      expected.set(text, (expected.get(text) ?? 0) + 1);
    }
    for (const [text, count] of expected) expect(prices.split(text).length - 1, text).toBe(count);
    expect(prices).toContain(escaped(glue(t(studio.priceNote, lang), lang)));
  });

  it("shows the class switch only when a price depends on the class", () => {
    const prices = markup(lang).match(/<section\b[^>]*id="cennik"[\s\S]*?<\/section>/)?.[0] ?? "";
    expect(prices.includes('role="radiogroup"'), "переключатель классов").toBe(classPriced(studio.services));
  });

  it("on request: no prices in the list, the way to a quote and the hero button to the services", () => {
    const dict = getDictionary(lang);
    const html = markup(lang);
    const quote = quoteOnly(studio.services);
    expect(html).toContain(escaped(quote ? dict.hero.seeServices : dict.hero.checkPrice));
    expect(html).not.toContain(escaped(quote ? dict.hero.checkPrice : dict.hero.seeServices));
    if (!quote) return;

    const prices = html.match(/<section\b[^>]*id="cennik"[\s\S]*?<\/section>/)?.[0] ?? "";
    // Слово цены «indywidualnie» — только в строке студии о цене, если она его говорит сама
    const note = escaped(glue(t(studio.priceNote, lang), lang));
    expect(prices.replace(note, "")).not.toContain(escaped(dict.price.individual));
    expect(prices).toContain(escaped(glue(dict.prices.titleQuote, lang)));
    expect(prices).toContain(escaped(glue(dict.prices.quoteHint, lang)));
    expect(prices).toContain(escaped(dict.prices.individualQuote));
    for (const messenger of studio.messengers) expect(prices).toContain(`href="${escaped(messengerHref(messenger))}"`);
    // Под кадром до/после — только сумма: «indywidualnie» там не показываем
    const pairs = html.match(new RegExp(`<section\\b[^>]*>(?:(?!</section>)[\\s\\S])*${escaped(dict.beforeAfter.title)}[\\s\\S]*?</section>`))?.[0] ?? "";
    expect(pairs).not.toContain(escaped(dict.price.individual));
  });

  it("loads the photos below the hero lazily: they never compete with the hero car", () => {
    const services = homePairServices(studio.services);
    expectLazyPhotos(lang, [...pairPhotos(services), ...(studio.address.photo ? [studio.address.photo.src] : [])]);
  });

  it("leaves the pairs beyond the first of each group to their group pages", () => {
    const home = new Set(homePairServices(studio.services));
    const rest = studio.services.flatMap((group) => group.services).filter((service) => !home.has(service));
    // Кадр «przed», общий с парой главной, на главной законно: «po» у пар уникальны
    const shown = new Set(pairPhotos([...home]));
    const { html } = page(lang);
    // И в адресе оптимизатора картинок, и в данных клиентского компонента
    for (const src of pairPhotos(rest).filter((file) => !shown.has(file))) {
      for (const text of [src, encodeURIComponent(src)]) expect(html, `кадр ${src} на главной`).not.toContain(text);
    }
  });

  it("ships the spectrum floor neon in the built CSS: next dev once dropped a new utility", () => {
    const dir = join(process.cwd(), ".next", "static", "chunks");
    const css = readdirSync(dir)
      .filter((file) => file.endsWith(".css"))
      .map((file) => readFileSync(join(dir, file), "utf-8"))
      .join("");
    // Разлив и горячее пятно — псевдоэлементы со спектром (app/globals.css)
    for (const part of ["before", "after"]) {
      expect(css).toMatch(new RegExp(`\\.glow-floor-spectrum:+${part}\\{[^}]*var\\(--spectrum\\)`));
    }
  });

  it("lights the floor neon with the theme spectrum exactly when the theme has one", () => {
    const { html } = page(lang);
    const { spectrum } = studio.theme;
    expect(html.includes("glow-floor-spectrum"), "неон пола спектром").toBe(Boolean(spectrum));
    const root = html.match(/<html\b[^>]*>/)?.[0] ?? "";
    if (spectrum) expect(root).toContain(`--spectrum:${spectrumStops(spectrum)}`);
    else expect(root).not.toContain("--spectrum");
  });

  it("puts the studio mark before the logo wherever the logo stands", () => {
    const mark = studio.logoMark;
    const marks = tags(markup(lang), /<img\b[^>]*>/g).filter((tag) => mark && tag.includes(`src="${mark.src}"`));
    // Шапка, меню, hero — погашенный и горящий слои — и подвал
    expect(marks).toHaveLength(mark ? 5 : 0);
    for (const tag of marks) {
      // Имя студии стоит рядом текстом: знак для диктора — украшение
      expect(tag).toContain('alt=""');
      // Знак на первом экране — в hero телефона и в шапке десктопа
      expect(tag).not.toContain('loading="lazy"');
    }
  });

  it("draws a tube mark in the hero tube by tube; a filled one lights up whole", () => {
    const mark = studio.logoMark;
    const shapes = mark ? markShapes(readFileSync(join(process.cwd(), "public", mark.src), "utf-8")) : null;
    const html = markup(lang);
    const tubes = tags(html, /<path\b[^>]*class="ignite-tube"[^>]*>/g);
    if (shapes?.kind !== "tubes") {
      expect(tubes).toEqual([]);
      expect(html).not.toContain("ignite-logo-split");
      return;
    }
    // Каждая трубка — в порядке файла, длиной 1 для бегущего света и со своим моментом
    expect(tubes.map((tag) => tag.match(/\sd="([^"]*)"/)?.[1])).toEqual(shapes.tubes.map(({ d }) => d));
    for (const tag of tubes) {
      expect(tag).toContain('pathLength="1"');
      expect(tag).toContain('fill="none"');
      expect(tag).toMatch(/--tube-delay:\d+ms;--tube-run:\d+ms/);
    }
    // Горящий слой зажигает знак и надпись порознь
    expect(tags(html, /<span\b[^>]*class="[^"]*ignite-logo-split[^"]*"[^>]*>/g)).toHaveLength(1);
  });

  it("draws the tab icon once at build time", () => {
    // Иконку со знаком сборка рисует заранее: асинхронное чтение файла это сорвало бы
    expect(existsSync(join(process.cwd(), ".next", "server", "app", "icon.body")), "иконка не пререндерена").toBe(true);
  });

  it("has one main heading", () => {
    expect(page(lang).html.match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it("carries no real brands from the mockup", () => {
    expect(page(lang).html).not.toMatch(/spectre|mansory/i);
  });
});

const groupPages = studio.services
  .filter(hasGroupPage)
  .flatMap((group) => langs.map((lang) => ({ lang, group, route: `${lang}${groupPagePath(group.slug)}` })));

describe("built group route", () => {
  it("renders an unknown address in full before answering: its 404 goes out as 404", () => {
    // ensureStatic = "navigation" в маршруте. Без неё шапка незнакомого адреса ушла бы
    // раньше страницы, и 404 приходил бы со статусом 200
    const manifest = JSON.parse(readFileSync(join(process.cwd(), ".next", "prerender-manifest.json"), "utf-8"));
    const route = manifest.dynamicRoutes?.["/[lang]/uslugi/[slug]"];
    expect(route, "маршрута групп нет в prerender-manifest — Next мог сменить формат").toBeDefined();
    expect(route.compute, "маршрут групп отвечает до конца отрисовки — или Next сменил формат").toBe("blocking");
  });

  // Студия без страниц групп (демо): группы ведут к своим местам в прайсе главной
  if (groupPages.length > 0) return;

  it.each(langs)("is not linked from the home page /%s: the studio has no group pages", (lang) => {
    expect(page(lang).html).not.toContain(`href="${localePath(lang, groupPagesPath)}/`);
  });

  it.each(langs)("answers with the studio's 404 at the address it is built on, /%s", (lang) =>
    expectNotFoundPage(`${lang}${groupPagePath(studio.services[0].slug)}`, lang),
  );
});

describe.each(groupPages)("built group page /$route", ({ lang, group, route }) => {
  it("is prerendered: `npm run build` has run", () => expectPrerendered(route));

  it("names its language and keeps route changes instant", () => expectLang(route, lang));

  it("is closed from search exactly when the studio data says so", () => expectSearchRule(route, lang));

  it("leads search and the language switch to this page", () =>
    expectLanguageLinks(route, lang, groupPagePath(group.slug)));

  it("shows the class switch only when a price of the group depends on the class", () => {
    expect(markup(route).includes('role="radiogroup"'), "переключатель классов").toBe(classPriced([group]));
  });

  it("has one main heading — the group — and the group in the tab title", () => {
    const { html, head } = page(route);
    const name = t(group.name, lang);
    const headings = tags(html, /<h1\b[^>]*>[\s\S]*?<\/h1>/g);
    expect(headings).toHaveLength(1);
    // В заголовке страницы однобуквенные слова приклеены неразрывным пробелом, во вкладке — нет
    expect(headings[0]).toContain(glue(name, lang));
    expect(head.match(/<title>([^<]*)<\/title>/)?.[1]).toContain(name);
  });

  it("serves every service of the group with its scope and the default class price", () => {
    // Сервер рисует класс по умолчанию: без JS и до гидрации цена уже на месте
    const visible = markup(route);
    const dict = getDictionary(lang);
    for (const service of group.services) {
      expect(visible).toContain(escaped(glue(t(service.name, lang), lang)));
      for (const line of service.scope ?? []) expect(visible).toContain(escaped(glue(t(line, lang), lang)));
      const parts = priceParts(service.price, defaultCarClass, dict.price);
      expect(visible).toContain(escaped(parts.kind === "amount" ? parts.amount : parts.text));
    }
  });

  it("loads the group's before/after photos lazily", () => expectLazyPhotos(route, pairPhotos(group.services)));

  it("serves the questions with their answers in the markup, the first one open", () => {
    const sections = tags(markup(route), /<section\b[\s\S]*?<\/section>/g);
    const faq = sections.find((section) => section.includes(`id="${groupSectionIds.faq}"`));
    // Вопросы у группы необязательны: нет их в данных — нет и секции
    if (!group.faq?.length) {
      expect(faq).toBeUndefined();
      return;
    }
    expect(faq, "нет секции частых вопросов").toBeDefined();
    for (const { question, answer } of group.faq ?? []) {
      expect(faq).toContain(escaped(glue(t(question, lang), lang)));
      expect(faq).toContain(escaped(glue(t(answer, lang), lang)));
    }
    const details = tags(faq ?? "", /<details\b[^>]*>/g);
    expect(details).toHaveLength(group.faq?.length ?? 0);
    expect(details.map((tag) => /\sopen[\s=>]/.test(tag))).toEqual(details.map((_, i) => i === 0));
  });

  it("has the advice card call the floating call hides at", () => {
    const call = tags(page(route).html, /<a\b[^>]*>/g).find((tag) => tag.includes(`id="${groupSectionIds.adviceCall}"`));
    expect(call, "нет кнопки звонка карточки «Nie wiesz…»").toContain('href="tel:');
  });

  it("leaves the hero car to the home page", () => {
    // Ни картинкой, ни preload: путь как есть и так, как его кодирует next/image
    const { html } = page(route);
    expect(html).not.toContain(carFile);
    expect(html).not.toContain(studio.hero.car.src);
  });

  it("carries no real brands from the mockup", () => {
    expect(page(route).html).not.toMatch(/spectre|mansory/i);
  });
});

describe.each(langs)("built contact page /%s/kontakt", (lang) => {
  const route = `${lang}${contactPagePath}`;
  const dict = getDictionary(lang);

  it("is prerendered: `npm run build` has run", () => expectPrerendered(route));

  it("names its language and keeps route changes instant", () => expectLang(route, lang));

  it("is closed from search exactly when the studio data says so", () => expectSearchRule(route, lang));

  it("leads search and the language switch to this page", () => expectLanguageLinks(route, lang, contactPagePath));

  it("has one main heading and is the page the navigation leads to", () => {
    const { html, head } = page(route);
    const headings = tags(html, /<h1\b[^>]*>[\s\S]*?<\/h1>/g);
    expect(headings).toHaveLength(1);
    expect(headings[0]).toContain(escaped(dict.contact.title));
    expect(head.match(/<title>([^<]*)<\/title>/)?.[1]).toContain(escaped(dict.contact.title));
    // Шапка, меню и подвал главной ведут сюда, а не к блоку на главной
    expect(page(lang).html).toContain(`href="${localePath(lang, contactPagePath)}"`);
  });

  it("draws the map from the studio data and credits its sources", () => {
    const { map } = studio.address;
    const visible = markup(route);
    if (!map) {
      expect(visible).not.toContain("openstreetmap.org");
      return;
    }
    // Файлы — переменными для маски CSS: в разметке, а не скриптом после загрузки
    for (const file of [map.wide, map.narrow]) expect(visible).toContain(`url(${file.src})`);
    expect(visible).toContain('href="https://www.openstreetmap.org/copyright"');
    expect(visible).toContain('href="https://openmaptiles.org/"');
    // Карта нажимается ровно тогда, когда есть маршрут, — и ведёт на него
    const link = visible.match(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*?role="img"/)?.[0];
    const { routeUrl } = studio.address;
    if (routeUrl) expect(link, "карта не ведёт на маршрут").toContain(`href="${escaped(routeUrl)}"`);
    else expect(link, "карта — ссылка без маршрута в данных").toBeUndefined();
  });

  it("has the contact call the floating call hides at", () => {
    const call = tags(page(route).html, /<div\b[^>]*>/g).find((tag) => tag.includes(`id="${sectionIds.contactCall}"`));
    expect(call, "нет кнопки звонка блока контактов").toBeDefined();
  });

  it("names the days in full for screen readers and short on a phone", () => {
    // DESIGN.md, «Контакты»: полные с меткой «сегодня» не помещаются в строку телефона
    const spans = tags(markup(route), /<span\b[^>]*>[^<]*<\/span>/g);
    // Классы списком: подстрока «sm:hidden» совпала бы и с «max-sm:hidden»
    const classes = (tag?: string) => tag?.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
    for (const { from, to } of groupHours(studio.hours)) {
      const long = escaped(formatDayRange(from, to, dict.days.long, lang, " – "));
      const short = escaped(formatDayRange(from, to, dict.days.short, lang, " – "));
      // Полная — диктору всегда, глазу с 640 px; короткая — только глазу, до 640
      const full = spans.find((span) => span.endsWith(`>${long}</span>`));
      expect(full, long).not.toContain("aria-hidden");
      expect(classes(full), long).toContain("max-sm:sr-only");
      const brief = spans.find((span) => span.endsWith(`>${short}</span>`));
      expect(brief, short).toContain('aria-hidden="true"');
      expect(classes(brief), short).toContain("sm:hidden");
    }
  });

  it("loads the entrance photo right away: on a phone it is on the first screen", () => {
    const { photo } = studio.address;
    if (!photo) return;
    const file = encodeURIComponent(photo.src);
    const images = tags(page(route).html, /<img\b[^>]*>/g).filter((tag) => tag.includes(file));
    expect(images, "нет <img> фото входа").toHaveLength(1);
    expect(images[0]).not.toContain('loading="lazy"');
  });

  it("leaves the hero car to the home page", () => {
    const { html } = page(route);
    expect(html).not.toContain(carFile);
    expect(html).not.toContain(studio.hero.car.src);
  });

  it("carries no real brands from the mockup", () => {
    expect(page(route).html).not.toMatch(/spectre|mansory/i);
  });
});

describe.each(langs)("built about page /%s/o-nas", (lang) => {
  const route = `${lang}${aboutPagePath}`;
  const dict = getDictionary(lang);
  const { about } = studio;
  const link = `href="${localePath(lang, aboutPagePath)}"`;

  // Нет страницы в данных — нет и ссылок на неё: навигация ведёт только на готовое
  if (!about) {
    it("is not linked from the home page: the studio has no about page", () => {
      expect(page(lang).html).not.toContain(link);
    });

    it("answers with the studio's 404 when the studio has no about page", () => expectNotFoundPage(route, lang));
    return;
  }

  it("is prerendered: `npm run build` has run", () => expectPrerendered(route));

  it("names its language and keeps route changes instant", () => expectLang(route, lang));

  it("is closed from search exactly when the studio data says so", () => expectSearchRule(route, lang));

  it("leads search and the language switch to this page", () => expectLanguageLinks(route, lang, aboutPagePath));

  it("has one main heading and is the page the navigation leads to", () => {
    const { html, head } = page(route);
    const headings = tags(html, /<h1\b[^>]*>[\s\S]*?<\/h1>/g);
    expect(headings).toHaveLength(1);
    // В заголовке страницы однобуквенные слова приклеены неразрывным пробелом, во вкладке — нет
    expect(headings[0]).toContain(escaped(glue(dict.nav.about, lang)));
    expect(head.match(/<title>([^<]*)<\/title>/)?.[1]).toContain(escaped(dict.nav.about));
    expect(page(lang).html).toContain(link);
  });

  it("serves the intro, the facts and every chapter in the markup", () => {
    const visible = markup(route);
    const texts = [
      about.intro,
      ...about.facts.map(({ label }) => label),
      ...about.chapters.flatMap(({ title, paragraphs }) => [title, ...paragraphs]),
    ];
    for (const text of texts) expect(visible).toContain(escaped(glue(t(text, lang), lang)));
    // Цифра — целым содержимым тега: «1» и «2019» есть и в классах, и в тексте глав
    for (const { value } of about.facts) expect(visible).toContain(`>${escaped(value)}</span>`);
  });

  it("loads the first chapter photo right away and the rest lazily", () => {
    const [first, ...rest] = about.chapters.map(({ photo }) => photo.src);
    // Первый кадр на первом экране телефона: ждать прокрутки ему незачем
    const file = encodeURIComponent(first);
    const images = tags(page(route).html, /<img\b[^>]*>/g).filter((tag) => tag.includes(file));
    expect(images, "нет <img> кадра первой главы").toHaveLength(1);
    expect(images[0]).not.toContain('loading="lazy"');
    expectLazyPhotos(route, rest);
  });

  it("has the call card the floating call hides at", () => {
    const call = tags(page(route).html, /<a\b[^>]*>/g).find((tag) => tag.includes(`id="${aboutCallId}"`));
    expect(call, "нет кнопки звонка карточки в конце страницы").toContain('href="tel:');
  });

  it("leaves the hero car to the home page", () => {
    const { html } = page(route);
    expect(html).not.toContain(carFile);
    expect(html).not.toContain(studio.hero.car.src);
  });

  it("carries no real brands from the mockup", () => {
    expect(page(route).html).not.toMatch(/spectre|mansory/i);
  });
});

/*
 * Данные ответа для браузера: строки self.__next_f.push([1, "…"]) подряд. Страницу 404
 * Next 16 с Cache Components отдаёт пустой оболочкой и рисует в браузере по ним (ROADMAP,
 * блок 11), поэтому тема, язык и тексты 404 проверяются здесь, а не в разметке.
 */
function flight(route: string): string {
  return [...page(route).html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)]
    .map(([, chunk]) => JSON.parse(chunk) as string)
    .join("");
}

/*
 * Страница 404 студии на этом адресе: статус, закрыта от поиска, тема и язык, вкладка — и
 * тело. Тело — строка данных с заголовком страницы: ссылки на прайс и звонок есть и в
 * шапке, текст заголовка — во вкладке, и без своей строки они нашлись бы там.
 */
function expectNotFoundPage(route: string, lang: Lang) {
  const meta = JSON.parse(readFileSync(built(route).replace(/\.html$/, ".meta"), "utf-8"));
  expect(meta.status, `${route} отвечает не 404 — или Next сменил формат`).toBe(404);
  expect(page(route).head).toMatch(/<meta name="robots" content="[^"]*noindex/);

  const dict = getDictionary(lang);
  const data = flight(route);
  expect(data).toContain(`"lang":"${lang}"`);
  // Спектр — одной переменной стопами градиента, как его ставит корневой layout
  for (const [name, color] of Object.entries(studio.theme)) {
    expect(data).toContain(`"--${name}":"${typeof color === "string" ? color : spectrumStops(color)}"`);
  }
  expect(data).toContain(`"children":"${fill(dict.notFound.metaTitle, { studio: studio.name })}"`);

  const body = data.split("\n").find((row) => row.includes(`"children":"${glue(dict.notFound.title, lang)}"`));
  expect(body, `${route}: нет заголовка страницы 404`).toBeDefined();
  const quote = quoteOnly(studio.services);
  expect(body).toContain(glue(quote ? dict.notFound.textQuote : dict.notFound.text, lang));
  expect(body).toContain(`"children":"${quote ? dict.hero.seeServices : dict.hero.checkPrice}"`);
  expect(body).toContain(`"href":"${localePath(lang, servicesPath)}"`);
  expect(body).toContain(`"href":"tel:${studio.phone}"`);
}

describe.each(langs)("built 404 page /%s/404", (lang) => {
  const route = `${lang}/404`;

  it("renders in full before answering: the 404 goes out as 404", () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), ".next", "prerender-manifest.json"), "utf-8"));
    expect(manifest.dynamicRoutes?.["/[lang]/[...missing]"]?.compute, "404 уходит до конца отрисовки").toBe("blocking");
  });

  it("is the studio's 404: theme, language, text, the way to prices and the call", () =>
    expectNotFoundPage(route, lang));
});
