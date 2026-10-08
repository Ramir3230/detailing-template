"""Машина hero: вырезка на прозрачном фоне, отдельный слой светодиодов фар и карта
глубины для объёма.

Всё, что относится к конкретному кадру, лежит в JSON рядом со скриптом, а не в коде:
новая машина — новый JSON. Файлы ложатся в `public/hero/<имя JSON>/`, поэтому вырезка
другой машины не перезапишет ту, на которую ссылаются данные студии. Скрипт печатает
поле `hero.car` для файла данных студии: пути, размеры и центры фар.

    python scripts/hero-car/cutout.py scripts/hero-car/m3.json --source "<исходник>"
        [--out public/hero/m3] [--preview DIR] [--depth-model v2|da3] [--da3-python PATH]

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

Глубину даёт Depth Anything V2 Small (ONNX, ~100 МБ, скачивается один раз в
~/.cache/depth-anything): лицензия Apache 2.0. Base и Large точнее, но под CC BY-NC —
для сайтов клиентов не годятся. Или, с --depth-model da3, Depth Anything 3 Mono Large
(Apache 2.0): крупнее и даёт глубину, а не обратную ей величину, — пропорции кузова
вернее. Она живёт в своём окружении на видеокарте, см. depth_da3.py. Модель видит
кадр целиком, с полом и стеной: так она вернее понимает, где перед машины. Карта
режется по тем же границам, что и машина.
"""

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps
from pymatting import estimate_foreground_ml
from rembg import new_session, remove
from scipy import ndimage

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PUBLIC = ROOT / "public"
ALPHA_MIN = 16  # прозрачность ниже этой — фон, когда ищем границы машины
LUMA = np.array([0.2126, 0.7152, 0.0722])
# Пятно меньше десятой доли крупнейшего в зоне — блик на стекле или корпусе, а не
# светодиод. На M3 при 5% проходила дуга кромки стекла только у левой фары.
LED_MIN_SHARE = 0.1
# Мягкий край вокруг светодиода, px результата: без него кольца обрезаны по порогу
LED_EDGE = 3

# Ревизия закреплена и сверяется по хэшу: обновление модели на Hugging Face иначе молча
# поменяло бы карту при следующем прогоне
DEPTH_URL = (
    "https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/"
    "4472b7362082ad9968fee890ca0f1e5aca36b93d/onnx/model.onnx"
)
DEPTH_SHA256 = "afb6a5c28f3b6bf1618c6e43f02073ef9dfdc70e937502d51603e57b0a1df10c"
DEPTH_MODEL = Path.home() / ".cache" / "depth-anything" / "dav2-small.onnx"
# Ширина входа модели, кратна 14. Обучена на 518, но на 1022 решётка и фары отделяются
# от бампера, а форма кузова та же. Процессору — секунды
DEPTH_INPUT = 1022
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406])
IMAGENET_STD = np.array([0.229, 0.224, 0.225])
# Ширина карты: глубина гладкая, полный размер машины ей не нужен
DEPTH_WIDTH = 800
# Разглаживание перед наклонами, px карты: без него свет ложится на кузов ступеньками
DEPTH_BLUR = 2.5
# Наклон в карте — от −DEPTH_SLOPE до DEPTH_SLOPE глубины на ширину или высоту кадра
DEPTH_SLOPE = 8.0
# Полоса за силуэтом, px карты, где глубина продолжает кузов: шире ячейки сетки, которой
# страница поворачивает машину. Дальше карта ровная — так файл легче
DEPTH_EDGE = 8
DEPTH_FAR_BLUR = 12
# Python окружения Depth Anything 3: из переменной DA3_PYTHON или из места по умолчанию
DA3_PYTHON = Path(
    os.environ.get("DA3_PYTHON") or Path.home() / ".cache" / "da3" / "venv" / "Scripts" / "python.exe"
)


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


def depth_v2(crop: Image.Image) -> np.ndarray:
    """Относительная близость в размере crop от Depth Anything V2: больше — ближе."""
    if not DEPTH_MODEL.exists():
        # В stderr: stdout — поле для файла данных студии
        print(f"скачиваю модель глубины в {DEPTH_MODEL}…", file=sys.stderr)
        DEPTH_MODEL.parent.mkdir(parents=True, exist_ok=True)
        part = DEPTH_MODEL.with_suffix(".part")
        urllib.request.urlretrieve(DEPTH_URL, part)
        if hashlib.sha256(part.read_bytes()).hexdigest() != DEPTH_SHA256:
            part.unlink()
            raise SystemExit("модель глубины скачалась не та: хэш не сходится с DEPTH_SHA256")
        part.replace(DEPTH_MODEL)
    session = ort.InferenceSession(str(DEPTH_MODEL), providers=["CPUExecutionProvider"])
    height = round(DEPTH_INPUT * crop.height / crop.width / 14) * 14
    rgb = np.asarray(crop.resize((DEPTH_INPUT, height), Image.BICUBIC), dtype=np.float32) / 255
    pixels = ((rgb - IMAGENET_MEAN) / IMAGENET_STD).transpose(2, 0, 1)[None].astype(np.float32)
    depth = session.run(None, {session.get_inputs()[0].name: pixels})[0][0]
    return np.asarray(Image.fromarray(depth.astype(np.float32), "F").resize(crop.size, Image.BICUBIC))


def depth_da3(crop: Image.Image, python: Path) -> np.ndarray:
    """То же от Depth Anything 3 — отдельным процессом в её окружении. Она даёт
    расстояние, поэтому знак меняется: больше — ближе, как у V2. Линейно по расстоянию,
    без обратной величины: так и задумано."""
    if not python.exists():
        raise SystemExit(f"нет окружения Depth Anything 3: {python} (см. depth_da3.py)")
    with tempfile.TemporaryDirectory() as folder:
        image, result = Path(folder) / "crop.png", Path(folder) / "depth.npy"
        crop.save(image)
        # Журнал модели — в stderr: stdout — поле для файла данных студии
        subprocess.run(
            [str(python), str(HERE / "depth_da3.py"), str(image), str(result)],
            check=True,
            stdout=sys.stderr,
        )
        return -np.load(result)


def depth_map(depth: np.ndarray, alpha: np.ndarray) -> Image.Image:
    """Карта объёма для страницы: три серые панели одна под другой, каждая — кадр машины.
    Сверху глубина кузова (светлее — ближе к зрителю), под ней наклоны глубины по ширине
    и по высоте кадра (серый 128 — ровно): по ним страница кладёт свет на кузов. Серая, а
    не цветная, потому что сжатие с потерями смешало бы цветовые каналы.
    За силуэтом глубина продолжает ближайший край кузова: иначе при повороте кромка
    машины рвалась бы о далёкую стену."""
    inside = alpha > 0.5
    lo, hi = np.percentile(depth[inside], [1, 99.5])
    flat = np.clip((depth - lo) / (hi - lo), 0, 1)
    rows, cols = ndimage.distance_transform_edt(~inside, return_indices=True)[1]
    smooth = ndimage.gaussian_filter(flat[rows, cols], DEPTH_BLUR)
    height, width = smooth.shape
    slope_v, slope_u = np.gradient(smooth)
    edge = ndimage.binary_dilation(alpha > ALPHA_MIN / 255, iterations=DEPTH_EDGE)
    panels = [
        np.where(edge, smooth, ndimage.gaussian_filter(smooth, DEPTH_FAR_BLUR)) * 255,
        *(
            np.where(edge, np.clip(128 + s / DEPTH_SLOPE * 127, 0, 255), 128)
            for s in (slope_u * width, slope_v * height)
        ),
    ]
    return Image.fromarray(np.vstack(panels).round().astype(np.uint8), "L")


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
    parser.add_argument("--depth-model", choices=["v2", "da3"], default="v2", help="модель глубины")
    parser.add_argument("--da3-python", type=Path, default=DA3_PYTHON, help="python окружения DA3")
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
    near = depth_da3(crop, args.da3_python) if args.depth_model == "da3" else depth_v2(crop)
    depth = near[by : by + car.height, bx : bx + car.width]
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

    # Карта глубины — того же кадра, что машина, в меньшем размере
    size = (DEPTH_WIDTH, round(car.height * DEPTH_WIDTH / car.width))
    depth = np.asarray(Image.fromarray(depth, "F").resize(size, Image.BICUBIC))
    alpha = np.asarray(car.getchannel("A").resize(size, Image.BILINEAR), dtype=np.float64) / 255
    relief = depth_map(depth, alpha)

    out.mkdir(parents=True, exist_ok=True)
    car.save(out / "car.webp", "WEBP", quality=90, method=6)
    lights.save(out / "car-lights.webp", "WEBP", lossless=True, method=6)
    relief.save(out / "car-depth.webp", "WEBP", quality=90, method=6)
    if args.preview:
        args.preview.mkdir(parents=True, exist_ok=True)
        preview(car, lights, args.preview / "car-preview.png")

    url = "/" + out.relative_to(PUBLIC).as_posix()
    print(json.dumps({
        "src": f"{url}/car.webp",
        "lights": f"{url}/car-lights.webp",
        "depth": f"{url}/car-depth.webp",
        "width": car.width,
        "height": car.height,
        "headlights": centres,
    }, indent=2))


if __name__ == "__main__":
    main()
