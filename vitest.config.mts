import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/*
 * Два прогона: unit — до сборки, built — по страницам, которые собрала `next build`
 * (checks/). Порядок задаёт `npm run check`. built подключается только из своего
 * скрипта `npm run test:built`: голый `vitest` или расширение редактора иначе проверили
 * бы старую сборку, лежащую в .next, и показали бы зелёное по устаревшим страницам.
 */
const builtRun = process.env.npm_lifecycle_event === "test:built";

export default defineConfig({
  resolve: {
    // тот же `@/…`, что в tsconfig.json
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["**/*.test.ts"],
          exclude: ["node_modules/**", ".next/**", "checks/**", "demos/**"],
        },
      },
      ...(builtRun
        ? [{ extends: true, test: { name: "built", include: ["checks/**/*.test.ts"] } }]
        : []),
    ],
  },
});
