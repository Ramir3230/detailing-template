import Link from "next/link";
import { lang as rootLang } from "next/root-params";
import { mainButton } from "@/components/CallButton";
import { studio } from "@/content/studio";
import { getDictionary } from "@/dictionaries";
import { telHref } from "@/lib/contact";
import { formatPhone, glue } from "@/lib/format";
import { defaultLang, isLang, localePath } from "@/lib/i18n";
import { servicesPath } from "@/lib/nav";
import { quoteOnly } from "@/lib/price-list";

/*
 * Страница 404 (DESIGN.md, «Страница 404»): в теме студии, с шапкой и подвалом, на языке
 * адреса. Сюда приходят notFound() страниц и любой незнакомый адрес — его ловит
 * [...missing]. Пропсов у not-found нет, язык — из корневого параметра.
 */
export default async function NotFound() {
  const value = await rootLang();
  const lang = isLang(value) ? value : defaultLang;
  const dict = getDictionary(lang);
  const quote = quoteOnly(studio.services);

  return (
    <main className="flex-1">
      <section className="wrap pt-6 pb-14 lg:pt-12 lg:pb-24">
        <h1 className="display text-28 leading-heading tracking-display lg:text-44">{glue(dict.notFound.title, lang)}</h1>
        <p className="mt-3 text-muted lg:mt-4 lg:max-w-160 lg:text-18">{glue(quote ? dict.notFound.textQuote : dict.notFound.text, lang)}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4 lg:mt-10">
          <Link href={localePath(lang, servicesPath)} className={`${mainButton} inline-flex px-7`}>
            {quote ? dict.hero.seeServices : dict.hero.checkPrice}
          </Link>
          <a href={telHref(studio.phone)} className="py-3 text-15 text-muted transition-colors hover:text-fg">
            {dict.hero.orCall}{" "}
            <span className="font-medium whitespace-nowrap text-fg">{formatPhone(studio.phone)}</span>
          </a>
        </div>
      </section>
    </main>
  );
}
