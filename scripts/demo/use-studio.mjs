/*
 * Делает студию из папки активной в копии шаблона: файл данных — в
 * content/studios/<папка>.ts, её фото — поверх public/, строка в content/studio.ts —
 * на неё.
 *
 *   node scripts/demo/use-studio.mjs <папка студии> <корень копии>
 *
 * Папка студии — demos/<студия>/ или checks/demo-fixture/: studio.ts с `export const
 * studio` и, если есть, public/ с файлами по тем же путям, что в шаблоне. Скрипт меняет
 * файлы шаблона в корне, поэтому корень — копия: временная папка demo:deploy или чекаут
 * CI. В рабочей папке шаблона после него — `git checkout content/studio.ts public/` и
 * удалить скопированный файл данных.
 */
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const [dir, root] = process.argv.slice(2);
if (!dir || !root) fail("нужны два пути: папка студии и корень копии шаблона");

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

cpSync(data, join(target, "content", "studios", `${slug}.ts`));
// Служебное (.gitkeep пустой папки) на сайт не идёт
const visible = (path) => !basename(path).startsWith(".");
if (existsSync(join(source, "public"))) {
  cpSync(join(source, "public"), join(target, "public"), { recursive: true, filter: visible });
}
writeFileSync(
  join(target, "content", "studio.ts"),
  `/* Активная студия — ${slug}: её поставил scripts/demo/use-studio.mjs. */\nexport { studio } from "@/content/studios/${slug}";\n`,
);
console.log(`активная студия: ${slug}`);

function fail(message) {
  console.error(`use-studio: ${message}`);
  process.exit(1);
}
