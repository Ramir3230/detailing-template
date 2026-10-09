import type { CSSProperties } from "react";
import type { MapFile, StudioMap } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";

type Props = {
  map: StudioMap;
  /** Карта для диктора: «Mapa dojazdu: адрес». */
  label: string;
  /** Маршрут в Google Maps: есть — карта нажимается, как «Trasa». */
  routeUrl?: string;
  dict: Dictionary;
  className: string;
};

/* Источники карты: подпись под ней требуют лицензии OpenStreetMap и OpenMapTiles */
const credits = [
  { name: "© OpenStreetMap", href: "https://www.openstreetmap.org/copyright" },
  { name: "© OpenMapTiles", href: "https://openmaptiles.org/" },
  { name: "OpenFreeMap", href: "https://openfreemap.org/" },
];

/* Файл для экрана 2x — в половину размера */
const cssSize = ({ width, height }: MapFile) => `${width / 2}px ${height / 2}px`;

/*
 * Карта страницы Kontakt (DESIGN.md, «Страница Kontakt»): улицы цветом темы по маске из
 * файла, булавка акцентом в середине — там, где центр карты. Телефон и планшет — 4:3,
 * десктоп — 8:3 на ширину контейнера.
 */
export function ContactMap({ map, label, routeUrl, dict, className }: Props) {
  const files = {
    "--map-wide": `url(${map.wide.src})`,
    "--map-wide-size": cssSize(map.wide),
    "--map-narrow": `url(${map.narrow.src})`,
    "--map-narrow-size": cssSize(map.narrow),
  } as CSSProperties;

  const picture = (
    <div
      role="img"
      aria-label={label}
      style={files}
      className="relative aspect-[4/3] overflow-hidden rounded-card border border-line bg-surface transition-colors group-hover:border-accent-border lg:aspect-[8/3] lg:rounded-card-lg"
    >
      <div aria-hidden="true" className="map-ink absolute inset-0" />
      <div aria-hidden="true" className="map-pin-glow absolute top-1/2 left-1/2 size-40 -translate-1/2" />
      <span aria-hidden="true" className="map-pin absolute top-1/2 left-1/2 -translate-1/2" />
    </div>
  );

  return (
    <figure className={className}>
      {routeUrl ? (
        <a href={routeUrl} target="_blank" rel="noopener noreferrer" className="group block rounded-card lg:rounded-card-lg">
          {picture}
          <span className="sr-only">
            {dict.contact.route} ({dict.newTab})
          </span>
        </a>
      ) : (
        picture
      )}
      <figcaption className="mt-2 text-12 leading-body text-muted">
        {dict.contactPage.mapData}:{" "}
        {credits.map(({ name, href }, i) => (
          <span key={href}>
            {i > 0 && ", "}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="-my-3.5 inline-block py-3.5 underline underline-offset-2 transition-colors hover:text-fg"
            >
              {name}
              <span className="sr-only"> ({dict.newTab})</span>
            </a>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
