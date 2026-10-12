/*
 * Заготовка демо: demos/<студия>/ с файлом данных из scripts/demo/studio-template.ts.
 *
 *   npm run demo:new -- <студия>
 *
 * <студия> — латиницей через дефис: имя папки, файла данных и проекта Vercel
 * (<студия>-demo). Рядом с данными — public/ (фото демо поверх шаблона: перекраска, вход,
 * карта) и source/ (что прислал владелец: прайс, лого, фото; на сайт не уходит).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const slug = process.argv[2];

if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail("имя студии — латиницей через дефис: npm run demo:new -- auto-spa");
if (slug === "afterdark") fail("afterdark — студия шаблона");
const demos = join(root, "demos");
if (!existsSync(join(demos, ".git"))) fail("нет demos/ со своим git — README, «Демо»");
const dir = join(demos, slug);
if (existsSync(dir)) fail(`demos/${slug} уже есть`);

for (const sub of ["public", "source"]) mkdirSync(join(dir, sub), { recursive: true });
const template = readFileSync(join(root, "scripts", "demo", "studio-template.ts"), "utf-8");
writeFileSync(join(dir, "studio.ts"), template.replaceAll("__SLUG__", slug));
// Пустые папки git не хранит
writeFileSync(join(dir, "public", ".gitkeep"), "");
writeFileSync(join(dir, "source", ".gitkeep"), "");

console.log(`demos/${slug}/studio.ts — заготовка; всё в [скобках] заполнить по скилу demo-studio`);

function fail(message) {
  console.error(`demo:new: ${message}`);
  process.exit(1);
}
