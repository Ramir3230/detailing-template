import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { studio } from "@/content/studio";

/* Иконка вкладки из данных студии: её знак, а пока знака нет — первая буква логотипа. */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/* Знак вписан в 28 px: по 2 px поля, чтобы края не резало скругление вкладки */
const BOX = 28;

export default async function Icon() {
  const mark = studio.logoMark;
  const svg = mark && (await readFile(join(process.cwd(), "public", mark.src), "base64"));
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
          // eslint-disable-next-line @next/next/no-img-element -- картинка внутри ImageResponse, не страницы
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
