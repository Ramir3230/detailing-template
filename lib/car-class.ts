import type { CarClass } from "@/content/types";

export const carClasses: readonly CarClass[] = ["S", "M", "L", "XL"];

/** Седаны и универсалы — самый частый класс (DESIGN.md, «Прайс»). */
export const defaultCarClass: CarClass = "M";

/*
 * Выбранный класс помнится между страницами в localStorage. Если хранилище закрыто
 * (приватный режим), выбор живёт в памяти до перезагрузки. Другая вкладка поменяла
 * класс — событие storage, эта вкладка — своё событие.
 */
const storageKey = "carClass";
const changeEvent = "carclasschange";
let inMemory: CarClass | null = null;

export function parseCarClass(value: string | null): CarClass {
  return carClasses.find((carClass) => carClass === value) ?? defaultCarClass;
}

export function readCarClass(): CarClass {
  if (inMemory) return inMemory;
  try {
    return parseCarClass(localStorage.getItem(storageKey));
  } catch {
    return defaultCarClass;
  }
}

export function saveCarClass(carClass: CarClass) {
  inMemory = carClass;
  try {
    localStorage.setItem(storageKey, carClass);
  } catch {
    // хранилище закрыто — остаётся inMemory
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function subscribeCarClass(onChange: () => void) {
  const fromOtherTab = () => {
    inMemory = null;
    onChange();
  };
  window.addEventListener("storage", fromOtherTab);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", fromOtherTab);
    window.removeEventListener(changeEvent, onChange);
  };
}
