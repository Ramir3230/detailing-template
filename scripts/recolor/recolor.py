"""Перекраска фиолетовых акцентов кадров шаблона в цвет студии.

Машина hero и кадры до/после сняты под фиолетовую тему Afterdark: бампер M3, подсветка
салона, неон в кадре. У студии с другим акцентом они спорили бы с темой. Скрипт меняет
только пиксели, где цвет фиолетовый и заметный, с мягким краем маски: оттенок — сдвигом
к акценту студии, насыщенность и яркость — в отношении акцента к фиолетовому. Геометрия
не меняется, поэтому слой фар и карта глубины машины совпадают с перекрашенной.

    python scripts/recolor/recolor.py --accent "#ff6a3d" --out demos/<студия>/public --sheet demos/<студия>/source/recolor.png

Без путей смотрит все .webp в public/hero и public/przed-po; кадр до/после тянет за собой
вторую половину своей пары. Кадр, где фиолетового меньше порога, не трогает. Перекрашенный
файл ложится в --out по тому же пути, что в public/, и встаёт поверх исходного в копии для
заливки или на время просмотра (npm run demo:use, снять — --reset). Читает public/
шаблона, поэтому при поставленном демо не запускается: там уже его кадры.
Сдвиг оттенка хорош для насыщенных цветов; к золоту, белому или серому фиолетовый не
сдвигается — тогда кадр решается отдельно (README, «Демо»).
"""

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
SCAN = ["hero", "przed-po"]

# Фиолетовый Afterdark (#b14bff): от него считается сдвиг
SOURCE = "#b14bff"
# Полная сила маски — до 22° от оттенка источника, дальше спадает до нуля к 45°
HUE_FULL, HUE_ZERO = 22 / 360, 45 / 360
# Серое и почти чёрное не красим. Мера — цветность, разница самого яркого и самого тёмного
# канала: у тёмной тени фиолетового бампера она заметна, а у почти чёрного пикселя, где
# насыщенность — шум сжатия, близка к нулю. От 0,04 (полная — от 0,1)
CHROMA_ZERO, CHROMA_FULL = 0.04, 0.1
# Доля фиолетового, ниже которой кадр не трогаем
THRESHOLD = 0.003


def hex_rgb(value: str) -> np.ndarray:
    value = value.lstrip("#")
    return np.array([int(value[i : i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float32)


def rgb_to_hsv(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    safe = np.where(d > 1e-6, d, 1)
    h = np.where(mx == r, ((g - b) / safe) % 6, np.where(mx == g, (b - r) / safe + 2, (r - g) / safe + 4)) / 6
    h = np.where(d > 1e-6, h, 0)
    s = np.where(mx > 0, d / np.where(mx > 0, mx, 1), 0)
    return h, s, mx


def hsv_to_rgb(h: np.ndarray, s: np.ndarray, v: np.ndarray) -> np.ndarray:
    i = np.floor(h * 6).astype(np.int32) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    choices = [(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]
    out = np.zeros(h.shape + (3,), dtype=np.float32)
    for k, (r, g, b) in enumerate(choices):
        m = i == k
        out[m] = np.stack([r[m], g[m], b[m]], -1)
    return out


def recolor(image: Image.Image, accent: str) -> tuple[Image.Image, float]:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.float32) / 255
    rgb, alpha = rgba[..., :3], rgba[..., 3]
    h, s, v = rgb_to_hsv(rgb)
    sh, ss, sv = (x.item() for x in rgb_to_hsv(hex_rgb(SOURCE)[None]))
    th, ts, tv = (x.item() for x in rgb_to_hsv(hex_rgb(accent)[None]))

    dh = np.abs(h - sh)
    dh = np.minimum(dh, 1 - dh)
    weight = (
        np.clip((HUE_ZERO - dh) / (HUE_ZERO - HUE_FULL), 0, 1)
        * np.clip((s * v - CHROMA_ZERO) / (CHROMA_FULL - CHROMA_ZERO), 0, 1)
    )
    visible = alpha > 0.05
    share = float(weight[visible].mean()) if visible.any() else 0.0

    # Оттенок — сдвигом, насыщенность и яркость — в отношении акцентов, с пределом
    shifted = hsv_to_rgb(
        (h + th - sh) % 1,
        np.clip(s * np.clip(ts / ss, 0.5, 2), 0, 1),
        np.clip(v * np.clip(tv / sv, 0.5, 2), 0, 1),
    )
    out = rgb + (shifted - rgb) * weight[..., None]
    result = np.concatenate([out, alpha[..., None]], -1)
    return Image.fromarray((np.clip(result, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA"), share


def sheet(pairs: list[tuple[Image.Image, Image.Image]], path: Path) -> None:
    """Лист «было / стало» для взгляда владельца: пары рядом, кадр шириной 360."""
    width, gap = 360, 12
    rows = []
    for before, after in pairs:
        height = round(before.height * width / before.width)
        row = Image.new("RGB", (2 * width + gap, height), (5, 5, 7))
        for x, frame in ((0, before), (width + gap, after)):
            thumb = frame.convert("RGBA").resize((width, height), Image.LANCZOS)
            row.paste(thumb, (x, 0), thumb)
        rows.append(row)
    total = Image.new("RGB", (2 * width + gap, sum(r.height for r in rows) + gap * (len(rows) - 1)), (5, 5, 7))
    y = 0
    for row in rows:
        total.paste(row, (0, y))
        y += row.height + gap
    path.parent.mkdir(parents=True, exist_ok=True)
    total.save(path)


def main() -> None:
    # Консоль Windows по умолчанию не в UTF-8: и вывод, и ошибки — по-русски
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("paths", nargs="*", type=Path, help="кадры из public/; без них — public/hero и public/przed-po")
    parser.add_argument("--accent", required=True, help="акцент студии, #rrggbb")
    parser.add_argument("--out", required=True, type=Path, help="папка public/ демо: demos/<студия>/public")
    parser.add_argument("--sheet", type=Path, help="лист «было / стало», .png")
    args = parser.parse_args()
    if (ROOT / ".demo-active").exists():
        raise SystemExit("стоит демо — в public/ его кадры, а не шаблона: npm run demo:use -- --reset")

    # Пара до/после — одна папка: перекрашена одна половина — на шторке они разойдутся.
    # Поэтому кадр пары тянет за собой всю папку, а решение — по большей доле в паре
    def with_pair(file: Path) -> list[Path]:
        in_pairs = file.relative_to(PUBLIC).parts[0] == "przed-po"
        return sorted(file.parent.glob("*.webp")) if in_pairs else [file]

    chosen = [p.resolve() for p in args.paths] or [f for d in SCAN for f in (PUBLIC / d).rglob("*.webp")]
    files = sorted({pair for file in chosen for pair in with_pair(file)})
    results = {}
    for file in files:
        with Image.open(file) as source:
            source.load()
            results[file] = (source, *recolor(source, args.accent))

    def share_of(file: Path) -> float:
        if file.relative_to(PUBLIC).parts[0] != "przed-po":
            return results[file][2]
        return max(results[f][2] for f in results if f.parent == file.parent)

    pairs = []
    for file, (source, result, share) in results.items():
        relative = file.relative_to(PUBLIC)
        if share_of(file) < THRESHOLD:
            print(f"  {relative.as_posix()}: фиолетового {share:.2%} — не трогаю")
            continue
        target = args.out / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        # Как сохраняют scripts/hero-car и scripts/before-after; прозрачность — только где была
        result.convert(source.mode if source.mode in ("RGB", "RGBA") else "RGB").save(target, "WEBP", quality=90, method=6)
        print(f"  {relative.as_posix()}: фиолетового {share:.2%} → {target.as_posix()}")
        pairs.append((source, result))
    if args.sheet and pairs:
        sheet(pairs, args.sheet)
        print(f"лист: {args.sheet.as_posix()}")


if __name__ == "__main__":
    main()
