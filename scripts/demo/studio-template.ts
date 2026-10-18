import { afterdark } from "@/content/studios/afterdark";
import type { BeforeAfter, Service, Studio } from "@/content/types";

/*
 * Демо студии «__SLUG__» — заготовка `npm run demo:new`. Всё в [квадратных скобках] —
 * заполнить: `npm run check:data` не пропустит ни одной пометки. Как заполнять — скил
 * .claude/skills/demo-studio.
 *
 * От Afterdark остаются машина hero, классы авто и кадры до/после: фото не меняем
 * (решение владельца 12.10.2026), фиолетовое на них перекрашивает scripts/recolor —
 * файлы ложатся в public/ этой папки по тем же путям. Страниц групп и O nas у демо нет:
 * у групп нет intro, у студии — about.
 *
 * Шаблон лежит в scripts/demo/studio-template.ts и проходит tsc вместе с шаблоном сайта:
 * поменялся тип студии — заготовка не собирается, пока её не поправят.
 */

/** Пара до/после Afterdark — та, что у группы стоит на главной. */
function pair(group: string): BeforeAfter {
  const found = afterdark.services
    .find(({ slug }) => slug === group)
    ?.services.find(({ beforeAfter }) => beforeAfter)?.beforeAfter;
  if (!found) throw new Error(`у Afterdark нет пары до/после группы ${group}`);
  return found;
}

/*
 * Услуга-заготовка: цена 0 не проходит тест данных, как и пометки. Длительности нет —
 * её показывает строка прайса, и выдуманная вышла бы у каждой услуги. Есть у студии —
 * `duration: { unit: "hour", min: 2, max: 3 }`.
 */
const service = (beforeAfter?: BeforeAfter): Service => ({
  name: { pl: "[Usługa]", ru: "[Услуга]" },
  price: { kind: "byClass", S: 0, M: 0, L: 0 },
  ...(beforeAfter ? { beforeAfter } : {}),
});

const day = { open: "[10:00]", close: "[18:00]" };

export const studio: Studio = {
  name: "[Nazwa Detailing]",
  logo: "[Nazwa]",
  logoCaption: "Detailing",
  tagline: afterdark.tagline,
  meta: {
    title: {
      pl: "[Nazwa] — studio detailingu, [Miasto-Dzielnica]",
      ru: "[Nazwa] — студия детейлинга, [район, город]",
    },
    description: {
      pl: "[Główne usługi — z ceną dla Twojej klasy auta od razu na stronie.]",
      ru: "[Главные услуги — с ценой для класса вашей машины сразу на сайте.]",
    },
  },
  indexed: false,
  languages: ["pl", "ru"],
  theme: { bg: "#050507", fg: "#f5f5f7", muted: "#8a8a96", accent: "[#rrggbb]" },
  phone: "[+48…]",
  messengers: [{ kind: "whatsapp", phone: "[+48…]" }],
  address: {
    street: "[Ulica i numer]",
    area: "[Miasto-Dzielnica]",
    routeUrl: "[https://maps.app.goo.gl/…]",
    photo: {
      src: "/kontakt/__SLUG__.webp",
      width: 1040,
      height: 1300,
      alt: { pl: "[Wjazd do studia wieczorem: …]", ru: "[Въезд в студию вечером: …]" },
      ai: true,
    },
    map: {
      wide: { src: "/mapa/__SLUG__.webp", width: 2272, height: 960 },
      narrow: { src: "/mapa/__SLUG__-narrow.webp", width: 1280, height: 960 },
    },
  },
  hours: [day, day, day, day, day, { open: "[10:00]", close: "[14:00]" }, null],
  hero: {
    title: afterdark.hero.title,
    subtitle: { pl: "[Studio detailingu na …]", ru: "[Студия детейлинга на …]" },
    lead: {
      pl: "[Studio detailingu na …. Główne usługi — z ceną dla Twojej klasy auta od razu na stronie.]",
      ru: "[Студия детейлинга на …. Главные услуги — с ценой для класса вашей машины сразу на сайте.]",
    },
    car: afterdark.hero.car,
  },
  carClasses: afterdark.carClasses,
  services: [
    {
      slug: "mycie-i-szyby",
      name: { pl: "Mycie i szyby", ru: "Мойка и стёкла" },
      services: [service(pair("mycie-i-szyby")), service()],
    },
    {
      slug: "lakier",
      name: { pl: "Lakier", ru: "Кузов" },
      services: [service(pair("lakier")), service()],
    },
    {
      slug: "wnetrze",
      name: { pl: "Wnętrze", ru: "Салон" },
      services: [service(pair("wnetrze")), service()],
    },
    {
      slug: "felgi-i-silnik",
      name: { pl: "Felgi i silnik", ru: "Диски и двигатель" },
      services: [service(pair("felgi-i-silnik")), service()],
    },
  ],
  priceNote: {
    pl: "[Jak studio liczy cenę: kiedy podaje ostateczną przy „od”, co z XL.]",
    ru: "[Как студия считает цену: когда называет окончательную у «от», что с XL.]",
  },
  /* Отзывов у студии нет — убрать rating, reviews: [] и дать whyUs: ролик или фото
     владельца и причины его словами (DESIGN.md, «Почему мы»; образец —
     checks/workshop-fixture) */
  rating: { value: 0, count: 0, url: "[https://maps.app.goo.gl/… — opinie w Google]" },
  reviews: [{ author: "[Imię N.]", text: { pl: "[Opinia z Google dosłownie, bez tłumaczenia]" }, source: "google" }],
};
