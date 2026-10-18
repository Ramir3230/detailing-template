import { Messengers } from "@/components/Messengers";
import { PriceList } from "@/components/home/PriceList";
import { SectionTitle } from "@/components/home/SectionTitle";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { telHref } from "@/lib/contact";
import { glue } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";
import { sectionIds } from "@/lib/nav";
import { classDescriptions, classPriced, priceList, quoteOnly } from "@/lib/price-list";

export function Prices({ lang, dict }: { lang: Lang; dict: Dictionary }) {
  const picker = classPriced(studio.services);
  const quote = quoteOnly(studio.services);
  const note = glue(t(studio.priceNote, lang), lang);

  return (
    // tabIndex и outline-none: на секцию ставит фокус «Sprawdź cenę» (ScrollLink), без обводки.
    // relative: свет hero, уходящий вниз, ложится под текст прайса, а не поверх
    <section
      id={sectionIds.services}
      tabIndex={-1}
      className="relative scroll-mt-16 py-14 outline-none lg:scroll-mt-0 lg:py-24"
    >
      <PriceList
        heading={
          <>
            <SectionTitle>{glue(quote ? dict.prices.titleQuote : dict.prices.title, lang)}</SectionTitle>
            {picker && (
              <>
                <p className="mt-3 text-center text-muted lg:hidden">{glue(dict.prices.pick, lang)}</p>
                <p className="mt-3 hidden text-muted lg:block">{glue(dict.prices.pickLong, lang)}</p>
              </>
            )}
            {quote && <p className="mt-3 text-center text-muted lg:text-left">{glue(dict.prices.quoteHint, lang)}</p>}
          </>
        }
        groups={priceList(studio.services, lang, dict)}
        picker={
          picker
            ? {
                label: dict.prices.classLabel,
                descriptions: classDescriptions(studio.carClasses, lang),
                individualQuote: dict.prices.individualQuote,
                call: dict.call.label,
                telHref: telHref(studio.phone),
              }
            : undefined
        }
        priced={!quote}
        footer={
          quote ? (
            <QuoteCard title={dict.prices.individualQuote} text={note} dict={dict} />
          ) : (
            <p className="text-13 leading-note text-muted lg:text-14">{note}</p>
          )
        }
        whatsIncluded={dict.group.whatsIncluded}
        rimLabel={dict.prices.rimLabel}
      />
    </section>
  );
}

/*
 * Прайс по запросу: под списком — как студия считает цену и куда написать за wyceną.
 * Звонка в карточке нет: рядом плавающая «Zadzwoń», а две кнопки звонка разом не стоят
 * (DESIGN.md, «Плавающая «Zadzwoń»»). Без мессенджеров карточка — только текст.
 */
function QuoteCard({ title, text, dict }: { title: string; text: string; dict: Dictionary }) {
  return (
    <div className="rounded-card border border-line bg-surface p-6 lg:rounded-card-lg">
      <h3 className="text-17 leading-item font-medium">{title}</h3>
      <p className="mt-2 text-15 text-muted">{text}</p>
      <Messengers dict={dict} variant="contact" className="mt-5" />
    </div>
  );
}
