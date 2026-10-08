"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  defaultVolume,
  VolumeContext,
  type VolumeSettings,
  type VolumeStatus,
} from "@/components/home/CarVolume";

/*
 * Лаборатория объёмной машины (ROADMAP 3b, эксперимент): панель настроек поверх
 * главной. Страница служебная и в main не идёт, поэтому подписи прямо здесь, по-русски,
 * а не в словаре: их читает владелец, а не посетитель.
 * Настройки живут в адресе — понравившийся вариант пересылается ссылкой.
 */

const switches = [
  { key: "on", label: "Объём: машина поворачивается" },
  { key: "neon", label: "Неон кодом (выкл — CSS)" },
] as const;

const sliders = [
  { key: "glow", label: "Яркость неона", min: 0, max: 3, step: 0.05 },
  { key: "gloss", label: "Глянец пола", min: 0, max: 1, step: 0.05 },
  { key: "mirror", label: "Отражение", min: 0, max: 1, step: 0.05 },
  { key: "angle", label: "Поворот, °", min: 0, max: 12, step: 0.5 },
  { key: "depth", label: "Глубина", min: 0, max: 0.8, step: 0.05 },
  { key: "light", label: "Неон на кузове", min: 0, max: 2, step: 0.05 },
] as const;

const statusText: Record<VolumeStatus, string> = {
  loading: "Загружается…",
  live: "Работает",
  still: "Без движения: в системе включено уменьшение движения",
  "save-data": "Выключено: режим экономии трафика",
  "no-webgl": "Выключено: в браузере нет WebGL2 или он программный",
  "no-image": "Выключено: не загрузились картинки",
  slow: "Выключено: устройство не тянет 20 кадров/с",
  lost: "Выключено: WebGL сбросился",
};

const changeEvent = "carvolumelab";
let cached = { search: "", settings: defaultVolume };

function parse(search: string): VolumeSettings {
  const query = new URLSearchParams(search);
  const settings = { ...defaultVolume };
  for (const { key } of switches) {
    if (query.has(key)) settings[key] = query.get(key) !== "0";
  }
  for (const { key, min, max } of sliders) {
    const value = Number(query.get(key));
    if (query.has(key) && Number.isFinite(value)) settings[key] = Math.min(max, Math.max(min, value));
  }
  return settings;
}

/* Тот же объект, пока адрес тот же: useSyncExternalStore сравнивает по ссылке */
function readSettings(): VolumeSettings {
  if (location.search !== cached.search) {
    cached = { search: location.search, settings: parse(location.search) };
  }
  return cached.settings;
}

function subscribe(onChange: () => void) {
  addEventListener(changeEvent, onChange);
  addEventListener("popstate", onChange);
  return () => {
    removeEventListener(changeEvent, onChange);
    removeEventListener("popstate", onChange);
  };
}

/* В адресе — только то, что отличается от значений по умолчанию */
function save(settings: VolumeSettings) {
  const query = new URLSearchParams();
  for (const { key } of switches) {
    if (settings[key] !== defaultVolume[key]) query.set(key, settings[key] ? "1" : "0");
  }
  for (const { key } of sliders) {
    if (settings[key] !== defaultVolume[key]) query.set(key, String(settings[key]));
  }
  const search = query.size ? `?${query}` : "";
  history.replaceState(null, "", `${location.pathname}${search}`);
  dispatchEvent(new Event(changeEvent));
}

const serverSettings = () => defaultVolume;

export function VolumeLab({ children }: { children: ReactNode }) {
  const settings = useSyncExternalStore(subscribe, readSettings, serverSettings);
  const [status, setStatus] = useState<VolumeStatus>("loading");
  const [open, setOpen] = useState(false);
  const live = status === "live" || status === "still";

  return (
    <VolumeContext value={{ settings, report: setStatus }}>
      {children}
      {/* Слева внизу: справа плавающая «Zadzwoń», по центру — «Sprawdź cenę».
          Панель прокручивается: на низком телефоне все ползунки не влезают */}
      <div className="fixed bottom-4 left-4 z-40 text-14 lg:bottom-8 lg:left-8">
        {open && (
          <div
            id="volume-lab"
            className="glass-float mb-2 max-h-[70svh] w-72 overflow-y-auto rounded-card border border-line-strong px-4 py-2"
          >
            {switches.map(({ key, label }) => (
              <label key={key} className="flex min-h-11 items-center justify-between gap-3 font-medium">
                {label}
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(event) => save({ ...settings, [key]: event.target.checked })}
                  className="size-5 shrink-0 accent-accent"
                />
              </label>
            ))}
            {sliders.map(({ key, label, min, max, step }) => (
              <label key={key} className="mt-1 block">
                <span className="flex justify-between text-muted">
                  {label}
                  <span className="text-fg tabular-nums">{settings[key]}</span>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={settings[key]}
                  onChange={(event) => save({ ...settings, [key]: Number(event.target.value) })}
                  className="h-11 w-full accent-accent"
                />
              </label>
            ))}
            <p className="mt-1 text-13 text-muted">{statusText[status]}</p>
            <button
              type="button"
              onClick={() => save(defaultVolume)}
              className="min-h-11 text-13 text-muted underline transition-colors hover:text-fg"
            >
              Вернуть как было
            </button>
          </div>
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="volume-lab"
          onClick={() => setOpen(!open)}
          className="glass-float flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 font-medium"
        >
          <span aria-hidden="true" className={`size-2 rounded-full ${live ? "bg-accent" : "bg-muted"}`} />
          3D
        </button>
      </div>
    </VolumeContext>
  );
}
