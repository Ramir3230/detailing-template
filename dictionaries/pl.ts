import type { Dictionary } from "@/dictionaries/types";

export const pl: Dictionary = {
  header: {
    home: "Strona główna",
    openMenu: "Menu",
    closeMenu: "Zamknij menu",
    mainNav: "Główne",
  },
  nav: { services: "Usługi", contact: "Kontakt" },
  menu: { services: "Usługi", studio: "Studio" },
  call: { label: "Zadzwoń", withNumber: "Zadzwoń: {phone}" },
  messengers: { telegram: "Telegram", whatsapp: "WhatsApp", instagram: "Instagram" },
  status: {
    open: "Otwarte",
    closed: "Zamknięte",
    until: "do {time}",
    opensToday: "od {time}",
    opensTomorrow: "jutro od {time}",
    opensOn: "{day} od {time}",
  },
  days: {
    short: ["Pn", "Wt", "Śr", "Cz", "Pt", "Sob", "Nd"],
    on: [
      "w poniedziałek",
      "we wtorek",
      "w środę",
      "w czwartek",
      "w piątek",
      "w sobotę",
      "w niedzielę",
    ],
  },
  hours: { title: "Godziny", closed: "nieczynne" },
  price: { from: "od", individual: "indywidualnie", currency: "zł" },
  units: {
    hour: { one: "godzina", few: "godziny", many: "godzin", other: "godziny" },
    day: { one: "dzień", few: "dni", many: "dni", other: "dnia" },
  },
  footer: { services: "Usługi", studio: "Studio" },
  language: { label: "Język", names: { pl: "PL", ru: "RU" } },
};
