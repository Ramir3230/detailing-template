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

const sliders = [
  { key: "angle", label: "Поворот, °", min: 0, max: 12, step: 0.5 },
  { key: "depth", label: "Глубина", min: 0, max: 0.8, step: 0.05 },
  { key: "light", label: "Неон на кузове", min: 0, max: 2, step: 0.05 },
] as const;

const statusText: Record<VolumeStatus, string> = {
  loading: "Загружается…",
  live: "Работает",
  "reduced-motion": "Статично: в системе включено уменьшение движения",
  "save-data": "Статично: режим экономии трафика",
  "no-webgl": "Статично: в браузере нет WebGL2 или он программный",
  "no-image": "Статично: не загрузились картинки",
  slow: "Статично: устройство не тянет 20 кадров/с",
  lost: "Статично: WebGL сбросился",
};

const changeEvent = "carvolumelab";
let cached = { search: "", settings: defaultVolume };

/* В адресе — ключ карты из списка лаборатории, а не её путь */
type LabSettings = Omit<VolumeSettings, "map"> & { map?: string };

function parse(search: string): LabSettings {
  const query = new URLSearchParams(search);
  const settings: LabSettings = {
    ...defaultVolume,
    on: query.get("on") !== "0",
    map: query.get("map") ?? undefined,
  };
  for (const { key, min, max } of sliders) {
    const value = Number(query.get(key));
    if (query.has(key) && Number.isFinite(value)) settings[key] = Math.min(max, Math.max(min, value));
  }
  return settings;
}

/* Тот же объект, пока адрес тот же: useSyncExternalStore сравнивает по ссылке */
function readSettings(): LabSettings {
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

function save(settings: LabSettings) {
  const query = new URLSearchParams();
  if (!settings.on) query.set("on", "0");
  if (settings.map) query.set("map", settings.map);
  for (const { key } of sliders) {
    if (settings[key] !== defaultVolume[key]) query.set(key, String(settings[key]));
  }
  const search = query.size ? `?${query}` : "";
  history.replaceState(null, "", `${location.pathname}${search}`);
  dispatchEvent(new Event(changeEvent));
}

const serverSettings = (): LabSettings => defaultVolume;

type Props = {
  children: ReactNode;
  /** Карты объёма для сравнения; первая — из данных студии. */
  maps: readonly { key: string; label: string; url: string }[];
};

export function VolumeLab({ children, maps }: Props) {
  const settings = useSyncExternalStore(subscribe, readSettings, serverSettings);
  const map = maps.find(({ key }) => key === settings.map) ?? maps[0];
  const [status, setStatus] = useState<VolumeStatus>("loading");
  const [open, setOpen] = useState(false);
  const live = settings.on && status === "live";

  return (
    <VolumeContext value={{ settings: { ...settings, map: map?.url }, report: setStatus }}>
      {children}
      {/* Слева внизу: справа плавающая «Zadzwoń», по центру — «Sprawdź cenę» */}
      <div className="fixed bottom-4 left-4 z-40 text-14 lg:bottom-8 lg:left-8">
        {open && (
          <div id="volume-lab" className="glass-float mb-2 w-72 rounded-card border border-line-strong p-4">
            <label className="flex min-h-11 items-center justify-between gap-3 font-medium">
              Объём
              <input
                type="checkbox"
                checked={settings.on}
                onChange={(event) => save({ ...settings, on: event.target.checked })}
                className="size-5 accent-accent"
              />
            </label>
            {maps.length > 1 && (
              <fieldset className="mt-2 flex items-center justify-between gap-3">
                <legend className="sr-only">Карта объёма</legend>
                <span className="text-muted">Карта</span>
                <span className="flex gap-1">
                  {maps.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={map?.key === key}
                      onClick={() => save({ ...settings, map: key === maps[0].key ? undefined : key })}
                      className="min-h-11 rounded-full border border-line-strong px-3 transition-colors aria-pressed:border-accent-border aria-pressed:bg-accent-selected"
                    >
                      {label}
                    </button>
                  ))}
                </span>
              </fieldset>
            )}
            {sliders.map(({ key, label, min, max, step }) => (
              <label key={key} className="mt-2 block">
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
            <p className="mt-1 text-13 text-muted">
              {settings.on ? statusText[status] : "Выключен — обычная картинка"}
            </p>
            <button
              type="button"
              onClick={() => save(defaultVolume)}
              className="mt-1 min-h-11 text-13 text-muted underline transition-colors hover:text-fg"
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
