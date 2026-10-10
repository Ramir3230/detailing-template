"""Заглушка пары до/после, пока у студии нет фото: тёмный кадр 1040×1300 с контуром диска
или мотора, без текста — строки интерфейса берутся только из словаря. «przed» и «po» —
один и тот же кадр: по одинаковым файлам тест данных не выпустит заглушку на открытый для
поиска сайт. Цвета — из темы студии: снизу bg, вверху и контур — muted поверх bg.

    python scripts/before-after/placeholder.py przed-po/felgi --icon wheel --bg "#050507" --muted "#8a8a96"

Файлы шаблона общие для всех демо: для своей студии — out вида «przed-po/<студия>/<пара>»,
существующие не перезаписывать. Нужен только Pillow (есть в requirements.txt рядом). Фото
владельца ложатся поверх этих файлов; в данных студии меняются подписи alt и флаг ai.
"""

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw

PUBLIC = Path(__file__).resolve().parents[2] / "public"
W, H = 1040, 1300
SCALE = 2  # рисуем вдвое крупнее и уменьшаем: сглаженные края

# Контур мотора на сетке 24×24
ENGINE = [
    (7, 4), (7, 6), (10, 6), (10, 8), (7, 8), (5, 10), (5, 13), (3, 13), (3, 10), (1, 10),
    (1, 18), (3, 18), (3, 15), (5, 15), (5, 18), (8, 18), (10, 20), (18, 20), (18, 16),
    (20, 16), (20, 19), (23, 19), (23, 9), (20, 9), (20, 12), (18, 12), (18, 8), (12, 8),
    (12, 6), (15, 6), (15, 4),
]


def rgb(color: str) -> tuple[int, int, int]:
    value = color.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def mix(a, b, k: float) -> tuple[int, int, int]:
    return tuple(round(x + (y - x) * k) for x, y in zip(a, b))


def wheel(draw, cx, cy, r, width, color):
    def circle(radius):
        draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=color, width=width)

    for k in (1, 0.72, 0.16):
        circle(r * k)
    for i in range(5):
        a = -math.pi / 2 + i * 2 * math.pi / 5
        start = (cx + math.cos(a) * r * 0.16, cy + math.sin(a) * r * 0.16)
        end = (cx + math.cos(a) * r * 0.72, cy + math.sin(a) * r * 0.72)
        draw.line([start, end], fill=color, width=width)


def engine(draw, cx, cy, size, width, color):
    k = size / 22
    points = [(cx + (x - 12) * k, cy + (y - 12) * k) for x, y in ENGINE]
    draw.line(points + points[:2], fill=color, width=width, joint="curve")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("out", help="папка пары внутри public/: przed-po/<пара>")
    parser.add_argument("--icon", choices=["wheel", "engine"], required=True)
    parser.add_argument("--bg", required=True, help="bg темы студии, #rrggbb")
    parser.add_argument("--muted", required=True, help="muted темы студии, #rrggbb")
    args = parser.parse_args()

    bg, muted = rgb(args.bg), rgb(args.muted)
    top, line = mix(bg, muted, 0.08), mix(bg, muted, 0.35)

    im = Image.new("RGB", (W * SCALE, H * SCALE))
    draw = ImageDraw.Draw(im)
    for y in range(H * SCALE):
        draw.line([(0, y), (W * SCALE, y)], fill=mix(top, bg, y / (H * SCALE - 1)))
    cx, cy, width = W * SCALE / 2, H * SCALE / 2, 6 * SCALE
    if args.icon == "wheel":
        wheel(draw, cx, cy, 220 * SCALE, width, line)
    else:
        engine(draw, cx, cy, 440 * SCALE, width, line)
    frame = im.resize((W, H), Image.LANCZOS)

    folder = PUBLIC / args.out
    folder.mkdir(parents=True, exist_ok=True)
    for name in ("przed", "po"):
        path = folder / f"{name}.webp"
        frame.save(path, "WEBP", quality=90, method=6)
        print(path.relative_to(PUBLIC).as_posix(), f"{W}x{H}")


if __name__ == "__main__":
    main()
