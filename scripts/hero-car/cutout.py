"""Машина hero: вырезка на прозрачном фоне и отдельный слой светодиодов фар.

Всё, что относится к конкретному кадру, лежит в JSON рядом со скриптом, а не в коде:
новая машина — новый JSON. Скрипт печатает поле `hero.car` для файла данных студии:
размеры и центры фар, которые страница берёт из данных.

    python scripts/hero-car/cutout.py scripts/hero-car/m3.json --source "<исходник>"
        [--out public/hero] [--preview DIR]

Поля JSON (координаты — пиксели исходника):
    sourceSize   ожидаемый размер исходника: координаты ниже сняты с него;
    crop         область машины с запасом. Нижний край — над отражением в полу:
                 страница рисует свой неон пола;
    outWidth     ширина результата (DESIGN.md, «Фотографии»: от 1600 px);
    maskLevels   растяжка мягкой маски в 0–255: ниже — фон, выше — кузов;
    lightZones   прямоугольники фар [left, top, right, bottom]. Вне них блики капота
                 и крыльев не должны загораться;
    lightLevels  яркость, с которой пиксель в зоне фары начинает и заканчивает
                 становиться слоем светодиодов.

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

ALPHA_MIN = 16  # прозрачность ниже этой — фон, когда ищем границы машины
LUMA = np.array([0.2126, 0.7152, 0.0722])


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


def extract_lights(car: Image.Image, zones: list[tuple[int, int, int, int]], levels) -> Image.Image:
    """Только светодиоды: яркие пиксели внутри зон фар, тот же размер, что у машины."""
    rgba = np.asarray(car, dtype=np.float64)
    lum = rgba[..., :3] @ LUMA
    lo, hi = levels
    ramp = np.clip((lum - lo) / (hi - lo), 0, 1)
    alpha = np.zeros_like(ramp)
    for left, top, right, bottom in zones:
        alpha[top:bottom, left:right] = ramp[top:bottom, left:right]
    alpha *= rgba[..., 3] / 255
    out = np.dstack([rgba[..., :3], alpha * 255])
    return Image.fromarray(out.round().astype(np.uint8), "RGBA")


def light_centres(lights: Image.Image, zones) -> list[dict[str, float]]:
    """Центр фары — середина рамки вокруг её горящих светодиодов, в процентах кадра
    машины. Центр тяжести не годится: его тянут вниз самые яркие нижние дуги."""
    a = np.asarray(lights.getchannel("A"))
    centres = []
    for left, top, right, bottom in zones:
        ys, xs = np.nonzero(a[top:bottom, left:right] > 127)
        if len(xs) == 0:
            raise SystemExit(f"в зоне фары {left, top, right, bottom} нет светодиодов: проверьте lightLevels")
        x = left + (xs.min() + xs.max() + 1) / 2
        y = top + (ys.min() + ys.max() + 1) / 2
        centres.append({"x": round(x / lights.width * 100, 1), "y": round(y / lights.height * 100, 1)})
    return centres


def preview(car: Image.Image, lights: Image.Image, path: Path) -> None:
    """Машина на фоне темы с горящими фарами — для проверки кромки глазами."""
    bg = Image.new("RGBA", car.size, (5, 5, 7, 255))
    lit = Image.alpha_composite(bg, car)
    glow = np.asarray(lights, dtype=np.float64)
    base = np.asarray(lit, dtype=np.float64)[..., :3]
    a = glow[..., 3:] / 255
    screen = 255 - (255 - base) * (255 - glow[..., :3] * a) / 255
    Image.fromarray(screen.round().astype(np.uint8), "RGB").save(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("frame", type=Path, help="JSON с параметрами кадра")
    parser.add_argument("--source", type=Path, required=True, help="исходник машины")
    parser.add_argument("--out", type=Path, default=Path("public/hero"))
    parser.add_argument("--preview", type=Path, help="папка для превью на тёмном фоне")
    args = parser.parse_args()

    frame = json.loads(args.frame.read_text(encoding="utf-8"))
    src = ImageOps.exif_transpose(Image.open(args.source)).convert("RGB")
    if list(src.size) != frame["sourceSize"]:
        raise SystemExit(f"исходник {src.size}, а координаты в {args.frame.name} сняты с {frame['sourceSize']}")

    crop = src.crop(tuple(frame["crop"]))
    car, (bx, by) = cut_car(crop, car_alpha(crop, tuple(frame["maskLevels"])))
    full_width = car.width
    car = resize(car, frame["outWidth"])

    # Зоны фар из пикселей исходника — в пиксели результата
    ox, oy = frame["crop"][0] + bx, frame["crop"][1] + by
    scale = car.width / full_width
    zones = [
        tuple(round(v * scale) for v in (left - ox, top - oy, right - ox, bottom - oy))
        for left, top, right, bottom in frame["lightZones"]
    ]
    lights = extract_lights(car, zones, frame["lightLevels"])

    args.out.mkdir(parents=True, exist_ok=True)
    car.save(args.out / "car.webp", "WEBP", quality=90, method=6)
    lights.save(args.out / "car-lights.webp", "WEBP", lossless=True, method=6)
    if args.preview:
        args.preview.mkdir(parents=True, exist_ok=True)
        preview(car, lights, args.preview / "car-preview.png")

    # Адрес на сайте: путь от public/
    url = "/" + args.out.resolve().relative_to(Path("public").resolve()).as_posix()
    print(json.dumps({
        "src": f"{url}/car.webp",
        "lights": f"{url}/car-lights.webp",
        "width": car.width,
        "height": car.height,
        "headlights": light_centres(lights, zones),
    }, indent=2))


if __name__ == "__main__":
    main()
