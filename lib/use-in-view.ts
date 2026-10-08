import { useEffect, useState } from "react";
import { sectionIds } from "@/lib/nav";

type Options = {
  /** Значение до первого ответа наблюдателя — на сервере и при гидрации. */
  initial: boolean;
  /** Сужает или расширяет экран, как rootMargin у IntersectionObserver. */
  rootMargin?: string;
  /** Смена значения перезапускает наблюдение: вместе со страницей сменился и элемент. */
  restartOn?: string;
};

/**
 * Виден ли на экране элемент с этим id. Нулевой порог ловит и момент касания края, где
 * доля ещё 0. Ответ помнится вместе со страницей, на которой получен: после перехода,
 * пока наблюдатель не ответил, и на странице без элемента — снова initial. Только для
 * клиентских компонентов.
 */
export function useInView(id: string, { initial, rootMargin = "0px", restartOn }: Options): boolean {
  const [seen, setSeen] = useState({ on: restartOn, visible: initial });

  useEffect(() => {
    const element = document.getElementById(id);
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSeen({ on: restartOn, visible: entry.isIntersecting }),
      { threshold: [0], rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [id, rootMargin, restartOn]);

  return seen.on === restartOn ? seen.visible : initial;
}

/**
 * Виден ли hero. Ушедшим он считается, когда от него осталась только полоса под шапкой
 * (64 px): выехав, шапка её закроет. Иначе «Sprawdź cenę», которая ставит прайс под
 * шапку, оставляла бы её спрятанной. Отступ на пиксель больше шапки: после кнопки край
 * hero стоит ровно на её нижней границе, а касание края засчитывается как видимость.
 * По этому значению появляются и шапка, и плавающая «Zadzwoń» — в один момент.
 */
export function useHeroInView(restartOn?: string): boolean {
  return useInView(sectionIds.hero, { initial: true, rootMargin: "-65px 0px 0px 0px", restartOn });
}
