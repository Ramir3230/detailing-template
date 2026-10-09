"""Глубина кадра машины от Depth Anything 3 (DA3MONO-LARGE) — помощник cutout.py.

У DA3 свои зависимости: PyTorch и numpy<2 сломали бы окружение вырезки (rembg, numpy 2).
Поэтому скрипт живёт в отдельном окружении, и cutout.py запускает его сам:

    <python окружения DA3> scripts/hero-car/depth_da3.py crop.png depth.npy

Окружение (один раз, вне репозитория; RTX 2060 и драйвер 546 — CUDA 12.1):

    python -m venv ~/.cache/da3/venv
    pip install torch==2.5.1 torchvision==0.20.1 --index-url https://download.pytorch.org/whl/cu121
    pip install "numpy<2" einops huggingface_hub safetensors omegaconf addict opencv-python \\
        imageio tqdm trimesh pycolmap evo "moviepy==1.0.3" plyfile pillow matplotlib
    git clone https://github.com/ByteDance-Seed/depth-anything-3 (коммит 3d835ec)
    pip install -e depth-anything-3 --no-deps

Пишет float32 в размере crop: расстояние до камеры, больше — дальше (в отличие от
Depth Anything V2, которая даёт обратную величину). Лицензия модели и кода — Apache 2.0;
DA3-LARGE и DA3-GIANT — CC BY-NC, для сайтов клиентов не годятся.
"""

import sys

import numpy as np
import torch
from depth_anything_3.api import DepthAnything3
from PIL import Image

MODEL = "depth-anything/DA3MONO-LARGE"
# Ревизия закреплена: коммит неизменен, вместе с ним неизменны и веса
REVISION = "f465978e618db8cc79c83b8bbf24964857db1875"
# Длинная сторона входа модели, кратна 14
PROCESS_RES = 1008


def main() -> None:
    source, out = sys.argv[1:3]
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = DepthAnything3.from_pretrained(MODEL, revision=REVISION).to(device).eval()
    image = Image.open(source).convert("RGB")
    with torch.inference_mode():
        prediction = model.inference([np.asarray(image)], process_res=PROCESS_RES)
    depth = np.asarray(prediction.depth[0], dtype=np.float32)
    # Вход только масштабируется, без обрезки: карта ложится на crop растяжением
    depth = np.asarray(Image.fromarray(depth, "F").resize(image.size, Image.BICUBIC))
    np.save(out, depth)


if __name__ == "__main__":
    main()
