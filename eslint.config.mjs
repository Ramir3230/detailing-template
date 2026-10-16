import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // <img> внутри ImageResponse иконки — не картинка страницы. Правило само освобождает
  // такие файлы, но на Windows узнаёт путь неверно (меняет только первый «\»): директива
  // в файле нужна локально и «лишняя» в CI на Linux — поэтому выключено здесь, для обеих
  {
    files: ["app/icon.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Демо студий: своя папка со своим git, проверяет их `npm run check` при заливке
    "demos/**",
  ]),
]);

export default eslintConfig;
