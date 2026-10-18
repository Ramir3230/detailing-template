import { afterdark } from "@/content/studios/afterdark";
import type { ServiceGroup, Studio } from "@/content/types";

/*
 * Студия в форме демо — для второго прогона `npm run check` в CI: без страниц групп и
 * O nas, в другом цвете, без фото входа и карты и без следов Afterdark. Демо собираются
 * из main, и шаблон обязан собирать такую студию, а не только Afterdark. Прайс — по
 * запросу, как у студии без цен: прайс с ценами по классу проверяет прогон на Afterdark.
 * Логотип — со знаком (public/logo), неон пола — спектром: у Afterdark ни того, ни другого.
 *
 * Тексты — Afterdark с другим названием: здесь проверяется форма данных, а не слова.
 */
const renamed = JSON.parse(JSON.stringify(afterdark).replace(/Afterdark/g, "Nocturne")) as Studio;

/* Группа без страницы: на главной видна только её первая пара до/после — остальные убраны.
   Цены — по запросу */
function withoutPage({ slug, name, services }: ServiceGroup): ServiceGroup {
  const first = services.findIndex(({ beforeAfter }) => beforeAfter);
  return {
    slug,
    name,
    services: services.map((service, i) => ({
      ...service,
      price: { kind: "individual" },
      beforeAfter: i === first ? service.beforeAfter : undefined,
    })),
  };
}

const phone = "+48500100200";

export const studio: Studio = {
  ...renamed,
  logoMark: { src: "/logo/nocturne.svg", width: 100, height: 100 },
  theme: {
    bg: "#07080a",
    fg: "#f3f4f6",
    muted: "#8b9099",
    accent: "#ff6a3d",
    spectrum: ["#ff6a3d", "#ff2d95", "#7a3dff"],
  },
  phone,
  messengers: [
    { kind: "telegram", phone },
    { kind: "whatsapp", phone },
  ],
  meta: {
    title: {
      pl: "Nocturne Detailing — studio detailingu, Warszawa-Mokotów",
      ru: "Nocturne Detailing — студия детейлинга на Мокотуве, Варшава",
    },
    description: {
      pl: "Mycie, korekta lakieru i wnętrze na Mokotowie — z ceną dla Twojej klasy auta.",
      ru: "Мойка, полировка и салон на Мокотуве — с ценой для класса вашей машины.",
    },
  },
  hero: {
    ...renamed.hero,
    subtitle: { pl: "Studio detailingu na Mokotowie", ru: "Студия детейлинга на Мокотуве" },
    lead: {
      pl: "Studio detailingu na Mokotowie. Mycie, korekta lakieru, wnętrze — z ceną dla Twojej klasy auta od razu.",
      ru: "Студия детейлинга на Мокотуве. Мойка, полировка, салон — с ценой для класса вашей машины сразу.",
    },
  },
  address: { street: "ul. Przykładowa 12", area: "Warszawa-Mokotów" },
  services: renamed.services.map(withoutPage),
  priceNote: {
    pl: "Cenę podajemy po obejrzeniu auta: zależy od stanu lakieru i wybranych usług.",
    ru: "Цену называем после осмотра машины: она зависит от состояния лака и выбранных услуг.",
  },
  rating: { value: 4.8, count: 37 },
  reviews: [
    {
      author: "Anna P.",
      text: {
        pl: "Szybko, czysto i w cenie ze strony. Polecam.",
        ru: "Быстро, чисто и по цене с сайта. Рекомендую.",
      },
      source: "example",
    },
  ],
  /* «Почему мы» с фото рядом с отзывами: карточки «первые отзывы» при отзывах нет, даже со ссылкой */
  whyUs: {
    points: [
      { pl: "Myjemy i polerujemy tylko ręcznie.", ru: "Моем и полируем только вручную." },
      { pl: "Termin ustalamy od razu przez telefon.", ru: "Время согласуем сразу по телефону." },
      { pl: "Po pracy pokazujemy efekt w świetle lamp.", ru: "После работы показываем результат под лампами." },
    ],
    media: {
      kind: "photo",
      photo: {
        src: "/o-nas/hala.webp",
        width: 1040,
        height: 1300,
        alt: { pl: "Hala studia Nocturne w świetle lamp", ru: "Зал студии Nocturne под лампами" },
        ai: true,
      },
    },
    reviewUrl: "https://www.google.com/maps/search/?api=1&query=Nocturne+Detailing",
  },
  about: undefined,
};
