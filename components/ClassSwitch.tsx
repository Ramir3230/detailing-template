"use client";

import { useSyncExternalStore } from "react";
import { GearSwitch } from "@/components/GearSwitch";
import type { CarClass } from "@/content/types";
import {
  carClasses,
  defaultCarClass,
  readCarClass,
  saveCarClass,
  subscribeCarClass,
} from "@/lib/car-class";

/** Выбранный класс авто, общий для всех переключателей. На сервере — класс по умолчанию. */
export function useCarClass(): CarClass {
  return useSyncExternalStore(subscribeCarClass, readCarClass, () => defaultCarClass);
}

/**
 * Переключатель S/M/L/XL — «коробка передач» (GearSwitch). onPick — выбор сделал человек,
 * а не подстройка под сохранённый класс после загрузки: только тогда смена анимируется.
 */
export function ClassSwitch({ label, onPick }: { label: string; onPick?: () => void }) {
  const selected = useCarClass();
  return (
    <GearSwitch
      label={label}
      options={carClasses}
      index={carClasses.indexOf(selected)}
      onSelect={(index) => {
        onPick?.();
        saveCarClass(carClasses[index]);
      }}
    />
  );
}
