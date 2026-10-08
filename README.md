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
npm run check   # типы, линт и тесты — то же самое крутится в CI
npm run build
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
