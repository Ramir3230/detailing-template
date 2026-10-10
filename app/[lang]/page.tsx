import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BeforeAfter } from "@/components/home/BeforeAfter";
import { Contact } from "@/components/home/Contact";
import { FloatingCall } from "@/components/FloatingCall";
import { Hero } from "@/components/home/Hero";
import { Prices } from "@/components/home/Prices";
import { ReloadAtHero } from "@/components/home/ReloadAtHero";
import { Reviews } from "@/components/home/Reviews";
import { studio } from "@/content/studio";
import { getDictionary } from "@/dictionaries";
import { telHref } from "@/lib/contact";
import { formatPhone } from "@/lib/format";
import { isLang } from "@/lib/i18n";
import { sectionIds } from "@/lib/nav";
import { alternates } from "@/lib/seo";

/* Заголовок и описание — студии, из layout */
export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return { alternates: alternates(lang, "/") };
}

/* Главная: hero, прайс, до/после, отзывы, контакты и плавающий звонок между hero и контактами. */
export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <main className="flex-1">
      <Hero lang={lang} dict={dict} />
      <Prices lang={lang} dict={dict} />
      <BeforeAfter lang={lang} dict={dict} />
      <Reviews lang={lang} dict={dict} />
      <Contact lang={lang} dict={dict} />
      <FloatingCall
        href={telHref(studio.phone)}
        label={dict.call.label}
        phone={formatPhone(studio.phone)}
        afterHero
        hideAt={sectionIds.contactCall}
      />
      <ReloadAtHero />
    </main>
  );
}
