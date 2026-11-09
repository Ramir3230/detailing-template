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

## Демо

Персональное демо для питча — главная и Kontakt реальной студии: её услуги, цены,
контакты, часы, рейтинг и отзывы, тема в её цвет. Страниц групп и O nas в демо нет. Как
собрать — по шагам в скиле Claude `.claude/skills/demo-studio`, решения — ROADMAP,
«11. Демо под студию».

Данные демо живут в `demos/<студия>/` внутри этой папки, но не в git шаблона: у `demos/`
своя история и приватный репозиторий `Ramir3230/detailing-demos`. Клонировать его в
`demos/` рядом с кодом шаблона.

```bash
npm run demo:new -- <студия>            # заготовка demos/<студия>: всё студийное в [скобках]
npm run demo:use -- demos/<студия>      # поставить демо в шаблон локально: check:data, dev
npm run demo:use -- --reset             # вернуть шаблон к Afterdark — до коммитов шаблона
npm run demo:deploy -- <студия>         # main + данные, npm run check, сборка без открытого адреса
npm run demo:deploy -- <студия> --open  # та же сборка — на <студия>-demo.vercel.app
```

Залитое демо — замороженная сборка в своём проекте Vercel `<студия>-demo`: правки
шаблона его не трогают, пока его не залить заново. Собственный адрес сборки закрыт
логином Vercel — его смотрит владелец; `--open` ставит её на адрес проекта, открытый
всем. Что залито, с каким коммитом шаблона, — `demos/<студия>/deployed.json`.

Фиолетовые акценты кадров шаблона перекрашиваются в цвет студии (сейчас фиолетовое — только
машина hero); перекрашенное ложится в `public/` демо и встаёт поверх шаблона в копии для
заливки или на время просмотра (`npm run demo:use`, снять — `--reset`):

```bash
pip install -r scripts/recolor/requirements.txt
python scripts/recolor/recolor.py --accent "#rrggbb" --out demos/<студия>/public --sheet demos/<студия>/source/recolor.png
```

Фото входа и карта демо — те же скрипты, что выше, с `--public demos/<студия>/public`: файлы
ложатся в папку демо, а не в `public/` шаблона.
