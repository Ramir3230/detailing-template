import type { Dictionary } from "@/dictionaries/types";

export const ru: Dictionary = {
  header: {
    home: "Главная",
    openMenu: "Меню",
    closeMenu: "Закрыть меню",
    mainNav: "Основное",
  },
  nav: { services: "Услуги", contact: "Контакты" },
  menu: { services: "Услуги", studio: "Студия" },
  call: { label: "Позвонить", withNumber: "Позвонить: {phone}" },
  messengers: { telegram: "Telegram", whatsapp: "WhatsApp", instagram: "Instagram" },
  status: {
    open: "Открыто",
    closed: "Закрыто",
    until: "до {time}",
    opensToday: "с {time}",
    opensTomorrow: "завтра с {time}",
    opensOn: "{day} с {time}",
  },
  days: {
    short: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    on: [
      "в понедельник",
      "во вторник",
      "в среду",
      "в четверг",
      "в пятницу",
      "в субботу",
      "в воскресенье",
    ],
  },
  hours: { title: "Часы работы", closed: "выходной" },
  price: { from: "от", individual: "индивидуально", currency: "zł" },
  units: {
    hour: { one: "час", few: "часа", many: "часов", other: "часа" },
    day: { one: "день", few: "дня", many: "дней", other: "дня" },
  },
  footer: { services: "Услуги", studio: "Студия" },
  language: { label: "Язык", names: { pl: "PL", ru: "RU" } },
};
