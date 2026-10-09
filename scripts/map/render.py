"""Карта для страницы Kontakt: улицы вокруг студии «чернилами» — белым с прозрачностью.

Страница красит чернила цветом темы (маской CSS) и сама рисует булавку в середине
блока, поэтому карта от темы не зависит: при смене цветов её не перерисовывают. Новая
студия — новый JSON рядом со скриптом; файлы ложатся в `public/mapa/` под именем JSON и
не затирают карту другой студии. Скрипт печатает поле `address.map` для файла данных
студии.

    python scripts/map/render.py scripts/map/afterdark.json [--out public/mapa] [--preview DIR]

Поля JSON:
    center   [широта, долгота] булавки — она в середине кадра;
    zoom     масштаб MapLibre: 15 — квартал с названиями улиц.

Два файла из одного кадра: широкий — для десктопа, узкий (его середина) — для телефона
и планшета, чтобы телефон не грузил лишнее. Оба для экрана 2x: страница показывает их
в половину размера и середину в середине блока — без масштабирования, поэтому подписи
улиц на телефоне того же размера, что на десктопе.

Подложка — векторные тайлы OpenFreeMap: бесплатно, в том числе для коммерции, без ключей
и cookies. Данные — OpenStreetMap (ODbL), схема тайлов — OpenMapTiles: подпись с ними
под картой обязательна, её ставит страница. Рисует MapLibre с unpkg в безголовом
Chromium (Playwright):

    pip install -r scripts/map/requirements.txt
    python -m playwright install chromium
"""

import argparse
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]

# Кадр в CSS-пикселях. Широкий — с контент десктопа (1200 − поля 32) и выше блока карты
# там (8:3 → 426); узкий — с колонку планшета 640 × 3/4 (DESIGN.md, «Страница Kontakt»).
WIDE = (1136, 480)
NARROW = (640, 480)
SCALE = 2  # экран 2x

MAPLIBRE = "https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.js"


def ink(level: float) -> str:
    """Чернила силой level (0–1): рисуются непрозрачным серым на чёрном и потом
    становятся прозрачностью. Полупрозрачные линии дали бы яркие точки на стыках
    отрезков."""
    v = round(level * 255)
    return f"rgb({v},{v},{v})"


NAMES = "names"


def classes(*names: str) -> list:
    return ["in", ["get", "class"], ["literal", list(names)]]


# Иерархия — силой одних чернил: крупные улицы и подписи ярче, кварталы — фоном.
# Служебные пути железной дороги (депо, подъездные) не рисуются: сортировочная станция
# превращалась бы в штриховку
STYLE = {
    "version": 8,
    "glyphs": "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    "sources": {"omt": {"type": "vector", "url": "https://tiles.openfreemap.org/planet"}},
    "layers": [
        {"id": "background", "type": "background", "paint": {"background-color": ink(0)}},
        {"id": "water", "type": "fill", "source": "omt", "source-layer": "water",
         "paint": {"fill-color": ink(0.1)}},
        {"id": "park", "type": "fill", "source": "omt", "source-layer": "landuse",
         "filter": classes("park", "cemetery"), "paint": {"fill-color": ink(0.04)}},
        {"id": "green", "type": "fill", "source": "omt", "source-layer": "landcover",
         "filter": classes("wood", "grass"), "paint": {"fill-color": ink(0.035)}},
        {"id": "building", "type": "fill", "source": "omt", "source-layer": "building",
         "paint": {"fill-color": ink(0.04)}},
        {"id": "rail", "type": "line", "source": "omt", "source-layer": "transportation",
         "filter": ["all", ["==", ["get", "class"], "rail"], ["!", ["has", "service"]]],
         "paint": {"line-color": ink(0.12), "line-width": 1, "line-dasharray": [3, 3]}},
        {"id": "minor", "type": "line", "source": "omt", "source-layer": "transportation",
         "filter": classes("minor"), "layout": {"line-cap": "round", "line-join": "round"},
         "paint": {"line-color": ink(0.26), "line-width": 2}},
        {"id": "major", "type": "line", "source": "omt", "source-layer": "transportation",
         "filter": classes("tertiary", "secondary", "primary", "trunk", "motorway"),
         "layout": {"line-cap": "round", "line-join": "round"},
         "paint": {"line-color": ink(0.42),
                   "line-width": ["match", ["get", "class"], "tertiary", 3, "secondary", 4, 5]}},
        # Подписи 13 px — мельче DESIGN.md не разрешает. Линии под ними вырезает
        # knock_out(): ореол MapLibre обводит буквы, а в пробелах между словами улица
        # просвечивала бы точкой
        {"id": NAMES, "type": "symbol", "source": "omt", "source-layer": "transportation_name",
         "filter": classes("minor", "tertiary", "secondary", "primary", "trunk"),
         "layout": {"symbol-placement": "line",
                    "text-field": ["coalesce", ["get", "name:pl"], ["get", "name"]],
                    "text-font": ["Noto Sans Regular"], "text-size": 13},
         "paint": {"text-color": ink(0.7)}},
    ],
}

PAGE = """<!doctype html><html><head>
<script>window.onerror = (m) => {{ window.failed = String(m); }};</script>
<script src="{maplibre}" onerror="window.failed = 'MapLibre не загрузился с unpkg'"></script>
<style>html,body{{margin:0;background:#000}}#m{{width:{w}px;height:{h}px}}</style>
</head><body><div id="m"></div><script>
const map = new maplibregl.Map({{
  container: "m", style: {style}, center: [{lng}, {lat}], zoom: {zoom},
  interactive: false, attributionControl: false, fadeDuration: 0,
  canvasContextAttributes: {{ preserveDrawingBuffer: true }},
}});
map.on("error", (e) => {{ window.failed = String((e.error && e.error.message) || e); }});
map.once("idle", () => {{ window.done = true; }});
// Оставить видимыми только подписи (true) или всё, кроме них (false). Место подписей
// при этом не меняется: MapLibre расставляет их только относительно друг друга
window.only = (names) => new Promise((resolve) => {{
  for (const {{ id }} of map.getStyle().layers) {{
    if (id === "background") continue;
    map.setLayoutProperty(id, "visibility", (id === "{names}") === names ? "visible" : "none");
  }}
  map.once("idle", resolve);
}});
</script></body></html>"""


def render(center: list, zoom: float) -> tuple[Image.Image, Image.Image]:
    """Кадр WIDE для экрана 2x двумя слоями — линии и подписи; яркость — сила чернил."""
    lat, lng = center
    html = PAGE.format(maplibre=MAPLIBRE, w=WIDE[0], h=WIDE[1], style=json.dumps(STYLE),
                       lat=lat, lng=lng, zoom=zoom, names=NAMES)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": WIDE[0], "height": WIDE[1]},
                                device_scale_factor=SCALE)
        page.set_content(html)
        page.wait_for_function("window.done === true || window.failed", timeout=90_000)
        failed = page.evaluate("window.failed")
        if failed:
            raise SystemExit(f"MapLibre: {failed}")
        layers = []
        for names in (False, True):
            page.evaluate("(names) => window.only(names)", names)
            png = page.locator("#m").screenshot()
            layers.append(Image.open(io.BytesIO(png)).convert("L"))
        browser.close()
    return layers[0], layers[1]


def knock_out(lines: Image.Image, names: Image.Image) -> Image.Image:
    """Подписи поверх линий, а под ними и вокруг — пусто. Поле вокруг букв шире половины
    пробела (около 7 px на экране 2x): слово не разрывается линией улицы."""
    field = names.point(lambda v: 255 if v > 8 else 0).filter(ImageFilter.MaxFilter(11))
    return ImageChops.lighter(ImageChops.subtract(lines, field), names)


def save(level: Image.Image, path: Path) -> dict:
    """Белый с прозрачностью по силе чернил. Прозрачность сжимается с потерями: на тёмной
    карте разницы не видно, а файл вдвое легче."""
    white = Image.new("L", level.size, 255)
    Image.merge("RGBA", (white, white, white, level)).save(
        path, "WEBP", quality=80, alpha_quality=60, method=6)
    src = "/" + path.relative_to(ROOT / "public").as_posix()
    print(f"{path.relative_to(ROOT).as_posix()} — {path.stat().st_size // 1024} КБ")
    return {"src": src, "width": level.width, "height": level.height}


def main() -> None:
    # Консоль Windows по умолчанию не в UTF-8: и вывод, и ошибки — по-русски
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("params", type=Path)
    parser.add_argument("--out", type=Path, default=ROOT / "public" / "mapa")
    parser.add_argument("--preview", type=Path, help="папка для превью на тёмном фоне")
    args = parser.parse_args()

    out = args.out.resolve()
    if not out.is_relative_to(ROOT / "public"):
        raise SystemExit("--out — папка внутри public/: из неё строится адрес файла")

    params = json.loads(args.params.read_text(encoding="utf-8"))
    center, zoom = params["center"], params["zoom"]
    if not (len(center) == 2 and -90 <= center[0] <= 90 and -180 <= center[1] <= 180):
        raise SystemExit("center — [широта, долгота]")

    level = knock_out(*render(center, zoom))
    w, h = NARROW[0] * SCALE, NARROW[1] * SCALE
    left, top = (level.width - w) // 2, (level.height - h) // 2
    narrow = level.crop((left, top, left + w, top + h))

    out.mkdir(parents=True, exist_ok=True)
    stem = args.params.stem
    files = {"wide": save(level, out / f"{stem}.webp"),
             "narrow": save(narrow, out / f"{stem}-narrow.webp")}

    if args.preview:
        args.preview.mkdir(parents=True, exist_ok=True)
        dark = Image.new("L", level.size, 5)
        Image.composite(Image.new("L", level.size, 245), dark, level).save(
            args.preview / f"{stem}-preview.png")

    print("map: {")
    for name, f in files.items():
        print(f'  {name}: {{ src: "{f["src"]}", width: {f["width"]}, height: {f["height"]} }},')
    print("},")


if __name__ == "__main__":
    main()
