import { ClassPicker, ClassScope } from "@/components/ClassScope";
import { GroupBeforeAfter } from "@/components/group/GroupBeforeAfter";
import { GroupFaq } from "@/components/group/GroupFaq";
import { ServiceCards } from "@/components/group/ServiceCards";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import type { Lang } from "@/lib/i18n";
import type { GroupWithPage } from "@/lib/nav";
import { classDescriptions } from "@/lib/price-list";

/*
 * Середина страницы группы: переключатель классов, карточки услуг, до/после и частые
 * вопросы. Телефон: переключатель липнет под шапкой до конца вопросов, как на холсте;
 * класс общий со всеми страницами.
 */
export function GroupContent({ group, lang, dict }: { group: GroupWithPage; lang: Lang; dict: Dictionary }) {
  return (
    // Телефон: фокус с клавиатуры не прячется под шапку с липким переключателем
    <ClassScope className="wrap max-lg:[&_:is(a,button,input,summary)]:scroll-mt-36">
      <ClassPicker
        label={dict.prices.classLabel}
        descriptions={classDescriptions(studio.carClasses, lang)}
        className="mt-5"
      />
      <div className="mt-2">
        <ServiceCards group={group} lang={lang} dict={dict} />
      </div>
      <GroupBeforeAfter group={group} lang={lang} dict={dict} />
      <GroupFaq group={group} lang={lang} dict={dict} />
    </ClassScope>
  );
}
