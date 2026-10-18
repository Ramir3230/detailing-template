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
  opacity: "opacity",
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

function attributesOf(source: string): Map<string, string> {
  return new Map([...source.matchAll(attributePattern)].map(([, name, double, single]) => [name, double ?? single]));
}

/**
 * Из чего знак: трубки, заливка или смесь, которую hero не повторит. Трубка — <path> с
 * fill="none" и цветом stroke. Атрибуты трубки копируются в hero по одному, поэтому у
 * знака из трубок нет групп, стилей и transform: их обводка в hero потерялась бы, и знак
 * в hero вышел бы не таким, как картинка в шапке.
 */
export function markShapes(svg: string): MarkShapes {
  const shapes = [...svg.matchAll(shapePattern)].map(([, tag, attributes]) => ({
    tag,
    attributes: attributesOf(attributes),
  }));
  const isTube = ({ tag, attributes }: (typeof shapes)[number]) =>
    tag === "path" && attributes.get("fill") === "none" && (attributes.get("stroke") ?? "none") !== "none";
  const tubes = shapes.filter(isTube);
  if (tubes.length === 0) return { kind: "fill" };
  if (tubes.length !== shapes.length) {
    return { kind: "invalid", reason: "трубки вперемешку с заливкой или фигурами не из <path>" };
  }
  if (/<(g|style|use|defs)\b|\s(transform|style|class)\s*=/.test(svg)) {
    return { kind: "invalid", reason: "у знака из трубок нет групп, стилей и transform — только <path> со своими атрибутами" };
  }

  const viewBox = attributesOf(svg.match(/<svg\b([^>]*)>/)?.[1] ?? "").get("viewBox");
  if (!viewBox) return { kind: "invalid", reason: "у знака нет viewBox" };

  const parsed: Tube[] = [];
  for (const { attributes } of tubes) {
    const tube: Tube = { d: attributes.get("d") ?? "" };
    if (!tube.d) return { kind: "invalid", reason: "у трубки нет контура d" };
    for (const [name, value] of attributes) {
      if (name === "d" || name === "fill") continue;
      if (!(name in tubeAttributes)) return { kind: "invalid", reason: `атрибут трубки ${name} в hero не переносится` };
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
