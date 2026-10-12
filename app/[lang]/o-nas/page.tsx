import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutChapter } from "@/components/about/AboutChapter";
import { CallCard } from "@/components/CallCard";
import { FloatingCall } from "@/components/FloatingCall";
import { studio } from "@/content/studio";
import { getDictionary } from "@/dictionaries";
import { telHref } from "@/lib/contact";
import { formatPhone, glue } from "@/lib/format";
import { fill, isLang, t } from "@/lib/i18n";
import { aboutCallId, aboutPagePath } from "@/lib/nav";
import { alternates, notFoundMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/o-nas">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { about } = studio;
  if (!about) return notFoundMetadata(lang);
  const dict = getDictionary(lang);
  return {
    title: fill(dict.aboutPage.metaTitle, { studio: studio.name }),
    description: t(about.intro, lang),
    alternates: alternates(lang, aboutPagePath),
  };
}

/*
 * Страница O nas (DESIGN.md, «Страница O nas»): вводный абзац и цифры, главы с кадрами —
 * с чего начинали, как работают, на чём, — в конце карточка со звонком. Есть, когда в
 * данных студии есть поле about; без него адрес — 404, а навигация сюда не ведёт.
 */
export default async function AboutPage({ params }: PageProps<"/[lang]/o-nas">) {
  const { lang } = await params;
  const { about } = studio;
  if (!isLang(lang) || !about) notFound();
  const dict = getDictionary(lang);

  return (
    <main className="flex-1">
      <section className="wrap pt-6 lg:pt-12">
        <h1 className="display text-28 leading-heading tracking-display lg:text-44">{glue(dict.nav.about, lang)}</h1>
        <p className="mt-3 text-muted lg:mt-4 lg:max-w-160 lg:text-18">{glue(t(about.intro, lang), lang)}</p>
        {about.facts.length > 0 && (
          <ul className="mt-8 grid auto-cols-fr grid-flow-col gap-4 border-t border-line pt-6 lg:mt-12 lg:gap-10 lg:pt-8">
            {about.facts.map(({ value, label }) => (
              <li key={label.pl}>
                <span className="display block text-24 leading-none tracking-display lg:text-40">{value}</span>
                <span className="mt-2 block text-13 leading-note text-muted lg:mt-3 lg:text-14">
                  {glue(t(label, lang), lang)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {about.chapters.map((chapter, i) => (
        <AboutChapter
          key={chapter.photo.src}
          chapter={chapter}
          lang={lang}
          dict={dict}
          photoSide={i % 2 === 0 ? "left" : "right"}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
      <section className="wrap pt-14 pb-14 lg:pt-24 lg:pb-24">
        <CallCard
          title={glue(dict.aboutPage.callTitle, lang)}
          text={glue(dict.aboutPage.callText, lang)}
          dict={dict}
          place="end"
          callId={aboutCallId}
          className="lg:mx-auto lg:max-w-160"
        />
      </section>
      <FloatingCall
        href={telHref(studio.phone)}
        label={dict.call.label}
        phone={formatPhone(studio.phone)}
        afterHero={false}
        hideAt={aboutCallId}
      />
    </main>
  );
}
