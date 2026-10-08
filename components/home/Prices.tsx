import { PriceList } from "@/components/home/PriceList";
import { SectionTitle } from "@/components/home/SectionTitle";
import { studio } from "@/content/studio";
import type { CarClass } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";
import { carClasses } from "@/lib/car-class";
import { telHref } from "@/lib/contact";
import { glue } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";
import { sectionIds } from "@/lib/nav";
import { priceList } from "@/lib/price-list";

export function Prices({ lang, dict }: { lang: Lang; dict: Dictionary }) {
  const descriptions = Object.fromEntries(
    carClasses.map((carClass) => [carClass, glue(t(studio.carClasses[carClass], lang), lang)]),
  ) as Record<CarClass, string>;

  return (
    // tabIndex и outline-none: на секцию ставит фокус «Sprawdź cenę» (ScrollLink), без обводки
    <section
      id={sectionIds.services}
      tabIndex={-1}
      className="scroll-mt-16 py-14 outline-none lg:scroll-mt-0 lg:py-24"
    >
      <PriceList
        heading={
          <>
            <SectionTitle>{glue(dict.prices.title, lang)}</SectionTitle>
            <p className="mt-3 text-center text-muted lg:hidden">{glue(dict.prices.pick, lang)}</p>
            <p className="mt-3 hidden text-muted lg:block">{glue(dict.prices.pickLong, lang)}</p>
          </>
        }
        groups={priceList(studio.services, lang, dict.price)}
        descriptions={descriptions}
        words={{
          classLabel: dict.prices.classLabel,
          individualQuote: dict.prices.individualQuote,
          call: dict.call.label,
        }}
        telHref={telHref(studio.phone)}
      />
    </section>
  );
}
