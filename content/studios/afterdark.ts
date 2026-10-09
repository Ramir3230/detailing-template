import type { BeforeAfter, Studio } from "@/content/types";

/*
 * Пары до/после сделаны ИИ (scripts/before-after/<пара>.json) и подписаны на странице
 * как примеры: у выдуманной студии нет своих работ, а чужие брать нельзя.
 */
function aiPair(slug: string, label: string, before: string, after: string): BeforeAfter {
  const frame = (file: string, alt: string) => ({
    src: `/przed-po/${slug}/${file}.webp`,
    width: 1040,
    height: 1300,
    alt: { pl: alt },
    ai: true,
  });
  return { label: { pl: label }, before: frame("przed", before), after: frame("po", after) };
}

/**
 * Выдуманная студия шаблона (BRIEF.md). Тексты и цены — с холста дизайна.
 * Адрес — явная заглушка, телефон никуда не звонит: у выдуманной студии не должно
 * быть чужого реального адреса и номера. По той же причине мессенджеры открываются
 * по этому же номеру, а Instagram не указан: любое имя может оказаться чужим.
 */
export const afterdark: Studio = {
  name: "Afterdark Detailing",
  logo: "Afterdark",
  logoCaption: "Detailing",
  tagline: { pl: "Studio detailingu" },
  meta: {
    title: { pl: "Afterdark Detailing — studio detailingu, Warszawa-Wola" },
    description: {
      pl: "Korekta lakieru, ceramika, wnętrze — z ceną dla Twojej klasy auta od razu na stronie.",
    },
  },
  indexed: false,
  languages: ["pl"],
  theme: {
    bg: "#050507",
    fg: "#f5f5f7",
    muted: "#8a8a96",
    accent: "#b14bff",
  },
  phone: "+48000000000",
  messengers: [
    { kind: "telegram", phone: "+48000000000" },
    { kind: "whatsapp", phone: "+48000000000" },
  ],
  address: {
    street: "[Ulica i numer]",
    area: "Warszawa-Wola",
    /* Сделано ИИ, scripts/before-after/wejscie.json: вход SPECTRE с вывеской не берём */
    photo: {
      src: "/kontakt/wejscie.webp",
      width: 1040,
      height: 1300,
      alt: { pl: "Wjazd do studia wieczorem: otwarta brama, światło w środku" },
      ai: true,
    },
  },
  hours: [
    { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" },
    { open: "10:00", close: "18:00" },
    null,
  ],
  hero: {
    title: { pl: "Twoje auto.\nNowy poziom." },
    subtitle: { pl: "Studio detailingu na Woli" },
    lead: {
      pl: "Studio detailingu na Woli. Korekta lakieru, ceramika, wnętrze — z ceną dla Twojej klasy auta od razu na stronie.",
    },
    /* M3 из мокапа, вырезка scripts/hero-car/m3.json */
    car: {
      src: "/hero/m3/car.webp",
      lights: "/hero/m3/car-lights.webp",
      depth: "/hero/m3/car-depth.webp",
      width: 2000,
      height: 1501,
      headlights: [
        { x: 16.4, y: 55.7, w: 16.4 },
        { x: 83.7, y: 55.3, w: 16.2 },
      ],
      /* Трубка — по ширине передней губы; колёса почти спрятаны за расширенными крыльями */
      underglow: {
        tube: [15, 85],
        wheels: [
          { x: 7, w: 9 },
          { x: 93, w: 9 },
        ],
      },
    },
  },
  carClasses: {
    S: { pl: "Małe samochody, segment kompaktowy" },
    M: { pl: "Sedany, kombi, średniej wielkości SUV-y" },
    L: { pl: "Duże SUV-y, samochody terenowe, minivany, pickupy" },
    XL: { pl: "Samochody o niestandardowych wymiarach" },
  },
  services: [
    {
      slug: "mycie-i-szyby",
      name: { pl: "Mycie i szyby" },
      services: [
        {
          name: { pl: "Mycie detailingowe nadwozia" },
          price: { kind: "byClass", S: 200, M: 220, L: 250 },
          beforeAfter: aiPair(
            "mycie",
            "Mycie",
            "Kombi przed myciem: błoto na progach i nadkolach, kurz na lakierze",
            "To samo kombi po myciu: czysty, błyszczący lakier",
          ),
        },
        {
          name: { pl: "Kompleks detailingowy" },
          price: { kind: "byClass", S: 300, M: 330, L: 350 },
        },
        {
          name: { pl: "Powłoka hydrofobowa „Niewidzialna wycieraczka”" },
          note: { pl: "Wszystkie klasy, na wszystkie szyby" },
          price: { kind: "fixed", amount: 300 },
        },
        {
          name: { pl: "Polerowanie szyb + powłoka ceramiczna" },
          price: { kind: "byClass", S: 350, M: 400, L: 450 },
        },
      ],
    },
    {
      slug: "lakier",
      name: { pl: "Lakier" },
      intro: {
        pl: "Korekta usuwa rysy i hologramy, ceramika utrwala efekt. Cena zależy od klasy auta i liczby etapów.",
      },
      services: [
        {
          name: { pl: "Jednoetapowa korekta lakieru" },
          price: { kind: "byClass", S: 1000, M: 1150, L: 1300 },
          duration: { unit: "day", min: 1 },
          scope: [
            { pl: "Mycie i dekontaminacja lakieru" },
            { pl: "Pomiar grubości lakieru przed pracą" },
            { pl: "Polerowanie jednym etapem: lekkie rysy i hologramy" },
            { pl: "Kontrola efektu w świetle studyjnym" },
          ],
          beforeAfter: aiPair(
            "lakier",
            "Lakier",
            "Czarny lakier przed korektą: hologramy i rysy wokół odbić światła",
            "Ten sam lakier po korekcie: lustrzane odbicia lamp",
          ),
        },
        {
          name: { pl: "Wieloetapowa korekta lakieru — 3 etapy + powłoka ceramiczna" },
          brand: "GYEON",
          price: { kind: "byClass", S: 3300, M: 3600, L: 4000 },
          duration: { unit: "day", min: 3, max: 4 },
          scope: [
            { pl: "Wszystko z korekty jednoetapowej" },
            { pl: "Trzy etapy polerowania: głębsze rysy i zmatowienia" },
            { pl: "Powłoka ceramiczna GYEON" },
            { pl: "Utwardzanie powłoki w studiu" },
          ],
        },
      ],
      faq: [
        {
          question: { pl: "Ile trwa korekta lakieru?" },
          answer: {
            pl: "Jednoetapowa — jeden dzień. Wieloetapowa z ceramiką — 3–4 dni: powłoka musi utwardzić się w studiu, zanim auto wyjedzie na deszcz.",
          },
        },
      ],
    },
    {
      slug: "wnetrze",
      name: { pl: "Wnętrze" },
      services: [
        {
          name: { pl: "Ozonowanie wnętrza" },
          note: { pl: "Wszystkie klasy" },
          price: { kind: "fixed", amount: 120 },
        },
        {
          name: { pl: "Kompleksowe czyszczenie wnętrza" },
          price: { kind: "byClass", S: 800, M: 900, L: 1000 },
          beforeAfter: aiPair(
            "wnetrze",
            "Wnętrze",
            "Jasny skórzany fotel przed czyszczeniem: plamy, okruchy i brud w szwach",
            "Ten sam fotel po czyszczeniu",
          ),
        },
        {
          name: { pl: "Kompleksowe czyszczenie wnętrza z demontażem elementów" },
          note: { pl: "Ostateczna cena zależy od stanu samochodu i zakresu prac" },
          price: { kind: "from", amount: 1500 },
        },
      ],
    },
    {
      slug: "felgi-i-silnik",
      name: { pl: "Felgi i silnik" },
      services: [
        {
          name: { pl: "Dokładne czyszczenie felg, powłoka ceramiczna" },
          price: { kind: "byClass", S: 450, M: 500, L: 550 },
        },
        {
          name: { pl: "Detailing komory silnika" },
          note: { pl: "Ostateczna cena ustalana jest po oględzinach samochodu" },
          price: { kind: "from", amount: 600 },
        },
      ],
    },
  ],
  rating: { value: 5, count: 24 },
  reviews: [
    {
      author: "Marta K.",
      text: {
        pl: "Oddałam auto po zimie, z rysami po myjni automatycznej. Odebrałam je wieczorem i przez chwilę myślałam, że to nie moje. Wszystko wytłumaczone, cena taka, jak na stronie.",
      },
      source: "example",
    },
    {
      author: "Tomasz W.",
      text: {
        pl: "Powłoka ceramiczna na nowym kombi. Przed pracą zmierzyli lakier i wytłumaczyli, czym różni się korekta jednoetapowa od wieloetapowej. Po deszczu woda sama spływa, a auto myję dwa razy rzadziej.",
      },
      source: "example",
    },
    {
      author: "Kasia R.",
      text: {
        pl: "Po wakacjach z psem wnętrze wyglądało fatalnie. Po kompleksowym czyszczeniu nie ma ani sierści, ani zapachu. Zadzwonili, kiedy auto było gotowe, i odebrałam je po pracy, o dwudziestej pierwszej.",
      },
      source: "example",
    },
  ],
};
