import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { studio } from "@/content/studio";
import { afterdark } from "@/content/studios/afterdark";
import type { Photo, Studio, Text } from "@/content/types";
import { SPECTRUM_MAX } from "@/lib/car-volume";
import { homePairServices, maxGroupPairs } from "@/lib/compare";
import { markShapes } from "@/lib/mark";
import { RIMS_MAX, inches, rimAmounts } from "@/lib/rims";
import { messengerHref, telHref } from "@/lib/contact";
import { hasGroupPage, sectionIds } from "@/lib/nav";
import { publishedLangs } from "@/lib/seo";

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
      // Номер страницы Facebook из ссылки profile.php?id=…
      else if ("id" in messenger) expect(messenger.id).toMatch(/^\d{5,20}$/);
      // У Facebook в имени нет «_», и оно бывает длиннее
      else if (messenger.kind === "facebook") expect(messenger.username).toMatch(/^[A-Za-z0-9.]{5,50}$/);
      else expect(messenger.username).toMatch(/^[A-Za-z0-9._]{3,32}$/);
      expect(() => new URL(messengerHref(messenger))).not.toThrow();
    }
    // Кнопка на вид: два адреса одного мессенджера — две одинаковые кнопки и один ключ React
    const kinds = studio.messengers.map(({ kind }) => kind);
    expect(new Set(kinds).size).toBe(kinds.length);
    // Пилюли меню встают в ряд: четыре на 375 вылезают за край, раскладки четырёх в
    // DESIGN.md нет (ROADMAP, «11. Демо под студию»)
    expect(kinds.length, "четыре мессенджера не помещаются в меню на 375").toBeLessThanOrEqual(3);
  });

  it("has whole prices: the price counter shows digits only", () => {
    for (const group of studio.services) {
      for (const { price } of group.services) {
        const amounts =
          price.kind === "byClass"
            ? [price.S, price.M, price.L]
            : price.kind === "byRim"
              ? rimAmounts(price).map(({ amount }) => amount)
              : "amount" in price
                ? [price.amount]
                : [];
        for (const amount of amounts) expect(Number.isInteger(amount) && amount > 0).toBe(true);
      }
    }
  });

  it("has rim prices the switch can show: sizes in a row, the same across the group", () => {
    for (const group of studio.services) {
      const rims = group.services.flatMap(({ price }) =>
        price.kind === "byRim" ? [rimAmounts(price).map(({ size }) => size)] : [],
      );
      for (const sizes of rims) {
        expect(sizes.length, `${group.slug}: один размер диска — это цена fixed`).toBeGreaterThanOrEqual(2);
        // Рядом с колесом на 375 кнопки размеров не уже 44 px
        expect(sizes.length, `${group.slug}: размеров диска больше, чем встаёт в ряд`).toBeLessThanOrEqual(RIMS_MAX);
        // Пропуск в ряду переключатель показал бы так, будто размера нет вовсе
        const gaps = sizes.slice(1).filter((size, i) => inches(size) !== inches(sizes[i]) + 1);
        expect(gaps, `${group.slug}: размеры диска не подряд`).toEqual([]);
        // Переключатель у группы один: у всех её услуг по диску одни размеры
        expect(sizes, `${group.slug}: разные размеры диска в одной группе`).toEqual(rims[0]);
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

  it("has at least one service group: the group route builds on the first one", () => {
    expect(studio.services.length).toBeGreaterThan(0);
  });

  it("gives every service of a group page its duration and scope", () => {
    for (const group of studio.services.filter(hasGroupPage)) {
      for (const service of group.services) {
        expect(service.duration, `${group.slug}: ${service.name.pl} без длительности`).toBeDefined();
        expect(service.scope?.length, `${group.slug}: ${service.name.pl} без состава`).toBeGreaterThan(0);
      }
    }
  });

  it("explains how the studio sets its prices: the line under the price list", () => {
    expect(studio.priceNote.pl.trim()).not.toBe("");
  });

  it("has a rating exactly when it has reviews: a studio without them shows neither", () => {
    // DESIGN.md, «Студия без отзывов»: рейтинг без отзывов звал бы к разделу, которого нет,
    // а отзывы без рейтинга остались бы без строки со ссылкой на Google
    expect(Boolean(studio.rating), "рейтинг есть тогда и только тогда, когда есть отзывы").toBe(
      studio.reviews.length > 0,
    );
  });

  it("has a real rating: Google stars from above 0 to 5 and a whole review count", () => {
    if (!studio.rating) return;
    // Hero и отзывы показывают его числом — «0,0» у заготовки демо вышло бы на страницу
    const { value, count } = studio.rating;
    expect(value > 0 && value <= 5, `рейтинг ${value}`).toBe(true);
    expect(Number.isInteger(count) && count > 0, `отзывов ${count}`).toBe(true);
  });

  it("has https links for the route and the Google reviews", () => {
    for (const url of [studio.address.routeUrl, studio.rating?.url, studio.whyUs?.reviewUrl]) {
      if (url) expect(new URL(url).protocol).toBe("https:");
    }
  });

  it("has the site address as https and without a path: canonical and hreflang build on it", () => {
    if (!studio.url) return;
    const url = new URL(studio.url);
    expect(url.protocol).toBe("https:");
    expect(url.pathname).toBe("/");
  });

  it("leaves no demo leftovers once the site is open for search", () => {
    if (!studio.indexed) return;
    if (studio.rating) expect(studio.rating.url).toBeTruthy();
    // Домен клиента: без него canonical может уйти на голый домен с перенаправлением
    expect(studio.url).toBeTruthy();
    expect(studio.reviews.every((review) => review.source === "google")).toBe(true);
    // Заглушка до фото — одинаковые «до» и «после»: открытый сайт с ней не выходит
    for (const group of studio.services) {
      for (const { beforeAfter } of group.services) {
        if (!beforeAfter) continue;
        const [before, after] = [beforeAfter.before, beforeAfter.after].map(({ src }) =>
          readFileSync(join(process.cwd(), "public", src)),
        );
        expect(before.equals(after), `${beforeAfter.label.pl}: заглушка вместо фото`).toBe(false);
      }
    }
  });

  it("has a readable theme: hex colors, text and accent at 4.5:1 to the background", () => {
    const { bg, fg, muted, accent, spectrum = [] } = studio.theme;
    for (const color of [bg, fg, muted, accent, ...spectrum]) expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    for (const color of [fg, muted, accent]) expect(contrast(color, bg)).toBeGreaterThanOrEqual(4.5);
    // Спектр — переход хотя бы двух цветов; больше SPECTRUM_MAX шейдер неона не возьмёт.
    // Это только свет пола, текстом он не бывает — контраст ему не нужен
    if (studio.theme.spectrum) expect(spectrum.length).toBeGreaterThanOrEqual(2);
    expect(spectrum.length).toBeLessThanOrEqual(SPECTRUM_MAX);
  });

  it("has the logo mark it names: a vector SVG in public/logo/ the size of its viewBox", () => {
    const mark = studio.logoMark;
    if (!mark) return;
    // Только SVG: знак стоит и в шапке, и в hero, и в иконке вкладки — растр где-то вышел
    // бы мыльным, а иконку рисует ImageResponse, который WebP не читает. Только в
    // public/logo/: иконка читает знак оттуда, не утягивая в функции весь public/
    expect(mark.src).toMatch(/^\/logo\/[\w-]+\.svg$/);
    const file = join(process.cwd(), "public", mark.src);
    expect(existsSync(file), `нет файла знака public${mark.src}`).toBe(true);
    const svg = readFileSync(file, "utf-8");
    const box = svg.match(/viewBox="([^"]+)"/)?.[1].trim().split(/[\s,]+/).map(Number);
    expect(box, "у знака нет viewBox").toHaveLength(4);
    expect({ width: box?.[2], height: box?.[3] }).toEqual({ width: mark.width, height: mark.height });
    // Контуры, а не растр в обёртке SVG и не буквы: надпись стоит рядом текстом, а иконка
    // без шрифта нарисовала бы на месте букв пустоту
    expect(svg, "в знаке растр или текст").not.toMatch(/<image\b|<text\b/);
    // Знак из трубок hero рисует кодом по одному <path>: то, что там вышло бы не так, как
    // картинка в шапке, — ошибка с причиной (DESIGN.md, «Знак студии»)
    const shapes = markShapes(svg);
    expect(shapes.kind === "invalid" ? shapes.reason : "", "знак из трубок").toBe("");
    // Знак — фигура рядом с надписью: широкий оттеснил бы её к кнопке меню в шапке телефона
    expect(mark.width / mark.height, "знак шире 3:2").toBeLessThanOrEqual(1.5);
    // Шапка 375 со знаком (замер 15.10.2026): 10 знаков встают и из самых широких букв, 12
    // с пробелом переносятся, без пробела выталкивают кнопку меню за край
    expect(studio.logo.length, "надпись рядом со знаком длиннее 10 знаков").toBeLessThanOrEqual(10);
  });

  it("has every studio text in each published language", () => {
    // Без перевода на /ru/ молча встал бы польский: t() подставляет его вместо пустого.
    // Отзыв из Google — цитата человека, его показывают как написан
    const texts = studioTexts({ ...studio, reviews: studio.reviews.filter(({ source }) => source !== "google") });
    expect(texts.map(([path]) => path)).toContain("hero.title");
    const missing = publishedLangs.flatMap((lang) =>
      texts.flatMap(([path, text]) => (text[lang]?.trim() ? [] : [`${lang}: ${path}`])),
    );
    expect(missing).toEqual([]);
  });

  it("is Afterdark in the template itself: a demo is put in only for a look or an upload", () => {
    // Демо стоит (npm run demo:use, копия demo:deploy, check-demo в CI) — .demo-active есть.
    // Нет его, а студия чужая — значит, шаблон собираются коммитить с реальной студией
    if (existsSync(join(process.cwd(), ".demo-active"))) return;
    expect(studio, "в шаблоне стоит не Afterdark — снять демо: npm run demo:use -- --reset").toBe(afterdark);
  });

  it("carries nothing of Afterdark once another studio is active: the demo is its own studio", () => {
    if (studio === afterdark) return;
    // Название, логотип, подписи кадров и файлы Afterdark — карта и фото входа названы по студии
    expect(JSON.stringify(studio)).not.toMatch(/afterdark/i);
    // Пометка заготовки demo:new в квадратных скобках — место ещё не заполнено
    expect(strings(studio).filter((text) => /\[[^\]]*\]/.test(text))).toEqual([]);
    const phones = [studio.phone, ...studio.messengers.flatMap((item) => ("phone" in item ? [item.phone] : []))];
    expect(phones).not.toContain(afterdark.phone);
    // Отзывы и рейтинг Afterdark выдуманы: у чужой студии они выдали бы себя за её клиентов
    const examples = new Set(afterdark.reviews.map(({ text }) => text.pl));
    expect(studio.reviews.filter(({ text }) => examples.has(text.pl))).toEqual([]);
    expect(studio.rating, "рейтинг Afterdark").not.toEqual(afterdark.rating);
    // Тексты о самой студии и её месте — «na Woli», «Warszawa-Wola»
    const own = ({ hero, meta, about }: Studio) =>
      [hero.subtitle, hero.lead, meta.title, meta.description, about?.intro].flatMap((text) => (text ? [text.pl] : []));
    const afterdarkTexts = new Set(own(afterdark));
    expect(own(studio).filter((text) => afterdarkTexts.has(text))).toEqual([]);
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
    // Видимость ореола — доля: 0 погасил бы свет фар целиком, больше 1 прозрачность не бывает
    if (car.halo !== undefined) expect(car.halo > 0 && car.halo <= 1).toBe(true);
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
    // Вкладки делят ширину поровну: на телефоне 375 px помещаются четыре по 9 знаков, в
    // колонке текста страницы группы на десктопе — три (DESIGN.md, «До/после»). Главная
    // сама берёт не больше четырёх, страница группы — все пары группы
    for (const group of studio.services) {
      const count = group.services.filter(({ beforeAfter }) => beforeAfter).length;
      expect(count, `${group.slug}: пар больше, чем вкладок`).toBeLessThanOrEqual(maxGroupPairs);
    }
    // Пара, которой нет на главной, видна только на странице группы — значит, страница нужна
    const home = new Set(homePairServices(studio.services));
    for (const group of studio.services.filter((item) => !hasGroupPage(item))) {
      for (const service of group.services) {
        if (!service.beforeAfter) continue;
        expect(home.has(service), `${group.slug}: пару ${service.beforeAfter.label.pl} не видно нигде`).toBe(true);
      }
    }
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

  it("has the about page filled in, if there is one", () => {
    const { about } = studio;
    if (!about) return;
    expect(about.intro.pl.trim()).not.toBe("");
    // DESIGN.md, «Страница O nas»: цифры встают в ряд по три и на телефоне 375 px — до
    // четырёх знаков широким шрифтом: «2019» занимает колонку почти целиком
    expect(about.facts.length).toBeLessThanOrEqual(3);
    for (const { value, label } of about.facts) {
      expect(value.trim().length).toBeGreaterThan(0);
      expect(value.length).toBeLessThanOrEqual(4);
      expect(label.pl.trim()).not.toBe("");
    }
    expect(about.chapters.length).toBeGreaterThan(0);
    for (const { title, paragraphs, photo } of about.chapters) {
      expect(title.pl.trim()).not.toBe("");
      expect(paragraphs.length, `${title.pl}: без текста`).toBeGreaterThan(0);
      for (const paragraph of paragraphs) expect(paragraph.pl.trim()).not.toBe("");
      expectFrame(photo);
    }
    // По этим строкам React различает главы, абзацы и цифры
    const unique = (items: string[]) => expect(new Set(items).size).toBe(items.length);
    unique(about.chapters.map(({ photo }) => photo.src));
    unique(about.facts.map(({ label }) => label.pl));
    for (const { paragraphs } of about.chapters) unique(paragraphs.map(({ pl }) => pl));
  });

  it("has why us filled in, if there is one: three or four short points and its frame", () => {
    const { whyUs } = studio;
    if (!whyUs) return;
    // DESIGN.md, «Почему мы»: пункт до 90 знаков — на 375 px не больше трёх строк
    expect(whyUs.points.length).toBeGreaterThanOrEqual(3);
    expect(whyUs.points.length).toBeLessThanOrEqual(4);
    for (const point of whyUs.points) {
      for (const text of [point.pl, point.ru ?? ""]) expect(text.length, text).toBeLessThanOrEqual(90);
    }
    // По польскому тексту React различает пункты
    expect(new Set(whyUs.points.map(({ pl }) => pl)).size).toBe(whyUs.points.length);
    if (whyUs.media.kind === "photo") {
      expectFrame(whyUs.media.photo);
      return;
    }
    const { video } = whyUs.media;
    expectFrame(video.poster);
    expect(video.src).toMatch(/^\/[\w\-/]+\.mp4$/);
    const file = join(process.cwd(), "public", video.src);
    expect(existsSync(file), `нет файла ролика public${video.src}`).toBe(true);
    expectPlayableMp4(readFileSync(file));
    // Дорожка на язык одна: страница берёт первую
    const langs = video.captions.map(({ lang }) => lang);
    expect(new Set(langs).size, "две дорожки субтитров на одном языке").toBe(langs.length);
    for (const lang of publishedLangs) {
      const captions = video.captions.find((item) => item.lang === lang)?.src;
      // Ролик на другом языке без субтитров на странице не понять
      if (lang !== video.lang) expect(captions, `${lang}: нет субтитров к ролику`).toBeDefined();
      if (!captions) continue;
      expect(captions).toMatch(/^\/[\w\-/]+\.vtt$/);
      const path = join(process.cwd(), "public", captions);
      expect(existsSync(path), `нет файла субтитров public${captions}`).toBe(true);
      const vtt = readFileSync(path, "utf-8");
      // Без «WEBVTT» в начале браузер дорожку молча не покажет
      expect(vtt.startsWith("WEBVTT"), `${captions}: не WebVTT`).toBe(true);
      expect(vtt, `${captions}: ни одной реплики`).toMatch(/\d\d:\d\d\.\d{3} --> /);
    }
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

/*
 * MP4, который браузер начнёт играть, не скачав целиком (DESIGN.md, «Фотографии»): индекс
 * moov раньше данных mdat, видео H.264 (avc1) — его играют все браузеры, HEVC — нет.
 */
function expectPlayableMp4(file: Buffer) {
  const boxes: string[] = [];
  for (let at = 0; at + 8 <= file.length; ) {
    const size = file.readUInt32BE(at);
    boxes.push(file.toString("ascii", at + 4, at + 8));
    // 1 — размер в 64 битах сразу за типом, 0 — коробка до конца файла
    const length = size === 1 ? Number(file.readBigUInt64BE(at + 8)) : size === 0 ? file.length - at : size;
    if (length < 8) break;
    at += length;
  }
  expect(boxes[0], "не MP4: первая коробка не ftyp").toBe("ftyp");
  expect(boxes, "нет индекса moov").toContain("moov");
  expect(boxes, "нет данных mdat").toContain("mdat");
  expect(boxes.indexOf("moov"), "индекс moov после данных — ffmpeg -movflags +faststart").toBeLessThan(
    boxes.indexOf("mdat"),
  );
  expect(file.includes("avc1"), "видео не H.264").toBe(true);
}

/* Тексты студии с путём до каждого: «services[1].faq[0].answer». */
function studioTexts(value: unknown, path = ""): [string, Text][] {
  if (Array.isArray(value)) return value.flatMap((item, i) => studioTexts(item, `${path}[${i}]`));
  if (!value || typeof value !== "object") return [];
  if (typeof (value as Text).pl === "string") return [[path, value as Text]];
  return Object.entries(value).flatMap(([key, item]) => studioTexts(item, path ? `${path}.${key}` : key));
}

/* Все строки данных, включая пути файлов и ссылки. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(strings);
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
