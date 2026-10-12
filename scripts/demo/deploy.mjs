/*
 * Заливка демо в свой проект Vercel: копия шаблона из main, данные и фото студии поверх,
 * `npm run check` — и только зелёное уходит на Vercel.
 *
 *   npm run demo:deploy -- <студия>               превью: закрыто логином Vercel, смотрит владелец
 *   npm run demo:deploy -- <студия> --open        это превью — в продакшен: открыто всем по ссылке
 *   npm run demo:deploy -- <студия> --ref HEAD    собрать не из origin/main (проверка конвейера)
 *
 * Проект — <студия>-demo, его продакшен-адрес открыт, превью закрыты (защита Vercel по
 * умолчанию). Залитое демо заморожено: правки шаблона его не трогают, пока его не залить
 * заново. Что залито — demos/<студия>/deployed.json: коммит шаблона, адреса, даты.
 *
 * Копия собирается в папке временных файлов без git: Vercel CLI, увидев репозиторий,
 * подключил бы его к проекту демо, и демо пересобиралось бы на каждый пуш шаблона.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const { slug, open, ref } = parseArgs(process.argv.slice(2));
const dir = join(root, "demos", slug);
const project = `${slug}-demo`;
// Имя папки — имя проекта: по нему Vercel CLI находит проект или заводит новый
const work = join(tmpdir(), "detailing-demos", project);
const record = join(dir, "deployed.json");

if (!existsSync(join(dir, "studio.ts"))) fail(`нет demos/${slug}/studio.ts — сначала npm run demo:new -- ${slug}`);

if (open) await promote();
else await preview();

async function preview() {
  if (ref === "origin/main") run("git", ["fetch", "-q", "origin", "main"]);
  const commit = run("git", ["rev-parse", "--verify", `${ref}^{commit}`]).trim();
  step(`шаблон ${ref} (${commit.slice(0, 7)}) → ${work}`);

  rmSync(work, { recursive: true, force: true });
  run("git", ["worktree", "add", "--detach", "-q", work, commit]);
  // Копия без git: отвязываем и забываем рабочее дерево
  rmSync(join(work, ".git"), { force: true });
  run("git", ["worktree", "prune"]);

  run("node", [join(work, "scripts", "demo", "use-studio.mjs"), dir, work]);
  // Зависимости и сборку собирает Vercel; локальные — только для проверки
  writeFileSync(join(work, ".vercelignore"), "node_modules\n.next\n");

  step("npm ci");
  run("npm", ["ci", "--no-audit", "--no-fund"], { cwd: work });
  step("npm run check — красное не заливается");
  run("npm", ["run", "check"], { cwd: work });

  step(`vercel deploy → ${project}, превью`);
  const url = deploymentUrl(run("vercel", ["deploy", "--yes", "--format", "json"], { cwd: work }));
  save({ project, template: { ref, commit }, preview: { url, at: new Date().toISOString() } });
  console.log(`\nпревью (закрыто логином Vercel): ${url}\nпосле взгляда владельца: npm run demo:deploy -- ${slug} --open`);
}

async function promote() {
  const saved = existsSync(record) ? JSON.parse(readFileSync(record, "utf-8")) : null;
  if (!saved?.preview?.url) fail("превью ещё не заливали: npm run demo:deploy -- " + slug);
  if (!existsSync(join(work, ".vercel"))) fail(`нет ${work} от заливки превью — залейте превью заново`);

  step(`vercel promote ${saved.preview.url}`);
  run("vercel", ["promote", saved.preview.url, "--yes", "--timeout", "10m"], { cwd: work });
  const url = `https://${productionHost()}`;

  // Открыто ли: запрос без логина, и демо закрыто от поиска
  for (const path of ["/", "/kontakt", "/ru"]) {
    const response = await fetch(url + path, { redirect: "manual" });
    const html = await response.text();
    if (response.status !== 200) fail(`${url}${path} отвечает ${response.status} — не открыто`);
    if (!/<meta name="robots" content="[^"]*noindex/.test(html)) fail(`${url}${path} без noindex`);
  }
  save({ ...saved, production: { url, at: new Date().toISOString() } });
  console.log(`\nоткрыто: ${url} — 200 без логина, noindex на месте`);
}

/* Продакшен-адрес проекта: <проект>.vercel.app или с хвостом, если имя было занято */
function productionHost() {
  const inspect = run("vercel", ["project", "inspect", project, "--format", "json"], { cwd: work });
  const hosts = [...inspect.matchAll(/[a-z0-9-]+\.vercel\.app/g)].map(([host]) => host);
  const host = hosts.find((item) => item.startsWith(project)) ?? hosts[0];
  if (!host) fail(`не нашёл продакшен-адрес проекта ${project}`);
  return host;
}

function deploymentUrl(output) {
  const url = output.match(/https:\/\/[a-z0-9-]+\.vercel\.app/)?.[0];
  if (!url) fail("vercel deploy не вернул адрес превью");
  return url;
}

function save(data) {
  writeFileSync(record, `${JSON.stringify(data, null, 2)}\n`);
}

function parseArgs(args) {
  const options = { slug: "", open: false, ref: "origin/main" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--open") options.open = true;
    else if (args[i] === "--ref") options.ref = args[++i] ?? fail("--ref без значения");
    else if (!options.slug) options.slug = args[i];
    else fail(`лишний аргумент ${args[i]}`);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(options.slug)) fail("npm run demo:deploy -- <студия> [--open] [--ref <ветка>]");
  return options;
}

/*
 * Команда с выводом в строку; упала — хвост её вывода и выход. npm и vercel на Windows —
 * .cmd, их запускает только оболочка; аргументы с пробелами — в кавычках.
 */
function run(command, args, { cwd = root } = {}) {
  const shell = process.platform === "win32" && command !== "git" && command !== "node";
  const quoted = shell ? args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg)) : args;
  const result = spawnSync(command, quoted, { cwd, encoding: "utf-8", shell, maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) {
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split("\n").slice(-40).join("\n");
    fail(`${command} ${args.join(" ")} — код ${result.status}\n${output || result.error?.message || ""}`);
  }
  return result.stdout;
}

function step(message) {
  console.log(`— ${message}`);
}

function fail(message) {
  console.error(`demo:deploy: ${message}`);
  process.exit(1);
}
