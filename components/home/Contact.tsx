import { ContactDetails, ContactStatus } from "@/components/contact/ContactDetails";
import { SectionTitle } from "@/components/home/SectionTitle";
import type { Dictionary } from "@/dictionaries/types";
import type { Lang } from "@/lib/i18n";
import { sectionIds } from "@/lib/nav";

/* Контакты главной: заголовок со статусом внутри блока, как на холсте; без фото входа — карта на его месте. */
export function Contact({ lang, dict }: { lang: Lang; dict: Dictionary }) {
  return (
    <section
      id={sectionIds.contact}
      className="scroll-mt-16 py-14 lg:scroll-mt-0 lg:border-t lg:border-line lg:py-24"
    >
      <ContactDetails
        lang={lang}
        dict={dict}
        mapInPlace
        heading={
          <>
            <SectionTitle>{dict.contact.title}</SectionTitle>
            <ContactStatus lang={lang} dict={dict} className="mt-3 text-center lg:mt-4 lg:text-left" />
          </>
        }
      />
    </section>
  );
}
