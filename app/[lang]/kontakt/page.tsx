import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactDetails, ContactStatus } from "@/components/contact/ContactDetails";
import { ContactMap } from "@/components/contact/ContactMap";
import { FloatingCall } from "@/components/FloatingCall";
import { studio } from "@/content/studio";
import { getDictionary } from "@/dictionaries";
import { telHref } from "@/lib/contact";
import { formatPhone } from "@/lib/format";
import { fill, isLang } from "@/lib/i18n";
import { sectionIds } from "@/lib/nav";

const address = `${studio.address.street}, ${studio.address.area}`;

export async function generateMetadata({ params }: PageProps<"/[lang]/kontakt">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = getDictionary(lang);
  return {
    title: fill(dict.contactPage.metaTitle, { studio: studio.name }),
    description: fill(dict.contactPage.metaDescription, { studio: studio.name, address }),
  };
}

/*
 * Страница Kontakt (DESIGN.md, «Страница Kontakt»): заголовок со статусом, карта и под ней
 * тот же блок контактов, что на главной. Плавающая «Zadzwoń» видна сразу и прячется у
 * кнопки звонка блока.
 */
export default async function ContactPage({ params }: PageProps<"/[lang]/kontakt">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = getDictionary(lang);
  const { map, routeUrl } = studio.address;

  return (
    <main className="flex-1">
      <section className="wrap pt-6 lg:pt-12">
        <h1 className="display text-28 leading-heading tracking-display lg:text-44">{dict.contact.title}</h1>
        <ContactStatus lang={lang} dict={dict} className="mt-3 lg:mt-4 lg:text-18" />
        {map && (
          <ContactMap
            map={map}
            label={fill(dict.contactPage.map, { address })}
            routeUrl={routeUrl}
            dict={dict}
            className="mt-6 lg:mt-8"
          />
        )}
      </section>
      <div className="pt-12 pb-14 lg:pt-16 lg:pb-24">
        <ContactDetails lang={lang} dict={dict} />
      </div>
      <FloatingCall
        href={telHref(studio.phone)}
        label={dict.call.label}
        phone={formatPhone(studio.phone)}
        afterHero={false}
        hideAt={sectionIds.contactCall}
      />
    </main>
  );
}
