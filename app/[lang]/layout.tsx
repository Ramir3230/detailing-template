import type { Metadata, Viewport } from "next";
import { Manrope, Science_Gothic } from "next/font/google";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { studio } from "@/content/studio";
import { getDictionary } from "@/dictionaries";
import { spectrumStops } from "@/lib/car-volume";
import { isLang, langs, t } from "@/lib/i18n";
import { isPublished, siteUrl } from "@/lib/seo";
import "../globals.css";

/* subsets — что предзагружать. Кириллица подключена в любом случае и по unicode-range
   приходит сама на русских страницах: польским грузить её заранее незачем. */
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

/* У next/font нет метрик Science Gothic для подгонки запасного шрифта: сборка
   предупреждает «Failed to find font override values» — это ожидаемо. */
const scienceGothic = Science_Gothic({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-science-gothic",
  display: "swap",
});

export function generateStaticParams() {
  return langs.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: studio.theme.bg,
  colorScheme: "dark",
};

/* canonical и hreflang у каждой страницы свои (lib/seo.ts, alternates): унаследованный
   отсюда canonical склеил бы страницу с главной. */
export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return {
    metadataBase: siteUrl(),
    title: t(studio.meta.title, lang),
    description: t(studio.meta.description, lang),
    /* Шаблон и демо закрыты от поиска целиком, язык без текстов студии — тоже:
       иначе Google увидит польский контент под /ru/. */
    robots:
      studio.indexed && isPublished(lang) ? undefined : { index: false, follow: studio.indexed },
  };
}

/* Четыре цвета темы студии и её спектр неона, если есть; производные считает app/globals.css. */
const themeVars = {
  "--bg": studio.theme.bg,
  "--fg": studio.theme.fg,
  "--muted": studio.theme.muted,
  "--accent": studio.theme.accent,
  ...(studio.theme.spectrum && { "--spectrum": spectrumStops(studio.theme.spectrum) }),
} as CSSProperties;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <html
      lang={lang}
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${scienceGothic.variable}`}
      style={themeVars}
    >
      <body className="flex min-h-dvh flex-col">
        <Header lang={lang} dict={dict} />
        {children}
        <Footer lang={lang} dict={dict} />
      </body>
    </html>
  );
}
