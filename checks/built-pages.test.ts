import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { studio } from "@/content/studio";
import type { Service } from "@/content/types";
import { getDictionary } from "@/dictionaries";
import { defaultCarClass } from "@/lib/car-class";
import { homePairServices } from "@/lib/compare";
import { glue, priceParts } from "@/lib/format";
import { langs, localePath, t, type Lang } from "@/lib/i18n";
import { contactPagePath, groupPagePath, groupSectionIds, hasGroupPage, sectionIds } from "@/lib/nav";

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
  const published = (studio.languages as readonly Lang[]).includes(lang);
  const { head } = page(route);
  // Открытый сайт: noindex нигде в <head> — ни в robots, ни в googlebot, ни в другом виде
  if (studio.indexed && published) expect(head).not.toMatch(/noindex/i);
  else expect(head.match(/<meta name="robots" content="([^"]*)"/)?.[1]).toContain("noindex");
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

  it("loads the photos below the hero lazily: they never compete with the hero car", () => {
    const services = homePairServices(studio.services);
    expectLazyPhotos(lang, [...pairPhotos(services), ...(studio.address.photo ? [studio.address.photo.src] : [])]);
  });

  it("leaves the pairs beyond the first of each group to their group pages", () => {
    const home = new Set(homePairServices(studio.services));
    const rest = studio.services.flatMap((group) => group.services).filter((service) => !home.has(service));
    const { html } = page(lang);
    // И в адресе оптимизатора картинок, и в данных клиентского компонента
    for (const src of pairPhotos(rest)) {
      for (const text of [src, encodeURIComponent(src)]) expect(html, `кадр ${src} на главной`).not.toContain(text);
    }
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
});

describe.each(groupPages)("built group page /$route", ({ lang, group, route }) => {
  it("is prerendered: `npm run build` has run", () => expectPrerendered(route));

  it("names its language and keeps route changes instant", () => expectLang(route, lang));

  it("is closed from search exactly when the studio data says so", () => expectSearchRule(route, lang));

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
