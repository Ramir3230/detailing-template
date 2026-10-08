import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Contact } from "@/components/home/Contact";
import { FloatingCall } from "@/components/home/FloatingCall";
import { Hero } from "@/components/home/Hero";
import { Prices } from "@/components/home/Prices";
import { Reviews } from "@/components/home/Reviews";
import { VolumeLab } from "@/components/lab/VolumeLab";
import { studio } from "@/content/studio";
import { getDictionary } from "@/dictionaries";
import { telHref } from "@/lib/contact";
import { formatPhone } from "@/lib/format";
import { isLang } from "@/lib/i18n";

/* Служебная: закрыта от поиска при любом флаге студии */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/*
 * Лаборатория объёмной машины (ROADMAP 3b, эксперимент): главная с объёмом в hero и
 * панелью настроек. Главная целиком, а не один hero: на телефоне машину поворачивает
 * прокрутка, ей нужна настоящая высота страницы. Живёт в ветке exp/car-depth и в main
 * не идёт.
 */
export default async function CarLab({ params }: PageProps<"/[lang]/lab/car">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = getDictionary(lang);
  // Карта из данных и её версия от Depth Anything 3 рядом — на время сравнения
  const { depth } = studio.hero.car;
  const maps = depth
    ? [
        { key: "v2", label: "V2", url: depth },
        { key: "da3", label: "DA3", url: depth.replace(/\.webp$/, "-da3.webp") },
      ]
    : [];

  return (
    <main className="flex-1">
      <VolumeLab maps={maps}>
        <Hero lang={lang} dict={dict} volume />
        <Prices lang={lang} dict={dict} />
        <Reviews lang={lang} dict={dict} />
        <Contact lang={lang} dict={dict} />
        <FloatingCall
          href={telHref(studio.phone)}
          label={dict.call.label}
          phone={formatPhone(studio.phone)}
        />
      </VolumeLab>
    </main>
  );
}
