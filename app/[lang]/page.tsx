import { notFound } from "next/navigation";
import { CallButton } from "@/components/CallButton";
import { Contact } from "@/components/home/Contact";
import { FloatingCall } from "@/components/home/FloatingCall";
import { Prices } from "@/components/home/Prices";
import { Reviews } from "@/components/home/Reviews";
import { studio } from "@/content/studio";
import { getDictionary } from "@/dictionaries";
import { telHref } from "@/lib/contact";
import { formatPhone } from "@/lib/format";
import { isLang, t } from "@/lib/i18n";
import { sectionIds } from "@/lib/nav";

/* Главная. Hero пока временный — заголовок и звонок; машина и зажигание — блок 3b. */
export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <main className="flex-1">
      <section
        id={sectionIds.hero}
        className="wrap flex flex-col items-center py-14 text-center lg:py-24"
      >
        <h1 className="display text-24 leading-hero tracking-display whitespace-pre-line lg:text-hero lg:leading-heading">
          {t(studio.hero.title, lang)}
        </h1>
        <p className="mt-3 text-muted">{t(studio.hero.subtitle, lang)}</p>
        <CallButton dict={dict} className="mt-8 lg:inline-flex lg:w-auto lg:px-7" />
      </section>
      <Prices lang={lang} dict={dict} />
      <Reviews lang={lang} dict={dict} />
      <Contact lang={lang} dict={dict} />
      <FloatingCall
        href={telHref(studio.phone)}
        label={dict.call.label}
        phone={formatPhone(studio.phone)}
      />
    </main>
  );
}
