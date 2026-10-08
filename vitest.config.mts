import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/*
 * Два прогона: unit — до сборки, built — по страницам, которые собрала `next build`
 * (checks/). Порядок задаёт `npm run check`.
 */
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
          exclude: ["node_modules/**", ".next/**", "checks/**"],
        },
      },
      {
        extends: true,
        test: { name: "built", include: ["checks/**/*.test.ts"] },
      },
    ],
  },
});
