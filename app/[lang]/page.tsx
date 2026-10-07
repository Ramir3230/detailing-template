import { notFound } from "next/navigation";
import { CallButton } from "@/components/CallButton";
import { studio } from "@/content/studio";
import { getDictionary } from "@/dictionaries";
import { isLang, t } from "@/lib/i18n";

/* Временная главная блока 2: каркас между шапкой и подвалом. Блоки — в блоке 3. */
export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <main className="wrap flex flex-1 flex-col items-center justify-center py-14 text-center lg:py-24">
      <h1 className="display text-24 leading-hero tracking-display whitespace-pre-line lg:text-hero lg:leading-heading">
        {t(studio.hero.title, lang)}
      </h1>
      <p className="mt-3 text-muted">{t(studio.hero.subtitle, lang)}</p>
      <CallButton dict={dict} className="mt-8 max-w-sm" />
    </main>
  );
}
