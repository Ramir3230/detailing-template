import { useSyncExternalStore } from "react";
import { warsawTime, type WarsawTime } from "@/lib/hours";

/*
 * Время студии для статуса «Otwarte» и метки «dziś». Страница собирается заранее, а
 * время — момент открытия, поэтому на сервере и при гидрации его нет (null) и читается
 * оно только в браузере: разметка сервера и клиента не расходится. Сверяется раз в 30 с.
 * Только для клиентских компонентов.
 */
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 30_000);
  return () => clearInterval(timer);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);
const noTimeOnServer = () => null;

export function useWarsawTime(): WarsawTime | null {
  const minute = useSyncExternalStore(subscribe, currentMinute, noTimeOnServer);
  return minute === null ? null : warsawTime(new Date(minute * 60_000));
}
