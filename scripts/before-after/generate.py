"""Кадры ИИ для студии: пары до/после и одиночные кадры (фото входа).

Рисует модель RealVisXL V5.0 — SDXL под лицензией Open RAIL++-M: кадры можно ставить на
коммерческие сайты. На странице такие кадры подписаны как примеры (DESIGN.md,
«Фотографии»).

«po» модель рисует с нуля по промпту. «przed» — тот же кадр, испорченный только внутри
маски. Грязь и пятна дорисовывает модель, держась за контуры «po»; голограммы на лаке
рисует код — модель их не умеет. przed.webp вне маски прозрачный: страница кладёт его
поверх po.webp, и фон под шторкой — пиксели самого po.webp. Два непрозрачных кадра
сжатие испортило бы по-разному, и по тёмной стене вдоль шторки шла бы рябь. Кадр без
«przed» в JSON — одиночный.

    <python окружения> scripts/before-after/generate.py scripts/before-after/mycie.json
        [--candidates N [--vary po|przed] --preview DIR]

Без --candidates кадр собирается по сидам из JSON: файлы ложатся в public/, в stdout —
поле для файла данных студии. С --candidates N — только лист для выбора в --preview:
N сидов подряд от сида в JSON; --vary przed держит «po» и перебирает «przed». Выбранный
сид записывается в JSON: на той же видеокарте и тех же версиях кадр повторяется — с
точностью до мелкого шума, расчёт на видеокарте побитово не повторяется.

Кадры шаблона общие для всех демо, и правка JSON шаблона перезапишет файлы, на которые
ссылаются данные студий. Для своей студии — новый JSON с out вида
«przed-po/<студия>/<кадр>», существующие не править.

Поля JSON:
    out     путь внутри public/ без расширения. Пара ложится в <out>/po.webp и
            <out>/przed.webp, одиночный кадр — в <out>.webp;
    po      prompt, negative, seed; erase (необязательно) — прямоугольники [left, top,
            right, bottom] в пикселях кадра 1040×1300, которые затираются окружением:
            эмблема или номер, нарисованные моделью вопреки negative;
    przed   kind, seed и mask — "subject" (BiRefNet: машина или сиденье, фон не
            трогается) или "full" (весь кадр).
            kind "dirt" — грязь рисует модель: prompt, negative; strength — насколько
            она перерисовывает кадр внутри маски, 0–1: меньше — ближе к «po», больше —
            грязнее и дальше от него; control — насколько контуры «po» держат форму
            предмета, 0–1.
            kind "swirls" — голограммы, матовость, царапины и следы капель рисует код,
            сид — их случайная россыпь. Только тёмный лак: на светлой машине почти весь
            кузов светлее порога отражения, и «przed» не отличается от «po» — её грязь
            рисует kind "dirt".

Окружение — requirements.txt рядом. Модель (~7 ГБ) скачивается один раз в кэш Hugging
Face, маска BiRefNet — та же, что у вырезки машины hero. На RTX 2060 6 ГБ модель
целиком не помещается: её веса идут на видеокарту послойно, прямо перед расчётом.
"""

import argparse
import json
import sys
from functools import cache
from pathlib import Path

import cv2
import numpy as np
import torch
from diffusers import (
    AutoencoderKL,
    ControlNetModel,
    DPMSolverMultistepScheduler,
    StableDiffusionXLControlNetInpaintPipeline,
    StableDiffusionXLPipeline,
)
from diffusers.hooks import apply_group_offloading
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from rembg import new_session, remove

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parents[1] / "public"

# Ревизии закреплены: обновление модели на Hugging Face иначе молча поменяло бы кадр при
# том же сиде
MODEL = "SG161222/RealVisXL_V5.0"
MODEL_REVISION = "ac93e0dda1f6d448cae19bbfab8c5e720a5e48bc"
# VAE SDXL в половинной точности переполняется и даёт чёрный кадр; этот исправлен, MIT
VAE = "madebyollin/sdxl-vae-fp16-fix"
VAE_REVISION = "207b116dae70ace3637169f1ddd2434b91b3a8cd"
# Контуры «po» держат форму предмета, пока модель рисует грязь: без них при заметной
# грязи она перерисовывает строчку сиденья и детали кузова, и шторка показывает другой
# предмет. Малая версия — 300 МБ: полной на 6 ГБ тесно. Open RAIL++-M
CONTROLNET = "diffusers/controlnet-canny-sdxl-1.0-small"
CONTROLNET_REVISION = "edd85f64c5f87dfb6d73762949d9daca16389518"
# Пороги Canny, на которых ControlNet обучали
CANNY = (100, 200)

# Голограммы на лаке («swirls»). Царапины от мойки идут во все стороны, но под лампой
# блестят только те, что поперёк луча к ней: глаз видит кольца вокруг каждого отражения.
# Поэтому точки-затравки размазываются вдоль окружностей вокруг светлых мест кадра
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)
# Яркость, с которой пиксель — отражение лампы, а не лак
SWIRL_LIGHT = (0.55, 0.9)
# Радиус размытия ореола царапин вокруг отражения
SWIRL_HALO = 28
# Доля пикселей, из которых тянутся царапины, и их длина в каждую сторону, px
SWIRL_DENSITY = 0.045
SWIRL_LENGTH = 48
# Лак без глубины: края отражений мягче, чёрный приподнят к серому, вокруг ламп дымка
DULL_BLUR = 2.5
DULL_LIFT = 0.06
HAZE_SPREAD = 70
SCRATCHES = 30
WATER_SPOTS = 70

# Кадр 4:5 (DESIGN.md, «Фотографии»: до/после от 1040×1300). Модель рисует сторонами,
# кратными 8, поэтому кадр на 4 px выше — лишнее срезается поровну сверху и снизу
SIZE = (1040, 1300)
GEN_SIZE = (1040, 1304)
# Планировщик DPM++ 2M Karras — из рекомендаций автора модели. Шагов он советует от 50;
# 40 — выбор по времени на RTX 2060, проверено глазами. Не менять: сиды в JSON перестанут
# повторять выбранные кадры
STEPS = 40
GUIDANCE = 5.0
# Маска «subject» — радиусы размытия: раздувание за край предмета (запас около 20 px) и
# растушёвка края грязи (ещё около 20 px), чтобы граница дорисовки не была видна
MASK_GROW = 12
MASK_FEATHER = 8
QUALITY = 85
# Радиус, с которого затирание берёт окружение, px
ERASE_RADIUS = 5
# Лист кандидатов: кадр в треть размера, под ним сид
THUMB = (SIZE[0] // 3, SIZE[1] // 3)
GAP = 16
LABEL = 40
PAIRS_PER_ROW = 2
SINGLES_PER_ROW = 4


def load() -> tuple[StableDiffusionXLPipeline, StableDiffusionXLControlNetInpaintPipeline]:
    """Одна модель на оба шага: дорисовка «przed» берёт веса рисования «po»."""
    vae = AutoencoderKL.from_pretrained(VAE, revision=VAE_REVISION, torch_dtype=torch.float16)
    draw = StableDiffusionXLPipeline.from_pretrained(
        MODEL, revision=MODEL_REVISION, vae=vae, torch_dtype=torch.float16, variant="fp16"
    )
    draw.scheduler = DPMSolverMultistepScheduler.from_config(draw.scheduler.config, use_karras_sigmas=True)
    controlnet = ControlNetModel.from_pretrained(
        CONTROLNET, revision=CONTROLNET_REVISION, torch_dtype=torch.float16, variant="fp16"
    )
    paint = StableDiffusionXLControlNetInpaintPipeline(**draw.components, controlnet=controlnet)
    # Модель не помещается в 6 ГБ: её веса идут на видеокарту по слою прямо перед расчётом,
    # отдельным потоком, пока считается предыдущий слой. Целиком она уходить и
    # возвращаться не успевает: рядом с ControlNet память переполнялась, и драйвер в десять
    # раз медленнее гонял данные через общую. Поток требует закреплённой оперативной
    # памяти под копию весов, а Windows при 16 ГБ даёт закрепить около 5 ГБ: текстовые
    # кодировщики уходят и приходят без потока — они считают один раз за кадр. Кодировщик
    # картинки и ControlNet малы и лежат на видеокарте всё время
    cuda = torch.device("cuda")
    apply_group_offloading(draw.unet, onload_device=cuda, offload_type="leaf_level", use_stream=True)
    for encoder in (draw.text_encoder, draw.text_encoder_2):
        apply_group_offloading(encoder, onload_device=cuda, offload_type="leaf_level")
    draw.vae.to(cuda)
    controlnet.to(cuda)
    return draw, paint


def noise(seed: int) -> torch.Generator:
    """Шум на процессоре: от сида он тот же при любой раскладке модели по памяти."""
    return torch.Generator("cpu").manual_seed(seed)


def draw_po(draw: StableDiffusionXLPipeline, spec: dict, seed: int) -> Image.Image:
    po = draw(
        prompt=spec["prompt"],
        negative_prompt=spec["negative"],
        width=GEN_SIZE[0],
        height=GEN_SIZE[1],
        num_inference_steps=STEPS,
        guidance_scale=GUIDANCE,
        generator=noise(seed),
    ).images[0]
    return erase(po, spec.get("erase", []))


def erase(image: Image.Image, boxes: list) -> Image.Image:
    """Эмблемы, которые модель рисует вопреки negative, — заливкой от краёв прямоугольника.
    Затирается «po» до «przed»: в паре эмблемы нет ни на одном кадре."""
    if not boxes:
        return image
    rgb = np.asarray(image)
    mask = np.zeros(rgb.shape[:2], np.uint8)
    # Прямоугольники — в пикселях кадра 1040×1300, а «po» на 4 px выше
    top = (GEN_SIZE[1] - SIZE[1]) // 2
    for left, upper, right, lower in boxes:
        mask[upper + top : lower + top, left:right] = 255
    return Image.fromarray(cv2.inpaint(rgb, mask, ERASE_RADIUS, cv2.INPAINT_TELEA))


@cache
def birefnet():
    return new_session("birefnet-general")


def subject_mask(po: Image.Image) -> np.ndarray:
    """Машина или сиденье по BiRefNet: 0 — фон, 1 — предмет."""
    mask = np.asarray(remove(po, session=birefnet(), only_mask=True), np.float32) / 255
    if mask.max() < 0.5:
        raise SystemExit("BiRefNet не нашёл предмет в кадре: возьмите mask \"full\"")
    return (mask > 0.5).astype(np.float32)


def dirt_masks(po: Image.Image, kind: str) -> tuple[Image.Image, Image.Image]:
    """Где модель перерисовывает кадр и как её кадр ложится на «po». Пайплайн сам
    округляет маску до чёрно-белой по половине, поэтому перерисовывает он всю полосу
    растушёвки (repaint), а растушёвка (soft) гасит грязь к краю при наложении."""
    if kind == "full":
        full = Image.new("L", po.size, 255)
        return full, full
    subject = Image.fromarray((subject_mask(po) * 255).astype(np.uint8))
    grown = subject.filter(ImageFilter.GaussianBlur(MASK_GROW)).point(lambda v: 255 if v > 8 else 0)
    soft = grown.filter(ImageFilter.GaussianBlur(MASK_FEATHER))
    return soft.point(lambda v: 255 if v else 0), soft


def edges(image: Image.Image) -> Image.Image:
    """Контуры кадра для ControlNet: белые линии на чёрном."""
    lines = cv2.Canny(cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2GRAY), *CANNY)
    return Image.fromarray(lines).convert("RGB")


def with_region(przed: Image.Image, region: Image.Image) -> Image.Image:
    """«przed» с прозрачностью: непрозрачен только там, где отличается от «po»."""
    rgba = przed.convert("RGBA")
    rgba.putalpha(region.point(lambda v: 255 if v else 0))
    return rgba


def paint_dirt(
    paint: StableDiffusionXLControlNetInpaintPipeline, po: Image.Image, spec: dict, seed: int
) -> Image.Image:
    repaint, soft = dirt_masks(po, spec["mask"])
    dirty = paint(
        prompt=spec["prompt"],
        negative_prompt=spec["negative"],
        image=po,
        mask_image=repaint,
        control_image=edges(po),
        controlnet_conditioning_scale=spec["control"],
        width=GEN_SIZE[0],
        height=GEN_SIZE[1],
        strength=spec["strength"],
        num_inference_steps=STEPS,
        guidance_scale=GUIDANCE,
        generator=noise(seed),
    ).images[0]
    # Модель перекодирует весь кадр, и вне маски пиксели чуть плывут. Возвращаем «po»
    return with_region(Image.composite(dirty, po, soft), soft)


def along_circles(seeds: np.ndarray, tx: np.ndarray, ty: np.ndarray, length: int) -> np.ndarray:
    """Каждая точка-затравка размазана вдоль поля (tx, ty) в обе стороны и к концам
    гаснет: из точки выходит дуга."""
    height, width = seeds.shape
    ys, xs = np.mgrid[0:height, 0:width].astype(np.float32)
    trace = seeds.copy()
    for sign in (1, -1):
        px, py = xs.copy(), ys.copy()
        for step in range(length):
            vx = cv2.remap(tx, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            vy = cv2.remap(ty, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            px += sign * vx
            py += sign * vy
            fade = 1 - step / length
            trace += cv2.remap(seeds, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT) * fade
    return trace / length


def paint_swirls(po: Image.Image, spec: dict, seed: int) -> Image.Image:
    """Тот же лак до полировки: голограммы вокруг отражений ламп, матовость, дымка,
    длинные царапины и следы капель. Только по маске — фон остаётся пикселями «po»."""
    rng = np.random.default_rng(seed)
    rgb = np.asarray(po, np.float32) / 255
    height, width = rgb.shape[:2]
    if spec["mask"] == "full":
        car = np.ones((height, width), np.float32)
    else:
        car = cv2.GaussianBlur(subject_mask(po), (0, 0), 3)

    lo, hi = SWIRL_LIGHT
    light = np.clip((rgb @ LUMA - lo) / (hi - lo), 0, 1)
    halo = cv2.GaussianBlur(light, (0, 0), SWIRL_HALO)
    # Поле вдоль окружностей вокруг отражений: поперёк направления к ним
    gx = cv2.Sobel(halo, cv2.CV_32F, 1, 0, ksize=5)
    gy = cv2.Sobel(halo, cv2.CV_32F, 0, 1, ksize=5)
    norm = np.sqrt(gx * gx + gy * gy) + 1e-6
    seeds = (rng.random((height, width)) < SWIRL_DENSITY) * rng.random((height, width))
    arcs = along_circles(seeds.astype(np.float32), -gy / norm, gx / norm, SWIRL_LENGTH)
    # Толщина в пару пикселей: на экране телефона кадр втрое меньше, тоньше не видно
    arcs = np.clip(cv2.GaussianBlur(arcs, (0, 0), 0.7) * 7, 0, 1)
    near = halo / (halo.max() + 1e-6)
    # Царапины видны у ламп и не видны в самом отражении: оно и так белое
    swirls = np.clip(near * 3.5, 0, 1) ** 0.7 * (1 - light * 0.8) * arcs
    spread = cv2.GaussianBlur(light, (0, 0), HAZE_SPREAD)
    spread /= spread.max() + 1e-6

    scratches = np.zeros((height, width), np.float32)
    for _ in range(SCRATCHES):
        x, y = rng.uniform(0, width), rng.uniform(0, height)
        angle, size, bend = rng.uniform(0, np.pi), rng.uniform(60, 260), rng.uniform(-0.002, 0.002)
        points = [
            (x + np.cos(angle + bend * t * size) * t * size, y + np.sin(angle + bend * t * size) * t * size)
            for t in np.linspace(-0.5, 0.5, 24)
        ]
        cv2.polylines(scratches, [np.array(points, np.int32)], False, float(rng.uniform(0.3, 0.8)), 1, cv2.LINE_AA)
    spots = np.zeros((height, width), np.float32)
    for _ in range(WATER_SPOTS):
        centre = (int(rng.uniform(0, width)), int(rng.uniform(0, height)))
        radius = int(rng.uniform(3, 9))
        cv2.circle(spots, centre, radius, float(rng.uniform(0.1, 0.25)), 1, cv2.LINE_AA)
        cv2.circle(spots, centre, max(radius - 2, 1), float(rng.uniform(0.03, 0.08)), -1, cv2.LINE_AA)
    spots = cv2.GaussianBlur(spots, (0, 0), 0.8)

    body = car[..., None]
    out = rgb * (1 - 0.7 * body) + cv2.GaussianBlur(rgb, (0, 0), DULL_BLUR) * 0.7 * body
    out = out * (1 - DULL_LIFT * body) + 0.16 * DULL_LIFT * body
    haze = (0.10 * spread + 0.05 * near) * car
    out += haze[..., None] * np.array([0.85, 0.88, 0.95], np.float32)
    shine = swirls * 0.8 + scratches * (0.15 + 0.6 * spread) * 0.6 + spots * (0.25 + 0.6 * spread) * 0.5
    out += (shine * car)[..., None] * np.array([0.95, 0.97, 1.0], np.float32)
    przed = Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8))
    return with_region(przed, Image.fromarray((car > 1e-3).astype(np.uint8) * 255))


def make_przed(
    paint: StableDiffusionXLControlNetInpaintPipeline, po: Image.Image, spec: dict, seed: int
) -> Image.Image:
    """«przed» с прозрачностью вне испорченного места."""
    if spec["kind"] == "swirls":
        return paint_swirls(po, spec, seed)
    return paint_dirt(paint, po, spec, seed)


def to_size(image: Image.Image) -> Image.Image:
    top = (image.height - SIZE[1]) // 2
    return image.crop((0, top, SIZE[0], top + SIZE[1]))


def save(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    # Прозрачность сжимается без потерь: край «przed» ложится на «po» ровно
    image.save(path, "WEBP", quality=QUALITY, method=6)


def photo(path: Path) -> dict:
    """Кадр для файла данных студии: путь от public/ и размер."""
    return {"src": "/" + path.relative_to(PUBLIC).as_posix(), "width": SIZE[0], "height": SIZE[1]}


def sheet(cells: list[tuple[str, list[Image.Image]]], per_row: int, path: Path) -> None:
    """Лист кандидатов: в ячейке «przed» и «po» рядом (или один кадр), под ними сид."""
    count = len(cells[0][1])
    cell_w = THUMB[0] * count + GAP * (count - 1)
    cell_h = THUMB[1] + LABEL
    per_row = min(per_row, len(cells))
    rows = -(-len(cells) // per_row)
    out = Image.new("RGB", (per_row * cell_w + (per_row + 1) * GAP * 2, rows * (cell_h + GAP) + GAP), (5, 5, 7))
    pen = ImageDraw.Draw(out)
    font = ImageFont.load_default(size=24)
    for i, (label, images) in enumerate(cells):
        x = GAP * 2 + (i % per_row) * (cell_w + GAP * 2)
        y = GAP + (i // per_row) * (cell_h + GAP)
        for j, image in enumerate(images):
            # «przed» — уже наложенный на «po»: прозрачность сняли без потери цвета
            out.paste(image.convert("RGB").resize(THUMB, Image.LANCZOS), (x + j * (THUMB[0] + GAP), y))
        pen.text((x, y + THUMB[1] + 8), label, fill=(245, 245, 247), font=font)
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path, quality=90)


def is_number(value, whole: bool = False) -> bool:
    kinds = int if whole else (int, float)
    return isinstance(value, kinds) and not isinstance(value, bool)


def check(frame: dict, name: str) -> Path:
    """Ошибки JSON — до загрузки модели на 7 ГБ, а не после."""
    for key in ("out", "po"):
        if key not in frame:
            raise SystemExit(f"{name}: нет поля {key}")
    out = (PUBLIC / str(frame["out"])).resolve()
    if out == PUBLIC or not out.is_relative_to(PUBLIC):
        raise SystemExit(f"{name}: out {frame['out']!r} — путь внутри public/, иначе сайт не отдаст файлы")
    need = {"po": {"prompt", "negative", "seed"}}
    przed = frame.get("przed")
    if przed is not None:
        if przed.get("kind") not in ("dirt", "swirls"):
            raise SystemExit(f"{name}: przed.kind — \"dirt\" или \"swirls\"")
        if przed.get("mask") not in ("subject", "full"):
            raise SystemExit(f"{name}: przed.mask — \"subject\" или \"full\"")
        need["przed"] = {"seed"}
        if przed["kind"] == "dirt":
            need["przed"] |= {"prompt", "negative"}
            for field in ("strength", "control"):
                value = przed.get(field)
                if not is_number(value) or not 0 < value <= 1:
                    raise SystemExit(f"{name}: przed.{field} — число от 0 до 1")
    boxes = frame["po"].get("erase", [])
    for box in boxes if isinstance(boxes, list) else [None]:
        whole = isinstance(box, list) and len(box) == 4 and all(is_number(v, whole=True) for v in box)
        if not whole or not (0 <= box[0] < box[2] <= SIZE[0] and 0 <= box[1] < box[3] <= SIZE[1]):
            raise SystemExit(f"{name}: po.erase — список [left, top, right, bottom] внутри кадра {SIZE[0]}×{SIZE[1]}")
    for part, fields in need.items():
        missing = fields - frame[part].keys()
        if missing:
            raise SystemExit(f"{name}: в {part} нет {', '.join(sorted(missing))}")
        if not is_number(frame[part]["seed"], whole=True):
            raise SystemExit(f"{name}: {part}.seed — целое число")
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("frame", type=Path, help="JSON с параметрами кадра")
    parser.add_argument("--candidates", type=int, help="сколько сидов показать на листе выбора")
    parser.add_argument("--vary", choices=["po", "przed"], help="какой сид перебирать, по умолчанию po")
    parser.add_argument("--preview", type=Path, help="папка для листа кандидатов и их кадров")
    args = parser.parse_args()

    frame = json.loads(args.frame.read_text(encoding="utf-8"))
    name = args.frame.stem
    out = check(frame, name)
    przed = frame.get("przed")
    vary = args.vary or "po"
    if args.candidates is not None:
        if args.candidates < 1 or args.preview is None:
            raise SystemExit("--candidates N — от одного, и с --preview: лист кладётся туда")
        if vary == "przed" and przed is None:
            raise SystemExit(f"{name}: --vary przed, а przed в JSON нет")
    elif args.preview is not None or args.vary is not None:
        # Без --candidates скрипт пишет рабочие файлы в public/, а не лист выбора
        raise SystemExit("--preview и --vary — только с --candidates")

    draw, paint = load()

    if args.candidates is None:
        po = draw_po(draw, frame["po"], frame["po"]["seed"])
        if przed is None:
            save(to_size(po), out.with_suffix(".webp"))
            print(json.dumps(photo(out.with_suffix(".webp")), indent=2))
            return
        dirty = make_przed(paint, po, przed, przed["seed"])
        save(to_size(po), out / "po.webp")
        save(to_size(dirty), out / "przed.webp")
        print(json.dumps({"przed": photo(out / "przed.webp"), "po": photo(out / "po.webp")}, indent=2))
        return

    cells = []
    po = None
    for i in range(args.candidates):
        po_seed = frame["po"]["seed"] + (i if vary == "po" else 0)
        if po is None or vary == "po":
            po = draw_po(draw, frame["po"], po_seed)
        images = [po]
        label = f"po {po_seed}"
        if przed is not None:
            przed_seed = przed["seed"] + (i if vary == "przed" else 0)
            images.insert(0, make_przed(paint, po, przed, przed_seed))
            label += f", przed {przed_seed}"
        images = [to_size(image) for image in images]
        for image, part in zip(images, ["przed", "po"] if przed is not None else ["po"]):
            save(image, args.preview / name / f"{label.replace(', ', '_').replace(' ', '-')}-{part}.webp")
        cells.append((label, images))
        # Лист пишется после каждого кандидата: первые видны, пока считаются остальные
        sheet(cells, PAIRS_PER_ROW if przed is not None else SINGLES_PER_ROW, args.preview / f"{name}.jpg")
        print(f"{name}: {label}", file=sys.stderr)


if __name__ == "__main__":
    main()
