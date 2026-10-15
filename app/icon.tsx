import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { ImageResponse } from "next/og";
import { studio } from "@/content/studio";

/* Иконка вкладки из данных студии: её знак, а пока знака нет — первая буква логотипа. */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/* Знак вписан в 28 px: по 2 px поля, чтобы края не резало скругление вкладки */
const BOX = 28;

export default function Icon() {
  const mark = studio.logoMark;
  // Синхронно: асинхронное чтение файла Next с Cache Components не пререндерит, и иконка
  // рисовалась бы на каждый запрос. Путь — из public/logo/ (тест данных): с переменной
  // частью шире сборка утянула бы в серверные функции весь public/
  const svg = mark && readFileSync(join(process.cwd(), "public", "logo", basename(mark.src)), "base64");
  const scale = mark ? BOX / Math.max(mark.width, mark.height) : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: studio.theme.bg,
          color: studio.theme.accent,
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        {mark && svg ? (
          <img
            src={`data:image/svg+xml;base64,${svg}`}
            width={Math.round(mark.width * scale)}
            height={Math.round(mark.height * scale)}
            alt=""
          />
        ) : (
          studio.logo.charAt(0).toUpperCase()
        )}
      </div>
    ),
    size,
  );
}
