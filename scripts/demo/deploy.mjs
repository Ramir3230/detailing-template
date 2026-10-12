/*
 * Заливка демо в свой проект Vercel: копия шаблона из main, данные и фото студии поверх,
 * `npm run check` — и только зелёное уходит на Vercel.
 *
 *   npm run demo:deploy -- <студия>               превью: сборка по своему адресу, закрытому логином
 *   npm run demo:deploy -- <студия> --open        это превью — на адрес проекта: открыто всем по ссылке
 *   npm run demo:deploy -- <студия> --ref HEAD    собрать не из origin/main (проверка конвейера)
 *
 * Проект — <студия>-demo. Адрес проекта (<студия>-demo.vercel.app) открыт, собственные
 * адреса сборок закрыты логином — защита Vercel по умолчанию. Залитое демо заморожено:
 * правки шаблона его не трогают, пока его не залить заново; новая заливка открытого демо
 * до --open не видна. demos/<студия>/deployed.json — что залито: превью и открытая сборка,
 * у каждой коммит шаблона, адрес и дата, и связь с проектом Vercel.
 *
 * Копия собирается во временной папке без git: Vercel CLI, увидев репозиторий, подключил
 * бы его к проекту демо, и демо пересобиралось бы на каждый пуш шаблона. Копия удаляется
 * при любом исходе — --open ей не нужен.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const { slug, open, ref } = parseArgs(process.argv.slice(2));
const dir = join(root, "demos", slug);
const project = `${slug}-demo`;
const record = join(dir, "deployed.json");
const saved = existsSync(record) ? JSON.parse(readFileSync(record, "utf-8")) : {};

if (!existsSync(join(dir, "studio.ts"))) fail(`нет demos/${slug}/studio.ts — сначала npm run demo:new -- ${slug}`);

if (open) await promote();
else preview();

function preview() {
  if (ref === "origin/main") run("git", ["fetch", "-q", "origin", "main"]);
  const commit = run("git", ["rev-parse", "--verify", `${ref}^{commit}`]).trim();
  // Имя папки — имя проекта: по нему Vercel CLI заводит проект при первой заливке
  const temp = mkdtempSync(join(tmpdir(), "detailing-demo-"));
  // Копия с node_modules и .next — после себя при любом исходе, и при красном check тоже
  process.on("exit", () => cleanup(temp));
  const work = join(temp, project);
  step(`шаблон ${ref} (${commit.slice(0, 7)}) → ${work}`);

  run("git", ["worktree", "prune"]);
  run("git", ["worktree", "add", "--detach", "-q", work, commit]);
  // Копия без git: отвязываем и забываем рабочее дерево
  rmSync(join(work, ".git"), { force: true });
  run("git", ["worktree", "prune"]);

  run("node", [join(work, "scripts", "demo", "use-studio.mjs"), dir, work]);
  // Зависимости и сборку делает Vercel; локальные — только для проверки
  writeFileSync(join(work, ".vercelignore"), "node_modules\n.next\n.demo-active\n");
  // Проект уже есть — связь из записи, а не поиск по имени папки
  if (saved.link) link(work, saved.link);

  step("npm ci");
  run("npm", ["ci", "--no-audit", "--no-fund"], { cwd: work });
  step("npm run check — красное не заливается");
  run("npm", ["run", "check"], { cwd: work });

  step(`vercel deploy → ${project}, сборка без адреса`);
  // Продакшен-сборка, но без адреса проекта: первую заливку нового проекта Vercel ставит на
  // <проект>.vercel.app сама, даже превью, и демо открылось бы раньше, чем его посмотрит
  // владелец. Собственный адрес сборки закрыт логином; --open ставит на неё адрес проекта
  // (vercel promote) — без пересборки, ровно то, что владелец видел
  const output = run("vercel", ["deploy", "--yes", "--prod", "--skip-domain", "--format", "json"], { cwd: work });
  const url = output.match(/https:\/\/[a-z0-9-]+\.vercel\.app/)?.[0] ?? fail("vercel deploy не вернул адрес сборки");
  const target = output.match(/"target":\s*"([a-z]+)"/)?.[1] ?? "";
  const { orgId, projectId } = JSON.parse(readFileSync(join(work, ".vercel", "project.json"), "utf-8"));

  // Открытая сборка остаётся в записи, пока новую не откроют: превью могут и не принять
  save({
    project,
    link: { orgId, projectId },
    preview: { url, target, ref, commit, at: new Date().toISOString() },
    ...(saved.production ? { production: saved.production } : {}),
  });
  console.log(`\nпревью (закрыто логином Vercel): ${url}\nпосле взгляда владельца: npm run demo:deploy -- ${slug} --open`);
}

async function promote() {
  const { preview: built, link: linked } = saved;
  if (!built?.url || !linked) fail(`превью ещё не заливали: npm run demo:deploy -- ${slug}`);
  // promote сборки не из продакшена Vercel делает новой сборкой — её никто не видел
  if (built.target !== "production") fail("превью собрано не продакшен-сборкой — залейте превью заново");

  let url = saved.production?.deployment === built.url ? saved.production.url : "";
  if (url) step(`уже открыто: ${url}`);
  else {
    // Проект — переменными связи Vercel CLI, без папки: в папке шаблона своя связь, с его
    // проектом, а временную на Windows держит фоновый процесс CLI
    const env = { ...process.env, VERCEL_ORG_ID: linked.orgId, VERCEL_PROJECT_ID: linked.projectId };
    step(`vercel promote ${built.url}`);
    run("vercel", ["promote", built.url, "--timeout", "10m"], {
      cwd: tmpdir(),
      env,
      // Повтор после упавшей проверки ниже: та же сборка уже на адресе
      ok: /is already the current production deployment/,
    });
    url = `https://${productionHost(built.url, env)}`;
  }

  // Открыто ли: запрос без логина, и демо закрыто от поиска
  for (const path of ["/", "/kontakt", "/ru"]) {
    const response = await fetch(url + path, { redirect: "manual" });
    const html = await response.text();
    const problem =
      response.status !== 200
        ? `отвечает ${response.status}`
        : /<meta name="robots" content="[^"]*noindex/.test(html)
          ? ""
          : "без noindex";
    if (problem) fail(`${url}${path} ${problem}. Адрес уже стоит на сборке — откатить: Vercel, проект ${project}, Instant Rollback`);
  }
  save({ ...saved, production: { ...built, url, deployment: built.url, at: new Date().toISOString() } });
  console.log(`\nоткрыто: ${url} — 200 без логина, noindex на месте`);
}

/* Связь папки с проектом Vercel — то, что пишет vercel link; секретов в ней нет */
function link(folder, { orgId, projectId }) {
  mkdirSync(join(folder, ".vercel"), { recursive: true });
  writeFileSync(join(folder, ".vercel", "project.json"), JSON.stringify({ orgId, projectId }));
}

/*
 * Адрес, который promote поставил на сборку: <проект>.vercel.app или с хвостом, если имя
 * было занято. Из списка алиасов аккаунта, по страницам: `project ls` и `inspect` отдают
 * его не сразу, а алиасы веток шаблона давно открытое демо отодвигают с первой страницы.
 */
function productionHost(deployment, env) {
  const host = new URL(deployment).host;
  let next = "";
  do {
    const args = ["alias", "ls", "--limit", "100", "--format", "json", ...(next ? ["--next", next] : [])];
    const page = JSON.parse(run("vercel", args, { cwd: tmpdir(), env }));
    const found = (page.aliases ?? [])
      .filter(({ url }) => url === host)
      .map(({ alias }) => alias)
      .sort((a, b) => a.length - b.length)[0];
    if (found) return found;
    next = page.pagination?.next ? String(page.pagination.next) : "";
  } while (next);
  return fail(`на сборке ${deployment} нет адреса проекта — promote не прошёл?`);
}

/*
 * Временная папка — после себя. На Windows фоновый процесс Vercel CLI ещё держит её
 * рабочей папкой пару секунд: повторы, а не удалось — сказать, а не падать после заливки.
 */
function cleanup(folder) {
  try {
    rmSync(folder, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  } catch {
    console.log(`не удалось удалить ${folder} — удалите вручную`);
  }
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
 * Команда с выводом в строку; упала — хвост её вывода и выход, кроме ответа, который
 * подходит под ok. npm и vercel на Windows — .cmd, их запускает только оболочка;
 * аргументы с пробелами — в кавычках.
 */
function run(command, args, { cwd = root, env = process.env, ok } = {}) {
  const shell = process.platform === "win32" && command !== "git" && command !== "node";
  const options = { cwd, env, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 };
  // С оболочкой — одной строкой: массив аргументов Node при shell склеивает сам и предупреждает
  const result = shell
    ? spawnSync([command, ...args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg))].join(" "), { ...options, shell })
    : spawnSync(command, args, options);
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0 && !ok?.test(output)) {
    const tail = output.split("\n").slice(-40).join("\n");
    fail(`${command} ${args.join(" ")} — код ${result.status}\n${tail || result.error?.message || ""}`);
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
