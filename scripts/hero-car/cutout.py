"""Машина hero: вырезка на прозрачном фоне и отдельный слой светодиодов фар.

Всё, что относится к конкретному кадру, лежит в JSON рядом со скриптом, а не в коде:
новая машина — новый JSON. Файлы ложатся в `public/hero/<имя JSON>/`, поэтому вырезка
другой машины не перезапишет ту, на которую ссылаются данные студии. Скрипт печатает
поле `hero.car` для файла данных студии: пути, размеры и центры фар.

    python scripts/hero-car/cutout.py scripts/hero-car/m3.json --source "<исходник>"
        [--out public/hero/m3] [--preview DIR]

Поля JSON (координаты — пиксели исходника):
    sourceSize   ожидаемый размер исходника: координаты ниже сняты с него;
    crop         область машины с запасом [left, top, right, bottom]. Нижний край — над
                 отражением в полу: страница рисует свой неон пола;
    outWidth     ширина результата (DESIGN.md, «Фотографии»: от 1600 px). Увеличивать
                 скрипт не станет: машина в исходнике должна быть шире;
    maskLevels   растяжка мягкой маски в 0–255: ниже — фон, выше — кузов;
    lightZones   прямоугольники вокруг фар [left, top, right, bottom], с запасом.
                 Внутри зоны в слой идут только крупные пятна светодиодов: мелкие
                 блики корпуса и капота отбрасываются;
    lightLevels  яркость, с которой пиксель начинает и заканчивает становиться
                 светодиодом.

Маску даёт BiRefNet (rembg, модель birefnet-general, ~1 ГБ, скачивается один раз).
На один кадр хватает процессора — около минуты.
"""

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps
from pymatting import estimate_foreground_ml
from rembg import new_session, remove
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
ALPHA_MIN = 16  # прозрачность ниже этой — фон, когда ищем границы машины
LUMA = np.array([0.2126, 0.7152, 0.0722])
# Пятно меньше десятой доли крупнейшего в зоне — блик на стекле или корпусе, а не
# светодиод. На M3 при 5% проходила дуга кромки стекла только у левой фары.
LED_MIN_SHARE = 0.1
# Мягкий край вокруг светодиода, px результата: без него кольца обрезаны по порогу
LED_EDGE = 3


def car_alpha(crop: Image.Image, levels: tuple[int, int]) -> np.ndarray:
    """Мягкая маска 0..1. Внутри кузова модель даёт 250–254, у стен — лёгкую дымку."""
    mask = remove(crop, session=new_session("birefnet-general"), only_mask=True)
    lo, hi = levels
    return np.clip((np.asarray(mask, dtype=np.float64) - lo) / (hi - lo), 0, 1)


def cut_car(crop: Image.Image, alpha: np.ndarray) -> tuple[Image.Image, tuple[int, int]]:
    """Цвет кромки без белой стены: иначе на тёмном фоне вокруг машины светлый ореол.
    Возвращает машину, обрезанную по её границам, и сдвиг этих границ внутри crop."""
    rgb = np.asarray(crop, dtype=np.float64) / 255
    fg = estimate_foreground_ml(rgb, alpha)
    out = np.dstack([np.clip(fg, 0, 1), alpha]) * 255
    car = Image.fromarray(out.round().astype(np.uint8), "RGBA")

    a = car.getchannel("A").point(lambda v: 255 if v > ALPHA_MIN else 0)
    bbox = a.getbbox()
    if bbox is None:
        raise SystemExit("маска пустая: проверьте crop и maskLevels")
    return car.crop(bbox), bbox[:2]


def resize(img: Image.Image, width: int) -> Image.Image:
    """Уменьшение с премультипликацией: без тёмной каймы по краю альфы."""
    height = round(img.height * width / img.width)
    return img.convert("RGBa").resize((width, height), Image.LANCZOS).convert("RGBA")


def leds(ramp: np.ndarray, zone: tuple[int, int, int, int]) -> np.ndarray:
    """Маска светодиодов в зоне: крупные связные пятна ярких пикселей."""
    left, top, right, bottom = zone
    strong = ramp[top:bottom, left:right] > 0.5
    labels, count = ndimage.label(strong)
    if count == 0:
        raise SystemExit(f"в зоне фары {zone} нет светодиодов: проверьте lightLevels")
    sizes = ndimage.sum(strong, labels, range(1, count + 1))
    keep = np.isin(labels, 1 + np.flatnonzero(sizes >= sizes.max() * LED_MIN_SHARE))
    if keep[0].any() or keep[-1].any() or keep[:, 0].any() or keep[:, -1].any():
        raise SystemExit(f"зона фары {zone} режет свет или ловит блики: поправьте lightZones")
    return keep


def extract_lights(car: Image.Image, zones, levels) -> tuple[Image.Image, list[dict[str, float]]]:
    """Слой светодиодов того же размера, что машина, и фары в процентах кадра: центр и
    ширина рамки вокруг светодиодов. Центр — середина рамки: центр тяжести тянут вниз
    самые яркие нижние дуги колец. По ширине страница растягивает ореол фары."""
    rgba = np.asarray(car, dtype=np.float64)
    lo, hi = levels
    ramp = np.clip((rgba[..., :3] @ LUMA - lo) / (hi - lo), 0, 1)
    alpha = np.zeros_like(ramp)
    centres = []
    for zone in zones:
        left, top, right, bottom = zone
        keep = leds(ramp, zone)
        soft = ndimage.binary_dilation(keep, iterations=LED_EDGE)
        alpha[top:bottom, left:right] = ramp[top:bottom, left:right] * soft
        ys, xs = np.nonzero(keep)
        x = left + (xs.min() + xs.max() + 1) / 2
        y = top + (ys.min() + ys.max() + 1) / 2
        w = xs.max() - xs.min() + 1
        centres.append({
            "x": round(x / car.width * 100, 1),
            "y": round(y / car.height * 100, 1),
            "w": round(w / car.width * 100, 1),
        })
    alpha *= rgba[..., 3] / 255
    out = np.dstack([rgba[..., :3], alpha * 255])
    return Image.fromarray(out.round().astype(np.uint8), "RGBA"), centres


def preview(car: Image.Image, lights: Image.Image, path: Path) -> None:
    """Машина на фоне темы с горящими фарами — для проверки кромки глазами."""
    bg = Image.new("RGBA", car.size, (5, 5, 7, 255))
    lit = Image.alpha_composite(bg, car)
    glow = np.asarray(lights, dtype=np.float64)
    base = np.asarray(lit, dtype=np.float64)[..., :3]
    a = glow[..., 3:] / 255
    screen = 255 - (255 - base) * (255 - glow[..., :3] * a) / 255
    Image.fromarray(screen.round().astype(np.uint8), "RGB").save(path)


def inside(box, width: int, height: int) -> bool:
    left, top, right, bottom = box
    return 0 <= left < right <= width and 0 <= top < bottom <= height


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("frame", type=Path, help="JSON с параметрами кадра")
    parser.add_argument("--source", type=Path, required=True, help="исходник машины")
    parser.add_argument("--out", type=Path, help="папка внутри public/; по умолчанию public/hero/<имя JSON>")
    parser.add_argument("--preview", type=Path, help="папка для превью на тёмном фоне")
    args = parser.parse_args()

    out = (args.out or PUBLIC / "hero" / args.frame.stem).resolve()
    if not out.is_relative_to(PUBLIC):
        raise SystemExit(f"{out} вне public/: сайт не отдаст файлы")

    frame = json.loads(args.frame.read_text(encoding="utf-8"))
    src = ImageOps.exif_transpose(Image.open(args.source)).convert("RGB")
    if list(src.size) != frame["sourceSize"]:
        raise SystemExit(f"исходник {src.size}, а координаты в {args.frame.name} сняты с {frame['sourceSize']}")
    if not inside(frame["crop"], *src.size):
        raise SystemExit(f"crop {frame['crop']} выходит за исходник {src.size}")

    crop = src.crop(tuple(frame["crop"]))
    car, (bx, by) = cut_car(crop, car_alpha(crop, tuple(frame["maskLevels"])))
    if car.width < frame["outWidth"]:
        raise SystemExit(f"машина в исходнике {car.width} px, уже outWidth {frame['outWidth']}: исходник мал")
    full_width = car.width
    car = resize(car, frame["outWidth"])

    # Зоны фар из пикселей исходника — в пиксели результата
    ox, oy = frame["crop"][0] + bx, frame["crop"][1] + by
    scale = car.width / full_width
    zones = [
        tuple(round(v * scale) for v in (left - ox, top - oy, right - ox, bottom - oy))
        for left, top, right, bottom in frame["lightZones"]
    ]
    for source_zone, zone in zip(frame["lightZones"], zones):
        if not inside(zone, car.width, car.height):
            raise SystemExit(f"зона фары {source_zone} вне машины")
    lights, centres = extract_lights(car, zones, frame["lightLevels"])

    out.mkdir(parents=True, exist_ok=True)
    car.save(out / "car.webp", "WEBP", quality=90, method=6)
    lights.save(out / "car-lights.webp", "WEBP", lossless=True, method=6)
    if args.preview:
        args.preview.mkdir(parents=True, exist_ok=True)
        preview(car, lights, args.preview / "car-preview.png")

    url = "/" + out.relative_to(PUBLIC).as_posix()
    print(json.dumps({
        "src": f"{url}/car.webp",
        "lights": f"{url}/car-lights.webp",
        "width": car.width,
        "height": car.height,
        "headlights": centres,
    }, indent=2))


if __name__ == "__main__":
    main()
