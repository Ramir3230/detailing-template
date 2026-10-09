import type { BeforeAfter, Studio } from "@/content/types";

/** Кадр пары: подпись для диктора и сделан ли он ИИ. */
type Frame = { alt: string; ai: boolean };

/*
 * Пары до/после в public/przed-po/<пара>/, 1040×1300. У выдуманной студии своих работ
 * нет: кадры ИИ подписаны на странице как примеры (DESIGN.md, «Фотографии»).
 */
function pair(
  slug: string,
  label: string,
  before: Frame,
  after: Frame,
): BeforeAfter {
  const photo = (file: string, { alt, ai }: Frame) => ({
    src: `/przed-po/${slug}/${file}.webp`,
    width: 1040,
    height: 1300,
    alt: { pl: alt },
    ai,
  });
  return {
    label: { pl: label },
    before: photo("przed", before),
    after: photo("po", after),
  };
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
    /* Кадр владельца (ИИ, вывеска Afterdark), решение 09.10.2026; вход SPECTRE не берём */
    photo: {
      src: "/kontakt/wejscie.webp",
      width: 1040,
      height: 1300,
      alt: {
        pl: "Wjazd do studia Afterdark wieczorem: fioletowy neon, w środku czarne auto",
      },
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
          /* Оба кадра — ИИ, scripts/before-after/mycie.json */
          beforeAfter: pair(
            "mycie",
            "Mycie",
            {
              alt: "Koło i nadkole przed myciem: błoto na oponie, pył z hamulców na feldze, kurz na lakierze",
              ai: true,
            },
            {
              alt: "To samo koło po myciu: czysta felga i błyszczący lakier",
              ai: true,
            },
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
          /* Из мокапа (решение владельца 09.10.2026): «po» — фото со свободной лицензией,
             «przed» — его правка ИИ */
          beforeAfter: pair(
            "lakier",
            "Lakier",
            {
              alt: "Czarny lakier przed korektą: hologramy i rysy wokół reflektora",
              ai: true,
            },
            {
              alt: "Ten sam lakier po korekcie: lustrzane odbicia lamp",
              ai: false,
            },
          ),
        },
        {
          name: {
            pl: "Wieloetapowa korekta lakieru — 3 etapy + powłoka ceramiczna",
          },
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
        {
          question: { pl: "Czy korekta usunie wszystkie rysy?" },
          answer: {
            pl: "Nie wszystkie. Polerowanie zbiera cienką warstwę lakieru bezbarwnego, więc znikają rysy, które nie sięgają głębiej: hologramy, zmatowienia, ślady po myjni. Prosty test: przeciągnij paznokciem w poprzek rysy. Nie zaczepia — zwykle zniknie po polerowaniu. Zaczepia — rysa doszła do koloru lub głębiej: złagodzimy ją, ale zniknie dopiero po lakierowaniu.",
          },
        },
        {
          question: { pl: "Jak myć auto po powłoce ceramicznej?" },
          answer: {
            pl: "Pierwsze mycie — po 14 dniach: tyle powłoka dojrzewa po utwardzeniu w studiu. Potem ręcznie, metodą dwóch wiader i szamponem o neutralnym pH, bez wosku i nabłyszczaczy. Myjnię szczotkową omijaj; na bezdotykowej — bez szczotki i bez programów z woskiem. Wycieraj miękkim ręcznikiem z mikrofibry, bez tarcia, a ptasie odchody zmywaj od razu.",
          },
        },
        {
          question: { pl: "Czy mogę zostawić auto na noc?" },
          answer: {
            pl: "Tak. Możesz przywieźć auto wieczorem dzień wcześniej albo odebrać je następnego dnia — nocuje w studiu, pod dachem. Przy korekcie z ceramiką i tak zostaje u nas kilka nocy.",
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
          /* Из мокапа (решение владельца 09.10.2026): «po» — фото со свободной лицензией,
             «przed» — его правка ИИ */
          beforeAfter: pair(
            "wnetrze",
            "Wnętrze",
            {
              alt: "Jasny skórzany fotel przed czyszczeniem: brud w szwach i na siedzisku",
              ai: true,
            },
            { alt: "Ten sam fotel po czyszczeniu", ai: false },
          ),
        },
        {
          name: {
            pl: "Kompleksowe czyszczenie wnętrza z demontażem elementów",
          },
          note: {
            pl: "Ostateczna cena zależy od stanu samochodu i zakresu prac",
          },
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
          note: {
            pl: "Ostateczna cena ustalana jest po oględzinach samochodu",
          },
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
