import type { BeforeAfter, Photo, Studio, Text } from "@/content/types";

/** Кадр пары: подпись для диктора и сделан ли он ИИ. */
type Frame = { alt: Text; ai: boolean };

/*
 * Пары до/после в public/przed-po/<пара>/, 1040×1300. У выдуманной студии своих работ
 * нет: кадры ИИ подписаны на странице как примеры (DESIGN.md, «Фотографии»).
 */
function pair(
  slug: string,
  label: Text,
  before: Frame,
  after: Frame,
): BeforeAfter {
  const photo = (file: string, { alt, ai }: Frame) => ({
    src: `/przed-po/${slug}/${file}.webp`,
    width: 1040,
    height: 1300,
    alt,
    ai,
  });
  return {
    label,
    before: photo("przed", before),
    after: photo("po", after),
  };
}

/* Кадр O nas в public/o-nas/, 1040×1300: у выдуманной студии сделан ИИ */
function aboutPhoto(file: string, alt: Text): Photo {
  return { src: `/o-nas/${file}.webp`, width: 1040, height: 1300, alt, ai: true };
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
  tagline: { pl: "Studio detailingu", ru: "Студия детейлинга" },
  meta: {
    title: {
      pl: "Afterdark Detailing — studio detailingu, Warszawa-Wola",
      ru: "Afterdark Detailing — студия детейлинга на Воле, Варшава",
    },
    description: {
      pl: "Korekta lakieru, ceramika, wnętrze — z ceną dla Twojej klasy auta od razu na stronie.",
      ru: "Полировка кузова, керамика, салон — с ценой для класса вашей машины сразу на сайте.",
    },
  },
  indexed: false,
  languages: ["pl", "ru"],
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
      src: "/kontakt/afterdark.webp",
      width: 1040,
      height: 1300,
      alt: {
        pl: "Wjazd do studia Afterdark wieczorem: fioletowy neon, w środku czarne auto",
        ru: "Въезд в студию Afterdark вечером: фиолетовый неон, внутри чёрная машина",
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
    title: { pl: "Twoje auto.\nNowy poziom.", ru: "Один звонок.\nНовое авто." },
    subtitle: { pl: "Studio detailingu na Woli", ru: "Студия детейлинга на Воле" },
    lead: {
      pl: "Studio detailingu na Woli. Korekta lakieru, ceramika, wnętrze — z ceną dla Twojej klasy auta od razu na stronie.",
      ru: "Студия детейлинга на Воле. Полировка кузова, керамика, салон — с ценой для класса вашей машины сразу на сайте.",
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
    S: { pl: "Małe samochody, segment kompaktowy", ru: "Небольшие машины, компактный класс" },
    M: {
      pl: "Sedany, kombi, średniej wielkości SUV-y",
      ru: "Седаны, универсалы, кроссоверы среднего размера",
    },
    L: {
      pl: "Duże SUV-y, samochody terenowe, minivany, pickupy",
      ru: "Большие кроссоверы, внедорожники, минивэны, пикапы",
    },
    XL: { pl: "Samochody o niestandardowych wymiarach", ru: "Машины нестандартных размеров" },
  },
  services: [
    {
      slug: "mycie-i-szyby",
      name: { pl: "Mycie i szyby", ru: "Мойка и стёкла" },
      intro: {
        pl: "Mycie ręczne, bez szczotek, oraz powłoki, dzięki którym deszcz w trasie sam spływa z szyb. Ceny większości usług zależą od klasy auta.",
        ru: "Ручная мойка без щёток — и покрытия, с которыми дождь в дороге сам сходит со стёкол. Цены большинства услуг зависят от класса машины.",
      },
      advice: {
        pl: "Zadzwoń — podpowiemy, czy wystarczy mycie, czy lepiej wziąć kompleks.",
        ru: "Позвоните — подскажем, хватит ли мойки или лучше взять комплекс.",
      },
      services: [
        {
          name: { pl: "Mycie detailingowe nadwozia", ru: "Детейлинг-мойка кузова" },
          price: { kind: "byClass", S: 200, M: 220, L: 250 },
          duration: { unit: "hour", min: 2, max: 3 },
          scope: [
            { pl: "Piana aktywna przed myciem", ru: "Активная пена перед мойкой" },
            {
              pl: "Mycie ręczne metodą dwóch wiader, bez szczotek",
              ru: "Ручная мойка методом двух вёдер, без щёток",
            },
            { pl: "Felgi i opony — osobnymi narzędziami", ru: "Диски и шины — отдельным инструментом" },
            {
              pl: "Osuszanie mikrofibrą i sprężonym powietrzem",
              ru: "Сушка микрофиброй и сжатым воздухом",
            },
            { pl: "Dressing opon", ru: "Чернение шин" },
          ],
          /* Оба кадра — ИИ, scripts/before-after/mycie.json */
          beforeAfter: pair(
            "mycie",
            { pl: "Mycie", ru: "Мойка" },
            {
              alt: {
                pl: "Koło i nadkole przed myciem: błoto na oponie, pył z hamulców na feldze, kurz na lakierze",
                ru: "Колесо и арка до мойки: грязь на шине, тормозная пыль на диске, пыль на кузове",
              },
              ai: true,
            },
            {
              alt: {
                pl: "To samo koło po myciu: czysta felga i błyszczący lakier",
                ru: "То же колесо после мойки: чистый диск и блестящий лак",
              },
              ai: true,
            },
          ),
        },
        {
          name: { pl: "Kompleks detailingowy", ru: "Детейлинг-комплекс" },
          price: { kind: "byClass", S: 300, M: 330, L: 350 },
          duration: { unit: "hour", min: 3, max: 4 },
          scope: [
            { pl: "Wszystko z mycia detailingowego nadwozia", ru: "Всё из детейлинг-мойки кузова" },
            { pl: "Odkurzanie wnętrza i bagażnika", ru: "Пылесос салона и багажника" },
            { pl: "Czyszczenie plastików kokpitu", ru: "Чистка пластика передней панели" },
            { pl: "Szyby od wewnątrz", ru: "Стёкла изнутри" },
            {
              pl: "Szybki wosk na lakier — pomijamy go przy powłoce ceramicznej",
              ru: "Быстрый воск на кузов — не наносим, если на машине керамика",
            },
          ],
        },
        {
          name: {
            pl: "Powłoka hydrofobowa „Niewidzialna wycieraczka”",
            ru: "Гидрофобное покрытие «Антидождь»",
          },
          note: { pl: "Wszystkie klasy, na wszystkie szyby", ru: "Все классы, на все стёкла" },
          price: { kind: "fixed", amount: 300 },
          duration: { unit: "hour", min: 1, max: 2 },
          scope: [
            { pl: "Mycie i odtłuszczenie wszystkich szyb", ru: "Мойка и обезжиривание всех стёкол" },
            { pl: "Nałożenie powłoki hydrofobowej", ru: "Нанесение гидрофобного покрытия" },
            {
              pl: "Usunięcie nadmiaru powłoki — szyby bez smug",
              ru: "Удаление излишков покрытия — стёкла без разводов",
            },
          ],
        },
        {
          name: {
            pl: "Polerowanie szyb + powłoka ceramiczna",
            ru: "Полировка стёкол + керамическое покрытие",
          },
          price: { kind: "byClass", S: 350, M: 400, L: 450 },
          duration: { unit: "hour", min: 4, max: 5 },
          scope: [
            { pl: "Mycie i dekontaminacja szyb", ru: "Мойка и деконтаминация стёкол" },
            {
              pl: "Polerowanie tlenkiem ceru: mikrorysy i ślady po wycieraczkach",
              ru: "Полировка оксидом церия: микроцарапины и следы от дворников",
            },
            { pl: "Odtłuszczenie przed powłoką", ru: "Обезжиривание перед покрытием" },
            { pl: "Powłoka ceramiczna na szyby", ru: "Керамическое покрытие на стёкла" },
          ],
        },
      ],
      faq: [
        {
          question: {
            pl: "Czym mycie detailingowe różni się od myjni?",
            ru: "Чем детейлинг-мойка отличается от автомойки?",
          },
          answer: {
            pl: "Myjemy ręcznie, metodą dwóch wiader: w jednym jest szampon, w drugim płuczemy rękawicę, więc piasek nie wraca na lakier. Szczotki myjni automatycznej zostawiają na lakierze rysy i hologramy — u nas szczotek nie ma. Felgi myjemy osobnymi narzędziami, żeby pył z hamulców nie trafił na nadwozie.",
            ru: "Моем вручную, методом двух вёдер: в одном шампунь, в другом полощем рукавицу, поэтому песок не возвращается на лак. Щётки автоматической мойки оставляют на лаке царапины и голограммы — у нас щёток нет. Диски моем отдельным инструментом, чтобы тормозная пыль не попала на кузов.",
          },
        },
        {
          question: {
            pl: "Jak długo działa „Niewidzialna wycieraczka”?",
            ru: "Сколько держится «Антидождь»?",
          },
          answer: {
            pl: "Do roku: im częściej pracują wycieraczki, tym szybciej powłoka się ściera. Od około 60 km/h krople same spływają z szyby, a wycieraczki można włączać rzadziej.",
            ru: "До года: чем чаще работают дворники, тем быстрее стирается покрытие. Примерно с 60 км/ч капли сами сходят со стекла, а дворники можно включать реже.",
          },
        },
        {
          question: {
            pl: "Czy polerowanie usunie odprysk na szybie?",
            ru: "Уберёт ли полировка скол на стекле?",
          },
          answer: {
            pl: "Nie. Polerowanie usuwa mikrorysy i matowe ślady po wycieraczkach — te, w których nie zaczepia paznokieć. Odpryski i pęknięcia naprawia serwis szyb, najlepiej przed polerowaniem i powłoką.",
            ru: "Нет. Полировка убирает микроцарапины и матовые следы от дворников — те, за которые не цепляется ноготь. Сколы и трещины ремонтируют в автостекольной мастерской, лучше до полировки и покрытия.",
          },
        },
      ],
    },
    {
      slug: "lakier",
      name: { pl: "Lakier", ru: "Кузов" },
      intro: {
        pl: "Korekta usuwa rysy i hologramy, ceramika utrwala efekt. Cena zależy od klasy auta i liczby etapów.",
        ru: "Полировка убирает царапины и голограммы, керамика закрепляет результат. Цена зависит от класса машины и числа этапов.",
      },
      advice: {
        pl: "Zadzwoń — doradzimy, gdy zobaczymy lakier.",
        ru: "Позвоните — посоветуем, когда увидим машину.",
      },
      services: [
        {
          name: { pl: "Jednoetapowa korekta lakieru", ru: "Одноэтапная полировка кузова" },
          price: { kind: "byClass", S: 1000, M: 1150, L: 1300 },
          duration: { unit: "day", min: 1 },
          scope: [
            { pl: "Mycie i dekontaminacja lakieru", ru: "Мойка и деконтаминация кузова" },
            { pl: "Pomiar grubości lakieru przed pracą", ru: "Замер толщины лака перед работой" },
            {
              pl: "Polerowanie jednym etapem: lekkie rysy i hologramy",
              ru: "Полировка в один этап: лёгкие царапины и голограммы",
            },
            {
              pl: "Kontrola efektu w świetle studyjnym",
              ru: "Проверка результата под студийным светом",
            },
          ],
          /* Из мокапа (решение владельца 09.10.2026): «po» — фото со свободной лицензией,
             «przed» — его правка ИИ */
          beforeAfter: pair(
            "lakier",
            { pl: "Lakier", ru: "Кузов" },
            {
              alt: {
                pl: "Czarny lakier przed korektą: hologramy i rysy wokół reflektora",
                ru: "Чёрный кузов до полировки: голограммы и царапины вокруг фары",
              },
              ai: true,
            },
            {
              alt: {
                pl: "Ten sam lakier po korekcie: lustrzane odbicia lamp",
                ru: "Тот же кузов после полировки: зеркальные отражения ламп",
              },
              ai: false,
            },
          ),
        },
        {
          name: {
            pl: "Wieloetapowa korekta lakieru — 3 etapy + powłoka ceramiczna",
            ru: "Многоэтапная полировка кузова — 3 этапа + керамическое покрытие",
          },
          brand: "GYEON",
          price: { kind: "byClass", S: 3300, M: 3600, L: 4000 },
          duration: { unit: "day", min: 3, max: 4 },
          scope: [
            { pl: "Wszystko z korekty jednoetapowej", ru: "Всё из одноэтапной полировки" },
            {
              pl: "Trzy etapy polerowania: głębsze rysy i zmatowienia",
              ru: "Три этапа полировки: более глубокие царапины и помутнения",
            },
            { pl: "Powłoka ceramiczna GYEON", ru: "Керамическое покрытие GYEON" },
            { pl: "Utwardzanie powłoki w studiu", ru: "Отверждение покрытия в студии" },
          ],
        },
      ],
      faq: [
        {
          question: { pl: "Ile trwa korekta lakieru?", ru: "Сколько длится полировка?" },
          answer: {
            pl: "Jednoetapowa — jeden dzień. Wieloetapowa z ceramiką — 3–4 dni: powłoka musi utwardzić się w studiu, zanim auto wyjedzie na deszcz.",
            ru: "Одноэтапная — один день. Многоэтапная с керамикой — 3–4 дня: покрытие должно отвердеть в студии, прежде чем машина выедет под дождь.",
          },
        },
        {
          question: {
            pl: "Czy korekta usunie wszystkie rysy?",
            ru: "Уберёт ли полировка все царапины?",
          },
          answer: {
            pl: "Nie wszystkie. Polerowanie zbiera cienką warstwę lakieru bezbarwnego, więc znikają rysy, które nie sięgają głębiej: hologramy, zmatowienia, ślady po myjni. Prosty test: przeciągnij paznokciem w poprzek rysy. Nie zaczepia — zwykle zniknie po polerowaniu. Zaczepia — rysa doszła do koloru lub głębiej: złagodzimy ją, ale zniknie dopiero po lakierowaniu.",
            ru: "Не все. Полировка снимает тонкий слой бесцветного лака, поэтому уходят царапины, которые не глубже него: голограммы, помутнения, следы от мойки. Простой тест: проведите ногтем поперёк царапины. Не цепляется — обычно уходит после полировки. Цепляется — царапина дошла до цветного слоя или глубже: сделаем её менее заметной, но исчезнет она только после покраски.",
          },
        },
        {
          question: {
            pl: "Jak myć auto po powłoce ceramicznej?",
            ru: "Как мыть машину после керамики?",
          },
          answer: {
            pl: "Pierwsze mycie — po 14 dniach: tyle powłoka dojrzewa po utwardzeniu w studiu. Potem ręcznie, metodą dwóch wiader i szamponem o neutralnym pH, bez wosku i nabłyszczaczy. Myjnię szczotkową omijaj; na bezdotykowej — bez szczotki i bez programów z woskiem. Wycieraj miękkim ręcznikiem z mikrofibry, bez tarcia, a ptasie odchody zmywaj od razu.",
            ru: "Первая мойка — через 14 дней: столько покрытие дозревает после отверждения в студии. Дальше — вручную, методом двух вёдер и шампунем с нейтральным pH, без воска и средств для блеска. Щёточные мойки объезжайте стороной; на бесконтактной — без щётки и без программ с воском. Вытирайте мягким полотенцем из микрофибры, без трения, а птичий помёт смывайте сразу.",
          },
        },
        {
          question: { pl: "Czy mogę zostawić auto na noc?", ru: "Можно оставить машину на ночь?" },
          answer: {
            pl: "Tak. Możesz przywieźć auto wieczorem dzień wcześniej albo odebrać je następnego dnia — nocuje w studiu, pod dachem. Przy korekcie z ceramiką i tak zostaje u nas kilka nocy.",
            ru: "Да. Можно привезти машину накануне вечером или забрать на следующий день — она ночует в студии, под крышей. При полировке с керамикой она и так остаётся у нас на несколько ночей.",
          },
        },
      ],
    },
    {
      slug: "wnetrze",
      name: { pl: "Wnętrze", ru: "Салон" },
      intro: {
        pl: "Pranie tapicerki, skóra, plastiki i zapachy — od szybkiego ozonowania po czyszczenie z demontażem foteli.",
        ru: "Химчистка обивки, кожа, пластик и запахи — от быстрого озонирования до химчистки со снятием сидений.",
      },
      advice: {
        pl: "Zadzwoń — po opisie powiemy, czy wystarczy czyszczenie, czy potrzebny demontaż.",
        ru: "Позвоните — по описанию скажем, хватит ли химчистки или нужно снимать сиденья.",
      },
      services: [
        {
          name: { pl: "Ozonowanie wnętrza", ru: "Озонирование салона" },
          note: { pl: "Wszystkie klasy", ru: "Все классы" },
          price: { kind: "fixed", amount: 120 },
          duration: { unit: "hour", min: 1 },
          scope: [
            {
              pl: "Ozonowanie kabiny i obiegu klimatyzacji",
              ru: "Озонирование салона и системы кондиционера",
            },
            {
              pl: "Neutralizacja zapachów: dym, zwierzęta, wilgoć",
              ru: "Нейтрализация запахов: дым, животные, сырость",
            },
            { pl: "Wietrzenie auta po zabiegu", ru: "Проветривание машины после процедуры" },
          ],
        },
        {
          name: { pl: "Kompleksowe czyszczenie wnętrza", ru: "Комплексная химчистка салона" },
          price: { kind: "byClass", S: 800, M: 900, L: 1000 },
          duration: { unit: "day", min: 1 },
          scope: [
            { pl: "Odkurzanie wnętrza i bagażnika", ru: "Пылесос салона и багажника" },
            {
              pl: "Pranie ekstrakcyjne tapicerki i dywaników",
              ru: "Экстракторная чистка обивки и ковриков",
            },
            { pl: "Czyszczenie i zabezpieczenie skóry", ru: "Чистка и защита кожи" },
            { pl: "Plastiki: czyszczenie i matowy dressing", ru: "Пластик: чистка и матовая полироль" },
            { pl: "Szyby od wewnątrz", ru: "Стёкла изнутри" },
          ],
          /* Из мокапа (решение владельца 09.10.2026): «po» — фото со свободной лицензией,
             «przed» — его правка ИИ */
          beforeAfter: pair(
            "wnetrze",
            { pl: "Wnętrze", ru: "Салон" },
            {
              alt: {
                pl: "Jasny skórzany fotel przed czyszczeniem: brud w szwach i na siedzisku",
                ru: "Светлое кожаное сиденье до химчистки: грязь в швах и на подушке",
              },
              ai: true,
            },
            {
              alt: { pl: "Ten sam fotel po czyszczeniu", ru: "То же сиденье после химчистки" },
              ai: false,
            },
          ),
        },
        {
          name: {
            pl: "Kompleksowe czyszczenie wnętrza z demontażem elementów",
            ru: "Комплексная химчистка салона с демонтажем",
          },
          note: {
            pl: "Ostateczna cena zależy od stanu samochodu i zakresu prac",
            ru: "Окончательная цена зависит от состояния машины и объёма работ",
          },
          price: { kind: "from", amount: 1500 },
          duration: { unit: "day", min: 2, max: 3 },
          scope: [
            {
              pl: "Wszystko z kompleksowego czyszczenia wnętrza",
              ru: "Всё из комплексной химчистки салона",
            },
            {
              pl: "Demontaż foteli i elementów, pod które dostał się brud",
              ru: "Снятие сидений и деталей, под которые попала грязь",
            },
            { pl: "Pranie wykładziny podłogi pod fotelami", ru: "Химчистка ковролина под сиденьями" },
            { pl: "Ozonowanie na koniec", ru: "Озонирование в конце" },
          ],
        },
      ],
      faq: [
        {
          question: {
            pl: "Ile schnie tapicerka po praniu?",
            ru: "Сколько сохнет обивка после химчистки?",
          },
          answer: {
            pl: "Odbierasz auto z suchą tapicerką: pranie ekstrakcyjne zostawia w materiale niewiele wody, a resztę suszymy w studiu. Przy czyszczeniu z demontażem auto nocuje u nas — fotele wracają na miejsce dopiero suche.",
            ru: "Вы забираете машину с сухой обивкой: экстракторная чистка оставляет в ткани немного воды, а остальное мы досушиваем в студии. При химчистке с демонтажем машина ночует у нас — сиденья возвращаются на место только сухими.",
          },
        },
        {
          question: {
            pl: "Czy usuniecie sierść i zapach papierosów?",
            ru: "Уберёте шерсть и запах сигарет?",
          },
          answer: {
            pl: "Sierść — tak, to część kompleksowego czyszczenia. Z zapachem jest tak: czyszczenie usuwa jego źródło z tapicerki i plastików, a ozonowanie neutralizuje to, co zostało w powietrzu i klimatyzacji — to osobna usługa, przy czyszczeniu z demontażem jest już w cenie. Bardzo wżarty zapach dymu może wymagać czyszczenia z demontażem.",
            ru: "Шерсть — да, это часть комплексной химчистки. С запахом так: химчистка убирает его источник из обивки и пластика, а озонирование нейтрализует то, что осталось в воздухе и кондиционере, — это отдельная услуга, в химчистку с демонтажем она уже входит. Сильно въевшийся запах дыма может потребовать химчистки с демонтажем.",
          },
        },
        {
          question: { pl: "Kiedy potrzebny jest demontaż foteli?", ru: "Когда нужно снимать сиденья?" },
          answer: {
            pl: "Gdy brud lub płyn dostał się pod fotele: rozlany napój wsiąkł w wykładzinę, w aucie czuć wilgoć albo zapach idzie od podłogi. Bez demontażu wyczyścimy tylko to, co widać. Ostateczną cenę podamy po obejrzeniu auta.",
            ru: "Когда грязь или жидкость попала под сиденья: пролитый напиток впитался в ковролин, в машине чувствуется сырость или запах идёт от пола. Без демонтажа мы почистим только то, что видно. Окончательную цену назовём после осмотра машины.",
          },
        },
      ],
    },
    {
      slug: "felgi-i-silnik",
      name: { pl: "Felgi i silnik", ru: "Диски и двигатель" },
      intro: {
        pl: "Felgi czyścimy z obu stron i chronimy ceramiką, komorę silnika — bez wody na elektryce. Cena czyszczenia felg zależy od klasy auta.",
        ru: "Диски чистим с обеих сторон и защищаем керамикой, моторный отсек — без воды на электрике. Цена чистки дисков зависит от класса машины.",
      },
      advice: {
        pl: "Zadzwoń — umówimy oględziny i od razu podamy cenę detailingu silnika.",
        ru: "Позвоните — договоримся об осмотре и сразу назовём цену детейлинга двигателя.",
      },
      services: [
        {
          name: {
            pl: "Dokładne czyszczenie felg, powłoka ceramiczna",
            ru: "Тщательная чистка дисков, керамическое покрытие",
          },
          price: { kind: "byClass", S: 450, M: 500, L: 550 },
          duration: { unit: "hour", min: 4, max: 5 },
          scope: [
            {
              pl: "Zdejmowanie kół i dokręcanie kluczem dynamometrycznym",
              ru: "Снятие колёс и затяжка динамометрическим ключом",
            },
            {
              pl: "Czyszczenie felg z obu stron i między szprychami",
              ru: "Чистка дисков с обеих сторон и между спицами",
            },
            {
              pl: "Usunięcie wżartego pyłu z hamulców i smoły",
              ru: "Удаление въевшейся тормозной пыли и битума",
            },
            { pl: "Powłoka ceramiczna na felgi", ru: "Керамическое покрытие на диски" },
            { pl: "Dressing opon", ru: "Чернение шин" },
          ],
          /* Пара владельца (10.10.2026), как у Lakier: «po» — фото, «przed» — его правка ИИ;
             «przed» совмещён с «po» по ключевым точкам, оба обрезаны до 4:5 */
          beforeAfter: pair(
            "felgi",
            { pl: "Felgi", ru: "Диски" },
            {
              alt: {
                pl: "Czarna felga przed czyszczeniem: rdza i pył z hamulców na tarczy, zabrudzona opona",
                ru: "Чёрный колёсный диск до чистки: ржавчина и тормозная пыль на тормозном диске, грязная шина",
              },
              ai: true,
            },
            {
              alt: {
                pl: "Ta sama felga po czyszczeniu: czysta tarcza i opona",
                ru: "Тот же колёсный диск после чистки: чистые тормозной диск и шина",
              },
              ai: false,
            },
          ),
        },
        {
          name: { pl: "Detailing komory silnika", ru: "Детейлинг моторного отсека" },
          note: {
            pl: "Ostateczna cena ustalana jest po oględzinach samochodu",
            ru: "Окончательную цену называем после осмотра машины",
          },
          price: { kind: "from", amount: 600 },
          duration: { unit: "hour", min: 2, max: 3 },
          scope: [
            {
              pl: "Zabezpieczenie elektryki i dolotu powietrza",
              ru: "Защита электрики и воздухозаборника",
            },
            {
              pl: "Czyszczenie pędzlami i chemią do komory silnika",
              ru: "Чистка кистями и химией для моторного отсека",
            },
            {
              pl: "Płukanie niskim ciśnieniem na zimnym silniku",
              ru: "Промывка низким давлением на холодном двигателе",
            },
            { pl: "Osuszanie sprężonym powietrzem", ru: "Сушка сжатым воздухом" },
            {
              pl: "Matowy dressing na plastiki i gumy",
              ru: "Матовая полироль на пластик и резину",
            },
          ],
          /* Пара владельца (10.10.2026), как у Felgi: «po» — фото, «przed» — его правка ИИ;
             «po» совмещён с «przed» по ключевым точкам, оба обрезаны до 4:5 по кожуху */
          beforeAfter: pair(
            "silnik",
            { pl: "Silnik", ru: "Двигатель" },
            {
              alt: {
                pl: "Komora silnika przed detailingiem: kurz i zacieki na osłonie silnika i przewodach",
                ru: "Моторный отсек до детейлинга: пыль и подтёки на крышке двигателя и проводах",
              },
              ai: true,
            },
            {
              alt: {
                pl: "Ta sama komora po detailingu: czysta, matowa osłona silnika",
                ru: "Тот же отсек после детейлинга: чистая матовая крышка двигателя",
              },
              ai: false,
            },
          ),
        },
      ],
      faq: [
        {
          question: { pl: "Czy mycie silnika jest bezpieczne?", ru: "Мыть двигатель безопасно?" },
          answer: {
            pl: "Tak, jeśli robi się je ostrożnie. Myjemy tylko zimny silnik, elektrykę i dolot powietrza zakrywamy, a zamiast myjki ciśnieniowej używamy pędzli i niskiego ciśnienia. Zanim uruchomimy silnik, komorę osuszamy sprężonym powietrzem.",
            ru: "Да, если делать это аккуратно. Моем только холодный двигатель, электрику и воздухозаборник закрываем, а вместо мойки высокого давления берём кисти и низкое давление. Прежде чем завести двигатель, сушим отсек сжатым воздухом.",
          },
        },
        {
          question: {
            pl: "Po co powłoka ceramiczna na felgach?",
            ru: "Зачем керамика на дисках?",
          },
          answer: {
            pl: "Pył z hamulców i brud słabiej się do niej przyklejają, więc felgi myje się zwykłym szamponem, bez mocnej chemii. Powłoka trzyma około roku.",
            ru: "Тормозная пыль и грязь хуже к ней липнут, поэтому диски моются обычным шампунем, без агрессивной химии. Покрытие держится около года.",
          },
        },
        {
          question: { pl: "Czy zdejmujecie koła?", ru: "Вы снимаете колёса?" },
          answer: {
            pl: "Tak. Tylko tak doczyścimy wewnętrzną stronę felgi, a powłoka obejmie ją całą. Koła wracają na miejsce dokręcone kluczem dynamometrycznym, z momentem, który zaleca producent Twojego auta.",
            ru: "Да. Только так мы отмоем внутреннюю сторону диска, а покрытие ляжет на него целиком. Колёса возвращаются на место затянутыми динамометрическим ключом, с моментом, который рекомендует производитель вашей машины.",
          },
        },
      ],
    },
  ],
  priceNote: {
    pl: "Przy cenach „od” ostateczną kwotę podajemy po oględzinach — zawsze przed rozpoczęciem prac.",
    ru: "Где цена «от», окончательную сумму называем после осмотра — всегда до начала работ.",
  },
  rating: { value: 5, count: 24 },
  reviews: [
    {
      author: "Marta K.",
      text: {
        pl: "Oddałam auto po zimie, z rysami po myjni automatycznej. Odebrałam je wieczorem i przez chwilę myślałam, że to nie moje. Wszystko wytłumaczone, cena taka, jak na stronie.",
        ru: "Отдала машину после зимы, с царапинами от автоматической мойки. Забрала вечером и на секунду подумала, что она не моя. Всё объяснили, цена — как на сайте.",
      },
      source: "example",
    },
    {
      author: "Tomasz W.",
      text: {
        pl: "Powłoka ceramiczna na nowym kombi. Przed pracą zmierzyli lakier i wytłumaczyli, czym różni się korekta jednoetapowa od wieloetapowej. Po deszczu woda sama spływa, a auto myję dwa razy rzadziej.",
        ru: "Керамика на новый универсал. Перед работой замерили толщину лака и объяснили, чем одноэтапная полировка отличается от многоэтапной. После дождя вода сама стекает, а мыть машину приходится вдвое реже.",
      },
      source: "example",
    },
    {
      author: "Kasia R.",
      text: {
        pl: "Po wakacjach z psem wnętrze wyglądało fatalnie. Po kompleksowym czyszczeniu nie ma ani sierści, ani zapachu. Zadzwonili, kiedy auto było gotowe, i odebrałam je po pracy, o dwudziestej pierwszej.",
        ru: "После отпуска с собакой салон выглядел ужасно. После комплексной химчистки — ни шерсти, ни запаха. Позвонили, когда машина была готова, и я забрала её после работы, в девять вечера.",
      },
      source: "example",
    },
  ],
  /* Кадры ИИ владельца (10.10.2026), обрезка и увеличение — DESIGN.md, «Фотографии» */
  about: {
    intro: {
      pl: "Małe studio na dwa stanowiska na Woli. Najczęściej robimy korektę lakieru i ceramikę, a pracujemy do późna — auto zostawiasz rano i odbierasz po pracy.",
      ru: "Небольшая студия на два поста на Воле. Чаще всего делаем полировку и керамику, а работаем допоздна — машину оставляете утром и забираете после работы.",
    },
    facts: [
      { value: "2019", label: { pl: "rok otwarcia studia", ru: "год открытия студии" } },
      {
        value: "2",
        label: { pl: "stanowiska, na każdym jedno auto", ru: "поста, на каждом одна машина" },
      },
      {
        value: "1",
        label: {
          pl: "opiekun auta od przyjęcia do odbioru",
          ru: "мастер от приёма до выдачи",
        },
      },
    ],
    chapters: [
      {
        title: { pl: "Jak zaczynaliśmy", ru: "С чего мы начинали" },
        paragraphs: [
          {
            pl: "Od aut znajomych, po godzinach. Kiedy chętnych było więcej niż wolnych wieczorów, w 2019 roku otworzyliśmy studio na Woli.",
            ru: "С машин знакомых, после основной работы. Когда желающих стало больше, чем свободных вечеров, в 2019 году мы открыли студию на Воле.",
          },
          {
            pl: "Stąd nazwa: pracujemy do późna, więc po auto nie trzeba brać dnia wolnego.",
            ru: "Отсюда и название: мы работаем допоздна, так что ради машины не нужно брать выходной.",
          },
        ],
        photo: aboutPhoto("hala", {
          pl: "Hala studia nocą: dwa auta na stanowiskach pod sześciokątnymi lampami",
          ru: "Зал студии ночью: две машины на постах под шестиугольными лампами",
        }),
      },
      {
        title: { pl: "Jak pracujemy", ru: "Как мы работаем" },
        paragraphs: [
          {
            pl: "Zanim zaczniemy, mierzymy grubość lakieru i robimy próbę na małym fragmencie. Widzisz efekt, zanim zdecydujesz o całym aucie.",
            ru: "Перед началом замеряем толщину лака и делаем пробу на небольшом участке. Вы видите результат до того, как решите насчёт всей машины.",
          },
          {
            pl: "Cenę ustalamy przed rozpoczęciem prac i się jej trzymamy. Na stanowisku stoi tylko Twoje auto, więc pracujemy bez pośpiechu.",
            ru: "Цену согласуем до начала работ и держимся её. На посту стоит только ваша машина, поэтому работаем без спешки.",
          },
        ],
        photo: aboutPhoto("korekta", {
          pl: "Maska czarnego auta przedzielona taśmą: z lewej rysy, z prawej lustro po korekcie",
          ru: "Капот чёрной машины, разделённый лентой: слева царапины, справа зеркало после полировки",
        }),
      },
      {
        title: { pl: "Na czym pracujemy", ru: "На чём мы работаем" },
        paragraphs: [
          {
            pl: "Na profesjonalnej chemii i certyfikowanych powłokach ceramicznych. Szampony mają neutralne pH, a auto myjemy ręcznie, bez szczotek.",
            ru: "На профессиональной химии и сертифицированных керамических покрытиях. Шампуни — с нейтральным pH, а машину моем вручную, без щёток.",
          },
          {
            pl: "Przy odbiorze mówimy, co dokładnie nałożyliśmy, i podpowiadamy, jak dbać o auto, żeby efekt został na dłużej.",
            ru: "При выдаче рассказываем, что именно нанесли, и подсказываем, как ухаживать за машиной, чтобы результат держался дольше.",
          },
        ],
        photo: aboutPhoto("chemia", {
          pl: "Regał z czarnymi butelkami, aplikatorami i ręcznikami z mikrofibry",
          ru: "Стеллаж с чёрными бутылками, аппликаторами и полотенцами из микрофибры",
        }),
      },
    ],
  },
};
