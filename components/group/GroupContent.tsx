import { ClassPicker, ClassScope } from "@/components/ClassScope";
import { AdviceCard } from "@/components/group/AdviceCard";
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
 * вопросы. Телефон: одна колонка, переключатель липнет под шапкой до конца вопросов,
 * как на холсте (обе колонки «растворяются», display: contents). Десктоп (от 1024) —
 * как прайс главной: липкая боковая колонка слева — переключатель, описание класса и
 * карточка «Nie wiesz…», — основная справа. На телефоне эта карточка — в конце страницы
 * (её рисует страница), здесь она только для десктопа: одна разметка не встала бы и в
 * колонку, и после вопросов без расхождения порядка чтения с порядком на экране.
 */
export function GroupContent({ group, lang, dict }: { group: GroupWithPage; lang: Lang; dict: Dictionary }) {
  return (
    <ClassScope className="wrap lg:flex lg:flex-wrap lg:items-start lg:gap-x-20 lg:gap-y-12 lg:pt-12 lg:pb-24">
      <div className="contents lg:sticky lg:top-6 lg:block lg:max-w-95 lg:flex-[1_1_300px]">
        {/* Подпись над переключателем — для глаз: у радиогруппы та же подпись для диктора */}
        <p aria-hidden="true" className="caps-label hidden lg:block">
          {dict.prices.classLabel}
        </p>
        <ClassPicker
          label={dict.prices.classLabel}
          descriptions={classDescriptions(studio.carClasses, lang)}
          className="mt-5 lg:mt-3"
        />
        <div className="hidden lg:mt-6 lg:block">
          <AdviceCard group={group} lang={lang} dict={dict} place="aside" />
        </div>
      </div>

      {/* Телефон: фокус с клавиатуры в основной колонке не прячется под шапку с липким
          переключателем. Не на всей рамке: сам переключатель уже на виду, и запас
          прокрутки дёргал бы страницу при каждой стрелке */}
      <div className="contents max-lg:[&_:is(a,button,input,summary)]:scroll-mt-36 lg:block lg:min-w-0 lg:flex-[999_1_560px]">
        <div className="mt-2 lg:mt-0">
          <ServiceCards group={group} lang={lang} dict={dict} />
        </div>
        <GroupBeforeAfter group={group} lang={lang} dict={dict} />
        <GroupFaq group={group} lang={lang} dict={dict} />
      </div>
    </ClassScope>
  );
}
