/*
 * Делает студию из папки активной в шаблоне: файл данных — в content/studios/<папка>.ts,
 * её фото — поверх public/, строка в content/studio.ts — на неё.
 *
 *   npm run demo:use -- demos/<студия>     посмотреть демо локально: check:data, dev
 *   npm run demo:use -- --reset            вернуть шаблон к Afterdark
 *   node scripts/demo/use-studio.mjs <папка студии> <корень копии>   копия demo:deploy, CI
 *
 * Папка студии — demos/<студия>/ или checks/demo-fixture/: studio.ts с `export const
 * studio` и, если есть, public/ с файлами по тем же путям, что в шаблоне. Что заменено и
 * что добавлено, записывается в .demo-active/ корня, заменённое — туда же копией: --reset
 * возвращает ровно это и не трогает остального, в том числе незакоммиченных правок. Пока
 * демо стоит, второе не ставится; коммитить шаблон с поставленным демо нельзя.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

const [first, second] = process.argv.slice(2);
if (first === "--reset") reset(resolve(second ?? "."));
else activate(first, second ?? ".");

function activate(dir, root) {
  if (!dir) fail("нужна папка студии: npm run demo:use -- demos/<студия>");
  const source = resolve(dir);
  const target = resolve(root);
  const slug = basename(source);
  // Имя папки — имя файла данных и проекта Vercel: только то, что годится обоим
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(`имя папки «${slug}» — только a–z, 0–9 и дефисы`);
  if (slug === "afterdark") fail("afterdark — студия шаблона, её файл не перезаписываем");

  const data = join(source, "studio.ts");
  if (!existsSync(data)) fail(`нет ${data}`);
  if (!/export const studio\b/.test(readFileSync(data, "utf-8"))) fail(`${data}: нет export const studio`);
  if (!existsSync(join(target, "content", "studio.ts"))) fail(`${target} — не корень шаблона`);
  const state = join(target, ".demo-active");
  if (existsSync(state)) fail(`уже стоит демо ${readManifest(state).slug} — сначала npm run demo:use -- --reset`);

  // Что ляжет в шаблон: путь от корня → откуда
  const files = new Map([
    [join("content", "studios", `${slug}.ts`), data],
    [join("content", "studio.ts"), null],
  ]);
  const photos = join(source, "public");
  if (existsSync(photos)) {
    for (const file of walk(photos)) files.set(join("public", relative(photos, file)), file);
  }

  const manifest = { slug, created: [], replaced: [] };
  for (const [path, from] of files) {
    const to = join(target, path);
    if (existsSync(to)) {
      // Копия заменённого — с .bak: tsc и eslint берут **/*.ts, копии им не нужны
      const backup = join(state, "backup", `${path}.bak`);
      mkdirSync(dirname(backup), { recursive: true });
      cpSync(to, backup);
      manifest.replaced.push(path);
    } else manifest.created.push(path);
    mkdirSync(dirname(to), { recursive: true });
    if (from) cpSync(from, to);
  }
  writeFileSync(
    join(target, "content", "studio.ts"),
    `/* Активная студия — ${slug}: её поставил scripts/demo/use-studio.mjs, вернуть — --reset. */\nexport { studio } from "@/content/studios/${slug}";\n`,
  );
  mkdirSync(state, { recursive: true });
  writeFileSync(join(state, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`активная студия: ${slug}`);
}

function reset(root) {
  const state = join(root, ".demo-active");
  if (!existsSync(state)) return console.log("демо не стоит — шаблон как есть");
  const { slug, created, replaced } = readManifest(state);
  for (const path of replaced) cpSync(join(state, "backup", `${path}.bak`), join(root, path));
  for (const path of created) rmSync(join(root, path), { force: true });
  rmSync(state, { recursive: true, force: true });
  console.log(`демо ${slug} снято: возвращено ${replaced.length}, убрано ${created.length}`);
}

function readManifest(state) {
  return JSON.parse(readFileSync(join(state, "manifest.json"), "utf-8"));
}

/* Файлы папки вглубь; служебное (.gitkeep пустой папки) на сайт не идёт */
function* walk(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const path = join(folder, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

function fail(message) {
  console.error(`use-studio: ${message}`);
  process.exit(1);
}
