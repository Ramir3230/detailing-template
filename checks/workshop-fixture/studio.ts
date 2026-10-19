import { afterdark } from "@/content/studios/afterdark";
import type { Studio } from "@/content/types";

/*
 * Автосервис — для третьего прогона `npm run check` в CI: цены «od» и фиксированные без
 * классов (переключателя классов нет), шиномонтаж с ценой по размеру диска (свой
 * переключатель над группой), знак из неоновых трубок (зажигание hero рисует его кодом),
 * только польский. Только открылся: отзывов и рейтинга нет, вместо них «Почему мы» с
 * роликом владельца на русском и польскими субтитрами. Как и студия в форме демо — без
 * страниц групп, O nas и фото входа, но с картой: она встаёт на место фото в контактах
 * главной. Выдуманная: здесь проверяется форма данных, а
 * не слова; ролик и обложка — цветной квадрат на тёмном фоне из ffmpeg (lavfi color и
 * drawbox, H.264 с -movflags +faststart), несколько КБ.
 */
const phone = "+48500300400";

export const studio: Studio = {
  name: "Iskra Auto Serwis",
  logo: "ISKRA",
  logoMark: { src: "/logo/iskra.svg", width: 100, height: 100 },
  logoCaption: "Auto Serwis",
  tagline: { pl: "Warsztat samochodowy" },
  meta: {
    title: { pl: "Iskra Auto Serwis — warsztat samochodowy, Warszawa-Ursus" },
    description: { pl: "Mechanika, diagnostyka i klimatyzacja na Ursusie — z cenami od razu na stronie." },
  },
  indexed: false,
  languages: ["pl"],
  theme: {
    bg: "#08090b",
    fg: "#f3f4f6",
    muted: "#8b9099",
    accent: "#3de0e8",
  },
  phone,
  messengers: [{ kind: "whatsapp", phone }],
  address: {
    street: "ul. Warsztatowa 7",
    area: "Warszawa-Ursus",
    /* Без фото входа: карта встаёт на его место в контактах главной и ведёт на маршрут
       (карту без маршрута на странице Kontakt держит Afterdark). Файлы — карта Afterdark
       под своим именем */
    routeUrl: "https://www.google.com/maps/dir/?api=1&destination=Iskra+Auto+Serwis%2C+Warsztatowa+7%2C+Warszawa",
    map: {
      wide: { src: "/mapa/iskra.webp", width: 2272, height: 960 },
      narrow: { src: "/mapa/iskra-narrow.webp", width: 1280, height: 960 },
    },
  },
  hours: [
    { open: "08:00", close: "18:00" },
    { open: "08:00", close: "18:00" },
    { open: "08:00", close: "18:00" },
    { open: "08:00", close: "18:00" },
    { open: "08:00", close: "18:00" },
    { open: "09:00", close: "14:00" },
    null,
  ],
  hero: {
    title: afterdark.hero.title,
    subtitle: { pl: "Warsztat samochodowy na Ursusie" },
    lead: { pl: "Warsztat na Ursusie. Mechanika, diagnostyka i klimatyzacja — z cenami od razu na stronie." },
    car: afterdark.hero.car,
  },
  carClasses: afterdark.carClasses,
  services: [
    {
      slug: "mechanika",
      name: { pl: "Mechanika" },
      services: [
        { name: { pl: "Wymiana oleju i filtrów" }, price: { kind: "from", amount: 120 } },
        { name: { pl: "Wymiana klocków hamulcowych" }, note: { pl: "Jedna oś" }, price: { kind: "from", amount: 150 } },
        { name: { pl: "Wymiana rozrządu" }, price: { kind: "from", amount: 900 } },
        { name: { pl: "Geometria kół" }, price: { kind: "fixed", amount: 180 } },
      ],
    },
    {
      slug: "diagnostyka",
      name: { pl: "Diagnostyka i klimatyzacja" },
      services: [
        { name: { pl: "Diagnostyka komputerowa" }, price: { kind: "fixed", amount: 120 } },
        { name: { pl: "Serwis klimatyzacji" }, price: { kind: "from", amount: 200 } },
      ],
    },
    {
      slug: "wulkanizacja",
      name: { pl: "Wulkanizacja" },
      services: [
        {
          name: { pl: "Wymiana opon z wyważeniem" },
          price: { kind: "byRim", rims: { R15: 45, R16: 50, R17: 55, R18: 60, R19: 70 } },
        },
        { name: { pl: "Czujnik ciśnienia TPMS" }, note: { pl: "Dopłata za sztukę" }, price: { kind: "fixed", amount: 10 } },
      ],
    },
  ],
  priceNote: { pl: "Ceny „od” są orientacyjne — ostateczną podamy po obejrzeniu auta." },
  reviews: [],
  whyUs: {
    points: [
      { pl: "Przy każdej wizycie sprawdzamy hamulce, zawieszenie i silnik." },
      { pl: "Kosztorys przed naprawą, protokół po niej." },
      { pl: "Naprawiamy auta wszystkich marek." },
    ],
    media: {
      kind: "video",
      video: {
        src: "/wideo/iskra.mp4",
        poster: {
          src: "/wideo/iskra.webp",
          width: 1040,
          height: 1300,
          alt: { pl: "Właściciel warsztatu Iskra przed bramą" },
          ai: false,
        },
        lang: "ru",
        captions: [{ lang: "pl", src: "/wideo/iskra-pl.vtt" }],
      },
    },
    reviewUrl: "https://www.google.com/maps/search/?api=1&query=Iskra+Auto+Serwis",
  },
};
