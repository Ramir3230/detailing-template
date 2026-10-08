import { ImageResponse } from "next/og";
import { studio } from "@/content/studio";

/* Иконка вкладки из данных студии, пока у неё нет своего знака: первая буква логотипа. */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
        {studio.logo.charAt(0).toUpperCase()}
      </div>
    ),
    size,
  );
}
