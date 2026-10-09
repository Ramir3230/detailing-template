# Шаблон сайта детейлинг-студии

Шаблон сайта для детейлинг-студий в Польше уровня пакета Standard. На нём собираются
сайты клиентов и персональные демо: под новую студию меняются данные и тема, а не код.
Польский основной, русский вторым языком.

Стек: Next.js 16 (App Router), Tailwind 4, TypeScript. Деплой на Vercel по пушу в
`main`.

## Документы

Читать до кода — они пишутся первыми и решают спорные вопросы:

- [BRIEF.md](BRIEF.md) — что за продукт, для кого, страницы, чего сознательно не делаем.
- [DESIGN.md](DESIGN.md) — визуальные решения с причинами: база, темы, палитра, шрифты.
- [ROADMAP.md](ROADMAP.md) — что сделано и что дальше.
- [CLAUDE.md](CLAUDE.md) — правила для тех, кто пишет код.

## Запуск

```bash
npm install
npm run dev     # http://localhost:3000
npm run check   # типы, линт, тесты, сборка и проверки собранных страниц — то же в CI
npm run build   # только сборка
```

## Машина hero

Вырезка машины и слой фар готовятся один раз на кадр, в `public/hero/<кадр>/`. Нужен Python
3.10+ с пакетами из `scripts/hero-car/requirements.txt`; модель BiRefNet (~1 ГБ)
скачивается при первом запуске.

```bash
pip install -r scripts/hero-car/requirements.txt
python scripts/hero-car/cutout.py scripts/hero-car/m3.json --source "<исходник>" --preview <папка>
```

Скрипт печатает поле `hero.car` для файла данных студии: размеры и центры фар.

## Кадры до/после

Пары до/после и фото входа выдуманной студии рисует нейросеть на видеокарте (6 ГБ хватает),
в `public/przed-po/` и `public/kontakt/`. Параметры кадра — JSON в `scripts/before-after/`,
окружение — в `requirements.txt` рядом (там же команды установки); модели (~7 ГБ)
скачиваются при первом запуске.

```bash
~/.cache/sd/venv/Scripts/python scripts/before-after/generate.py scripts/before-after/mycie.json --candidates 4 --preview <папка>
~/.cache/sd/venv/Scripts/python scripts/before-after/generate.py scripts/before-after/mycie.json
```

Первая команда кладёт лист кандидатов для выбора, вторая — кадры по сидам из JSON и
печатает пути и размеры для файла данных студии.

## Карта страницы Kontakt

Карта рисуется один раз на студию, в `public/mapa/`: точка и масштаб — JSON в
`scripts/map/`. Цвета темы в файле нет — его красит страница, поэтому при смене темы
карту не перерисовывают; при смене адреса — да.

```bash
pip install -r scripts/map/requirements.txt
python -m playwright install chromium
python scripts/map/render.py scripts/map/afterdark.json --preview <папка>
```

Скрипт печатает поле `address.map` для файла данных студии.
