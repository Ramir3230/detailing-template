/*
 * Знак студии из неоновых трубок (DESIGN.md, «Знак студии»): каждая трубка — <path> без
 * заливки, со своим цветом обводки. В hero телефона такой знак встаёт в страницу кодом,
 * и свет пробегает трубки по очереди; знак с заливкой загорается ударом неона целиком.
 */

/** Атрибуты трубки, которые переносятся в hero: SVG-имя → свойство React. */
const tubeAttributes = {
  stroke: "stroke",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-opacity": "strokeOpacity",
} as const;

type TubeAttribute = (typeof tubeAttributes)[keyof typeof tubeAttributes];

/** Трубка знака: контур и его обводка — те же, что в файле, без заливки. */
export type Tube = { d: string } & Partial<Record<TubeAttribute, string>>;

export type MarkShapes =
  /** Знак с заливкой: загорается целиком, как надпись. */
  | { kind: "fill" }
  /** Знак из трубок — в порядке файла: в нём свет их и пробегает. */
  | { kind: "tubes"; viewBox: string; tubes: Tube[] }
  /** Трубки, которые в hero вышли бы не такими, как в шапке: тест данных называет причину. */
  | { kind: "invalid"; reason: string };

const shapePattern = /<(path|circle|ellipse|line|polyline|polygon|rect)\b([^>]*?)\/?>/g;
const attributePattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/* Атрибуты корня, которые трубок не касаются. Остальные (обводку, заливку) трубки картинки
   в шапке наследуют, а трубки hero — нет */
const rootAttributes = /^(xmlns(:[\w-]+)?|viewBox|width|height|version|xml:space)$/;

/* То, что трубка картинки в шапке берёт не из своих атрибутов: группы, стили, градиенты,
   обрезка. Контур внутри clipPath или symbol разбор принял бы за трубку */
const outsideTubes =
  /<(g|style|use|defs|clipPath|mask|symbol|pattern|marker|linearGradient|radialGradient|filter)\b|\s(transform|style|class)\s*=/;

/* Цвет трубки — как цвета темы: currentColor в hero стал бы цветом текста, url() — пустотой */
const hexColor = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;

function attributesOf(source: string): Map<string, string> {
  return new Map([...source.matchAll(attributePattern)].map(([, name, double, single]) => [name, double ?? single]));
}

const invalid = (reason: string): MarkShapes => ({ kind: "invalid", reason });

/**
 * Из чего знак: трубки, заливка или то, что hero не повторит. Трубка — <path> с
 * fill="none", hex-цветом stroke и одним контуром: свет бежит по ней от начала к концу.
 * Атрибуты трубки копируются в hero по одному, поэтому у знака из трубок нет групп,
 * стилей, transform и обводки у корня: в hero они потерялись бы, и знак вышел бы не
 * таким, как картинка в шапке.
 */
export function markShapes(file: string): MarkShapes {
  // Закомментированный контур картинка не рисует — и разбор его не видит
  const svg = file.replace(/<!--[\s\S]*?-->/g, "");
  const root = attributesOf(svg.match(/<svg\b([^>]*)>/)?.[1] ?? "");
  const shapes = [...svg.matchAll(shapePattern)].map(([, tag, attributes]) => ({
    tag,
    attributes: attributesOf(attributes),
  }));
  const isTube = ({ tag, attributes }: (typeof shapes)[number]) =>
    tag === "path" && attributes.get("fill") === "none" && (attributes.get("stroke") ?? "none") !== "none";
  const tubes = shapes.filter(isTube);
  if (tubes.length === 0) {
    // fill="none" у корня — трубки без своего fill (так экспортирует Figma): без причины
    // знак молча загорелся бы целиком
    return root.get("fill") === "none"
      ? invalid('fill="none" у корня <svg> в hero не переносится — перенеси на каждую трубку')
      : { kind: "fill" };
  }
  if (tubes.length !== shapes.length) return invalid("трубки вперемешку с заливкой или фигурами не из <path>");
  const rootExtra = [...root.keys()].find((name) => !rootAttributes.test(name));
  if (rootExtra) return invalid(`атрибут корня <svg> ${rootExtra} в hero не переносится — перенеси на каждую трубку`);
  if (outsideTubes.test(svg)) {
    return invalid("у знака из трубок нет групп, стилей, градиентов и transform — только <path> со своими атрибутами");
  }
  const viewBox = root.get("viewBox");
  if (!viewBox) return invalid("у знака нет viewBox");

  const parsed: Tube[] = [];
  for (const { attributes } of tubes) {
    const tube: Tube = { d: attributes.get("d") ?? "" };
    if (!tube.d) return invalid("у трубки нет контура d");
    // Несколько контуров в одном d свет пробегал бы разом, а не от начала к концу
    if ((tube.d.match(/[Mm]/g) ?? []).length !== 1) return invalid("одна трубка — один контур: в d один moveto");
    if (!hexColor.test(attributes.get("stroke") ?? "")) return invalid("цвет трубки — hex: #rrggbb");
    for (const [name, value] of attributes) {
      if (name === "d" || name === "fill") continue;
      if (!(name in tubeAttributes)) return invalid(`атрибут трубки ${name} в hero не переносится`);
      tube[tubeAttributes[name as keyof typeof tubeAttributes]] = value;
    }
    parsed.push(tube);
  }
  return { kind: "tubes", viewBox, tubes: parsed };
}

/*
 * Зажигание знака из трубок (DESIGN.md, «Движение»), секунды от data-lit. Свет трогается
 * вместе с неоном пола и пробегает все трубки за окно 0,9 с: каждая — за 0,6 окна,
 * следующая трогается, пока предыдущая догорает. Потом знак загорается ударом неона,
 * надпись — последней.
 */
const TUBES_START = 1.3;
const TUBES_WINDOW = 0.9;
const TUBE_SHARE = 0.6;

/** Удар неона: знак — когда свет пробежал все трубки, надпись — на 0,4 с позже. */
export const tubeStrikes = { mark: TUBES_START + TUBES_WINDOW, word: TUBES_START + TUBES_WINDOW + 0.4 };

/** Когда свет трогается по трубке и сколько её пробегает, в секундах. */
export function tubeTimings(count: number): { delay: number; run: number }[] {
  if (count === 1) return [{ delay: TUBES_START, run: TUBES_WINDOW }];
  const run = TUBES_WINDOW * TUBE_SHARE;
  const step = (TUBES_WINDOW - run) / (count - 1);
  return Array.from({ length: count }, (_, i) => ({ delay: TUBES_START + i * step, run }));
}
