import { ClassPicker, ClassScope } from "@/components/ClassScope";
import { ServiceCards } from "@/components/group/ServiceCards";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import type { Lang } from "@/lib/i18n";
import type { GroupWithPage } from "@/lib/nav";
import { classDescriptions } from "@/lib/price-list";

/*
 * Переключатель классов и карточки услуг группы. Телефон: переключатель липнет под
 * шапкой, под ним описание класса, ниже карточки. Класс общий со всеми страницами.
 */
export function GroupServices({ group, lang, dict }: { group: GroupWithPage; lang: Lang; dict: Dictionary }) {
  return (
    <ClassScope className="wrap pb-14 lg:pb-24">
      <ClassPicker
        label={dict.prices.classLabel}
        descriptions={classDescriptions(studio.carClasses, lang)}
        className="mt-5"
      />
      <div className="mt-2">
        <ServiceCards group={group} lang={lang} dict={dict} />
      </div>
    </ClassScope>
  );
}
