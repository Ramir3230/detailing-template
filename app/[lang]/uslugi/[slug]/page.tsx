import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GroupIntro } from "@/components/group/GroupIntro";
import { GroupServices } from "@/components/group/GroupServices";
import { studio } from "@/content/studio";
import { getDictionary } from "@/dictionaries";
import { fill, isLang, t } from "@/lib/i18n";
import { hasGroupPage } from "@/lib/nav";

/*
 * Страница группы услуг (BRIEF.md): главная отвечает «сколько», страница группы — «что
 * именно за эти деньги». Собирается на каждую группу, у которой в данных есть страница;
 * другой адрес под /uslugi — 404. Хотя бы одну такую группу требует content/studio.test.ts:
 * с Cache Components маршрут без единого адреса не собирается.
 *
 * Страница целиком статическая, и сборка за этим следит. Заодно незнакомый адрес Next
 * сначала дорисовывает до конца и только потом отвечает — 404 уходит со статусом 404.
 * С частичной предотрисовкой шапка ушла бы раньше, со статусом 200.
 */
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return studio.services.filter(hasGroupPage).map(({ slug }) => ({ slug }));
}

function findGroup(slug: string) {
  return studio.services.filter(hasGroupPage).find((group) => group.slug === slug);
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/uslugi/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const group = findGroup(slug);
  if (!isLang(lang) || !group) notFound();
  const dict = getDictionary(lang);
  return {
    title: fill(dict.group.metaTitle, { group: t(group.name, lang), studio: studio.name }),
    description: t(group.intro, lang),
  };
}

export default async function GroupPage({ params }: PageProps<"/[lang]/uslugi/[slug]">) {
  const { lang, slug } = await params;
  const group = findGroup(slug);
  if (!isLang(lang) || !group) notFound();
  const dict = getDictionary(lang);

  return (
    <main className="flex-1">
      <GroupIntro group={group} lang={lang} dict={dict} />
      <GroupServices group={group} lang={lang} dict={dict} />
    </main>
  );
}
