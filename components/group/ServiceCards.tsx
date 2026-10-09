import { ClassPrice } from "@/components/ClassScope";
import { ServiceName } from "@/components/Price";
import { CheckIcon, ClockIcon } from "@/components/icons";
import type { Dictionary } from "@/dictionaries/types";
import { formatDuration, glue } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";
import type { GroupWithPage } from "@/lib/nav";
import { priceList } from "@/lib/price-list";

/*
 * Карточки услуг группы: цена для выбранного класса, длительность и «W zakresie». Цены
 * готовит тот же priceList, что и прайс главной, — счётчик и «indywidualnie» при XL
 * ведут себя одинаково. Звонка в карточке нет и при XL (решение владельца 09.10.2026):
 * рядом плавающая «Zadzwoń» и карточка «Nie wiesz, którą wybrać?».
 */
export function ServiceCards({ group, lang, dict }: { group: GroupWithPage; lang: Lang; dict: Dictionary }) {
  const [{ rows }] = priceList([group], lang, dict.price);

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {group.services.map((service, i) => {
        const row = rows[i];
        return (
          <article
            key={row.name}
            className="rounded-card border border-line bg-surface p-5 lg:rounded-card-lg lg:p-8"
          >
            <div className="flex items-start justify-between gap-4 lg:gap-6">
              <div className="flex flex-col gap-1">
                <h2>
                  <ServiceName name={row.name} brand={row.brand} size="card" />
                </h2>
                {/* «Wszystkie klasy», от чего зависит цена «od» — как в строке прайса */}
                {row.note && <p className="text-13 leading-note text-muted lg:text-14">{row.note}</p>}
              </div>
              <ClassPrice prices={row.prices} rolling={row.rolling} order={i} size="card" />
            </div>
            {service.duration && (
              <p className="mt-2 flex items-center gap-2 text-14 text-muted lg:text-15">
                <ClockIcon size={16} />
                {formatDuration(service.duration, lang, dict.units)}
              </p>
            )}
            {service.scope && (
              <>
                <p className="caps-label mt-5 lg:mt-7">{dict.group.scope}</p>
                <ul className="mt-3 flex flex-col gap-2 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] lg:gap-x-8">
                  {service.scope.map((line) => (
                    <li key={line.pl} className="flex gap-2 text-15 leading-note">
                      {/* Галочка по центру первой строки пункта */}
                      <span className="flex h-[1lh] items-center text-accent">
                        <CheckIcon />
                      </span>
                      {glue(t(line, lang), lang)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}
