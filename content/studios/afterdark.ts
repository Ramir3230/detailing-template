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
 * Выдуманная студия шаблона (BRIEF.md). Тексты и цены — с холста дизайна; тексты
 * страниц групп, кроме Lakier, — черновик, принятый владельцем 09.10.2026.
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
    /* Адрес выдуманный: булавка на перекрёстке Prądzyńskiego и Brylowskiej, не на здании
       (решение 09.10.2026). Карту рисует scripts/map/render.py по afterdark.json */
    map: {
      wide: { src: "/mapa/afterdark.webp", width: 2272, height: 960 },
      narrow: { src: "/mapa/afterdark-narrow.webp", width: 1280, height: 960 },
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
      intro: {
        pl: "Mycie ręczne, bez szczotek, oraz powłoki, dzięki którym deszcz w trasie sam spływa z szyb. Ceny większości usług zależą od klasy auta.",
      },
      advice: { pl: "Zadzwoń — podpowiemy, czy wystarczy mycie, czy lepiej wziąć kompleks." },
      services: [
        {
          name: { pl: "Mycie detailingowe nadwozia" },
          price: { kind: "byClass", S: 200, M: 220, L: 250 },
          duration: { unit: "hour", min: 2, max: 3 },
          scope: [
            { pl: "Piana aktywna przed myciem" },
            { pl: "Mycie ręczne metodą dwóch wiader, bez szczotek" },
            { pl: "Felgi i opony — osobnymi narzędziami" },
            { pl: "Osuszanie mikrofibrą i sprężonym powietrzem" },
            { pl: "Dressing opon" },
          ],
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
          duration: { unit: "hour", min: 3, max: 4 },
          scope: [
            { pl: "Wszystko z mycia detailingowego nadwozia" },
            { pl: "Odkurzanie wnętrza i bagażnika" },
            { pl: "Czyszczenie plastików kokpitu" },
            { pl: "Szyby od wewnątrz" },
            { pl: "Szybki wosk na lakier — pomijamy go przy powłoce ceramicznej" },
          ],
        },
        {
          name: { pl: "Powłoka hydrofobowa „Niewidzialna wycieraczka”" },
          note: { pl: "Wszystkie klasy, na wszystkie szyby" },
          price: { kind: "fixed", amount: 300 },
          duration: { unit: "hour", min: 1, max: 2 },
          scope: [
            { pl: "Mycie i odtłuszczenie wszystkich szyb" },
            { pl: "Nałożenie powłoki hydrofobowej" },
            { pl: "Usunięcie nadmiaru powłoki — szyby bez smug" },
          ],
        },
        {
          name: { pl: "Polerowanie szyb + powłoka ceramiczna" },
          price: { kind: "byClass", S: 350, M: 400, L: 450 },
          duration: { unit: "hour", min: 4, max: 5 },
          scope: [
            { pl: "Mycie i dekontaminacja szyb" },
            { pl: "Polerowanie tlenkiem ceru: mikrorysy i ślady po wycieraczkach" },
            { pl: "Odtłuszczenie przed powłoką" },
            { pl: "Powłoka ceramiczna na szyby" },
          ],
        },
      ],
      faq: [
        {
          question: { pl: "Czym mycie detailingowe różni się od myjni?" },
          answer: {
            pl: "Myjemy ręcznie, metodą dwóch wiader: w jednym jest szampon, w drugim płuczemy rękawicę, więc piasek nie wraca na lakier. Szczotki myjni automatycznej zostawiają na lakierze rysy i hologramy — u nas szczotek nie ma. Felgi myjemy osobnymi narzędziami, żeby pył z hamulców nie trafił na nadwozie.",
          },
        },
        {
          question: { pl: "Jak długo działa „Niewidzialna wycieraczka”?" },
          answer: {
            pl: "Do roku: im częściej pracują wycieraczki, tym szybciej powłoka się ściera. Od około 60 km/h krople same spływają z szyby, a wycieraczki można włączać rzadziej.",
          },
        },
        {
          question: { pl: "Czy polerowanie usunie odprysk na szybie?" },
          answer: {
            pl: "Nie. Polerowanie usuwa mikrorysy i matowe ślady po wycieraczkach — te, w których nie zaczepia paznokieć. Odpryski i pęknięcia naprawia serwis szyb, najlepiej przed polerowaniem i powłoką.",
          },
        },
      ],
    },
    {
      slug: "lakier",
      name: { pl: "Lakier" },
      intro: {
        pl: "Korekta usuwa rysy i hologramy, ceramika utrwala efekt. Cena zależy od klasy auta i liczby etapów.",
      },
      advice: { pl: "Zadzwoń — doradzimy, gdy zobaczymy lakier." },
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
      intro: {
        pl: "Pranie tapicerki, skóra, plastiki i zapachy — od szybkiego ozonowania po czyszczenie z demontażem foteli.",
      },
      advice: { pl: "Zadzwoń — po opisie powiemy, czy wystarczy czyszczenie, czy potrzebny demontaż." },
      services: [
        {
          name: { pl: "Ozonowanie wnętrza" },
          note: { pl: "Wszystkie klasy" },
          price: { kind: "fixed", amount: 120 },
          duration: { unit: "hour", min: 1 },
          scope: [
            { pl: "Ozonowanie kabiny i obiegu klimatyzacji" },
            { pl: "Neutralizacja zapachów: dym, zwierzęta, wilgoć" },
            { pl: "Wietrzenie auta po zabiegu" },
          ],
        },
        {
          name: { pl: "Kompleksowe czyszczenie wnętrza" },
          price: { kind: "byClass", S: 800, M: 900, L: 1000 },
          duration: { unit: "day", min: 1 },
          scope: [
            { pl: "Odkurzanie wnętrza i bagażnika" },
            { pl: "Pranie ekstrakcyjne tapicerki i dywaników" },
            { pl: "Czyszczenie i zabezpieczenie skóry" },
            { pl: "Plastiki: czyszczenie i matowy dressing" },
            { pl: "Szyby od wewnątrz" },
          ],
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
          duration: { unit: "day", min: 2, max: 3 },
          scope: [
            { pl: "Wszystko z kompleksowego czyszczenia wnętrza" },
            { pl: "Demontaż foteli i elementów, pod które dostał się brud" },
            { pl: "Pranie wykładziny podłogi pod fotelami" },
            { pl: "Ozonowanie na koniec" },
          ],
        },
      ],
      faq: [
        {
          question: { pl: "Ile schnie tapicerka po praniu?" },
          answer: {
            pl: "Odbierasz auto z suchą tapicerką: pranie ekstrakcyjne zostawia w materiale niewiele wody, a resztę suszymy w studiu. Przy czyszczeniu z demontażem auto nocuje u nas — fotele wracają na miejsce dopiero suche.",
          },
        },
        {
          question: { pl: "Czy usuniecie sierść i zapach papierosów?" },
          answer: {
            pl: "Sierść — tak, to część kompleksowego czyszczenia. Z zapachem jest tak: czyszczenie usuwa jego źródło z tapicerki i plastików, a ozonowanie neutralizuje to, co zostało w powietrzu i klimatyzacji — to osobna usługa, przy czyszczeniu z demontażem jest już w cenie. Bardzo wżarty zapach dymu może wymagać czyszczenia z demontażem.",
          },
        },
        {
          question: { pl: "Kiedy potrzebny jest demontaż foteli?" },
          answer: {
            pl: "Gdy brud lub płyn dostał się pod fotele: rozlany napój wsiąkł w wykładzinę, w aucie czuć wilgoć albo zapach idzie od podłogi. Bez demontażu wyczyścimy tylko to, co widać. Ostateczną cenę podamy po obejrzeniu auta.",
          },
        },
      ],
    },
    {
      slug: "felgi-i-silnik",
      name: { pl: "Felgi i silnik" },
      intro: {
        pl: "Felgi czyścimy z obu stron i chronimy ceramiką, komorę silnika — bez wody na elektryce. Cena czyszczenia felg zależy od klasy auta.",
      },
      advice: { pl: "Zadzwoń — umówimy oględziny i od razu podamy cenę detailingu silnika." },
      services: [
        {
          name: { pl: "Dokładne czyszczenie felg, powłoka ceramiczna" },
          price: { kind: "byClass", S: 450, M: 500, L: 550 },
          duration: { unit: "hour", min: 4, max: 5 },
          scope: [
            { pl: "Zdejmowanie kół i dokręcanie kluczem dynamometrycznym" },
            { pl: "Czyszczenie felg z obu stron i między szprychami" },
            { pl: "Usunięcie wżartego pyłu z hamulców i smoły" },
            { pl: "Powłoka ceramiczna na felgi" },
            { pl: "Dressing opon" },
          ],
        },
        {
          name: { pl: "Detailing komory silnika" },
          note: {
            pl: "Ostateczna cena ustalana jest po oględzinach samochodu",
          },
          price: { kind: "from", amount: 600 },
          duration: { unit: "hour", min: 2, max: 3 },
          scope: [
            { pl: "Zabezpieczenie elektryki i dolotu powietrza" },
            { pl: "Czyszczenie pędzlami i chemią do komory silnika" },
            { pl: "Płukanie niskim ciśnieniem na zimnym silniku" },
            { pl: "Osuszanie sprężonym powietrzem" },
            { pl: "Matowy dressing na plastiki i gumy" },
          ],
        },
      ],
      faq: [
        {
          question: { pl: "Czy mycie silnika jest bezpieczne?" },
          answer: {
            pl: "Tak, jeśli robi się je ostrożnie. Myjemy tylko zimny silnik, elektrykę i dolot powietrza zakrywamy, a zamiast myjki ciśnieniowej używamy pędzli i niskiego ciśnienia. Zanim uruchomimy silnik, komorę osuszamy sprężonym powietrzem.",
          },
        },
        {
          question: { pl: "Po co powłoka ceramiczna na felgach?" },
          answer: {
            pl: "Pył z hamulców i brud słabiej się do niej przyklejają, więc felgi myje się zwykłym szamponem, bez mocnej chemii. Powłoka trzyma około roku.",
          },
        },
        {
          question: { pl: "Czy zdejmujecie koła?" },
          answer: {
            pl: "Tak. Tylko tak doczyścimy wewnętrzną stronę felgi, a powłoka obejmie ją całą. Koła wracają na miejsce dokręcone kluczem dynamometrycznym, z momentem, który zaleca producent Twojego auta.",
          },
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
