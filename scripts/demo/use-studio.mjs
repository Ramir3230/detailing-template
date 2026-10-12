/*
 * Делает студию из папки активной в шаблоне: файл данных — в content/studios/<папка>.ts,
 * её фото — поверх public/, строка в content/studio.ts — на неё.
 *
 *   npm run demo:use -- demos/<студия>     посмотреть демо локально: check:data, dev
 *   npm run demo:use -- --reset            вернуть шаблон к Afterdark
 *   npm run demo:use -- --reset --force    вернуть, даже если копия данных в шаблоне правлена
 *   node scripts/demo/use-studio.mjs <папка студии> <корень копии>   копия demo:deploy, CI
 *
 * Папка студии — demos/<студия>/ или checks/demo-fixture/: studio.ts с `export const
 * studio` и, если есть, public/ с файлами по тем же путям, что в шаблоне. Что заменено и
 * что добавлено, записывается в .demo-active/ корня, заменённое — туда же копией: --reset
 * возвращает ровно это и не трогает остального, в том числе незакоммиченных правок. Пока
 * демо стоит, второе не ставится, а шаблон не коммитится — тест данных требует Afterdark.
 *
 * Править демо — в demos/<студия>/, не в копии в шаблоне: --reset её удалит и потому
 * откажет, если копию правили после постановки.
 */
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const [first, second] = args.filter((arg) => !arg.startsWith("--"));
if (flags.has("--reset")) reset(resolve(first ?? "."), flags.has("--force"));
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
  if (existsSync(join(state, "manifest.json"))) {
    fail(`уже стоит демо ${readManifest(state).slug} — сначала npm run demo:use -- --reset`);
  }
  // Без manifest — прошлая постановка упала до копирования: шаблон не тронут
  rmSync(state, { recursive: true, force: true });

  // Что ляжет в шаблон: путь от корня → откуда (content/studio.ts пишется ниже)
  const files = [[join("content", "studios", `${slug}.ts`), data], [join("content", "studio.ts"), null]];
  const photos = join(source, "public");
  if (existsSync(photos)) {
    for (const file of walk(photos)) files.push([join("public", relative(photos, file)), file]);
  }

  // Первая фаза — план и копии заменяемого; шаблон пока не тронут. Отпечаток того, что
  // ляжет в шаблон: по нему --reset узнаёт, правили ли копию после постановки
  const manifest = { slug, created: [], replaced: [] };
  for (const [path, from] of files) {
    const to = join(target, path);
    const entry = { path, from, hash: from ? digest(from) : null };
    if (existsSync(to)) {
      // Копия заменённого — с .bak: tsc и eslint берут **/*.ts, копии им не нужны
      const backup = join(state, "backup", `${path}.bak`);
      mkdirSync(dirname(backup), { recursive: true });
      cpSync(to, backup);
      manifest.replaced.push(entry);
    } else manifest.created.push(entry);
  }
  mkdirSync(state, { recursive: true });
  writeFileSync(join(state, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  // Вторая фаза — в шаблон
  for (const [path, from] of files) {
    if (!from) continue;
    mkdirSync(dirname(join(target, path)), { recursive: true });
    cpSync(from, join(target, path));
  }
  writeFileSync(
    join(target, "content", "studio.ts"),
    `/* Активная студия — ${slug}: её поставил scripts/demo/use-studio.mjs, вернуть — --reset. */\nexport { studio } from "@/content/studios/${slug}";\n`,
  );
  clearImageCache(target, manifest);
  console.log(`активная студия: ${slug}`);
}

function reset(root, force) {
  // «--reset demos/<студия>» искал бы демо в папке демо и молча отвечал «не стоит»
  if (!existsSync(join(root, "content", "studio.ts"))) fail(`${root} — не корень шаблона: npm run demo:use -- --reset`);
  const state = join(root, ".demo-active");
  if (!existsSync(state)) return console.log("демо не стоит — шаблон как есть");
  if (!existsSync(join(state, "manifest.json"))) {
    rmSync(state, { recursive: true, force: true });
    return console.log("постановка демо упала до копирования — шаблон не тронут");
  }
  const manifest = readManifest(state);
  const { slug, created, replaced } = manifest;

  // Копию в шаблоне правили после постановки — правка пропала бы вместе с ней. Сверка —
  // с отпечатком на момент постановки, не с источником: его правят штатно (скил, шаг 6),
  // а переименованный источник не делает правленую копию ненужной
  const backupOf = (path) => join(state, "backup", `${path}.bak`);
  const edited = [...created, ...replaced].filter(({ path, hash }) => {
    const file = join(root, path);
    if (!hash || !existsSync(file) || digest(file) === hash) return false;
    // Постановка упала до этого файла: в шаблоне ещё его оригинал, не правка
    return !(existsSync(backupOf(path)) && readFileSync(file).equals(readFileSync(backupOf(path))));
  });
  if (edited.length > 0 && !force) {
    const list = edited.map(({ path, from }) => `  ${path} (из ${relative(root, from)})`).join("\n");
    fail(
      `копию в шаблоне правили после постановки:\n${list}\nнужная правка — в папку демо руками, потом --reset --force`,
    );
  }

  for (const { path } of replaced) {
    if (existsSync(backupOf(path))) cpSync(backupOf(path), join(root, path));
  }
  for (const { path } of created) rmSync(join(root, path), { force: true });
  rmSync(state, { recursive: true, force: true });
  clearImageCache(root, manifest);
  console.log(`демо ${slug} снято: возвращено ${replaced.length}, убрано ${created.length}`);
}

/*
 * Кадр, заменённый по тому же пути, оптимизатор Next отдаёт из кэша старым
 * (.claude/gotchas.md): после смены фото кэш картинок — долой, иначе на экране не то.
 */
function clearImageCache(root, { created, replaced }) {
  if (![...created, ...replaced].some(({ path }) => path.startsWith("public"))) return;
  const cache = join(root, ".next", "cache", "images");
  if (!existsSync(cache)) return;
  rmSync(cache, { recursive: true, force: true });
  console.log("кэш картинок Next очищен: кадры по тем же путям сменились");
}

function digest(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
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
