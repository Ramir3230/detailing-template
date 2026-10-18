import { afterdark } from "@/content/studios/afterdark";
import type { Studio } from "@/content/types";

/*
 * Автосервис — для третьего прогона `npm run check` в CI: цены «od» и фиксированные без
 * классов (переключателя нет), знак из неоновых трубок (зажигание hero рисует его кодом),
 * только польский. Как и студия в форме демо — без страниц групп, O nas, фото входа и
 * карты. Выдуманная: здесь проверяется форма данных, а не слова.
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
  address: { street: "ul. Warsztatowa 7", area: "Warszawa-Ursus" },
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
  ],
  priceNote: { pl: "Ceny „od” są orientacyjne — ostateczną podamy po obejrzeniu auta." },
  rating: { value: 4.7, count: 52 },
  reviews: [
    {
      author: "Marek W.",
      text: { pl: "Szybka diagnoza i uczciwa cena. Auto odebrane tego samego dnia." },
      source: "example",
    },
    {
      author: "Ola K.",
      text: { pl: "Klimatyzacja znowu chłodzi, wszystko wytłumaczone bez ściemy." },
      source: "example",
    },
  ],
};
