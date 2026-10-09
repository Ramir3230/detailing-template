import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Dictionary } from "@/dictionaries/types";
import { glue } from "@/lib/format";
import { localePath, t, type Lang } from "@/lib/i18n";
import { servicesPath, type GroupWithPage } from "@/lib/nav";

/* Верх страницы группы: крошки к прайсу главной, название группы и вводный абзац. */
export function GroupIntro({ group, lang, dict }: { group: GroupWithPage; lang: Lang; dict: Dictionary }) {
  const name = glue(t(group.name, lang), lang);

  return (
    <section className="wrap pt-6 lg:pt-12">
      <Breadcrumbs
        label={dict.group.breadcrumbs}
        trail={[{ name: dict.nav.services, href: localePath(lang, servicesPath) }]}
        current={name}
      />
      <h1 className="display mt-4 text-28 leading-heading tracking-display text-balance lg:mt-5 lg:text-44">
        {name}
      </h1>
      <p className="mt-3 text-muted lg:mt-4 lg:max-w-160 lg:text-18">{glue(t(group.intro, lang), lang)}</p>
    </section>
  );
}
