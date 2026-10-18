"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PlayIcon } from "@/components/icons";
import { frameSizes } from "@/lib/frame";

type Props = {
  src: string;
  /** Обложка — кадр ролика 4:5; alt — имя ролика для диктора. */
  poster: { src: string; width: number; height: number; alt: string };
  /** Субтитры на языке страницы, если они у ролика есть. */
  captions?: { src: string; lang: string; label: string };
  /** Кнопка ▶ для диктора. */
  play: string;
};

/*
 * Ролик студии в кадре 4:5 (DESIGN.md, «Почему мы»). До нажатия — обложка, а файл не
 * грузится; нажатие по кадру запускает ролик со звуком, дальше — штатные кнопки плеера.
 * Обложка стоит, пока не пошёл первый кадр: иначе на её месте мигнул бы пустой кадр.
 * Файл — в src у <video>, а не в <source>: так сбой загрузки отклоняет play(), и
 * обложка возвращается, а не ждёт другого источника.
 */
export function StudioVideo({ src, poster, captions, play }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  // Запустили с клавиатуры — фокус переходит на плеер, когда кнопка уходит
  const keepFocus = useRef(false);
  const [state, setState] = useState<"poster" | "loading" | "playing">("poster");

  useEffect(() => {
    if (state === "playing" && keepFocus.current) video.current?.focus();
  }, [state]);

  function start() {
    keepFocus.current = document.activeElement === button.current;
    setState("loading");
    // Запуск по нажатию — звук разрешён. Файл не играется — снова обложка
    video.current?.play().catch(() => setState("poster"));
  }

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface lg:rounded-card-lg">
      <video
        ref={video}
        src={src}
        preload="none"
        playsInline
        controls={state === "playing"}
        aria-label={poster.alt}
        onPlaying={() => setState("playing")}
        className="absolute inset-0 size-full object-cover"
      >
        {captions && (
          <track kind="subtitles" src={captions.src} srcLang={captions.lang} label={captions.label} default />
        )}
      </video>
      {state !== "playing" && (
        <>
          {/* Имя ролика — у <video>, действие — у кнопки: обложка диктору не нужна */}
          <Image
            src={poster.src}
            width={poster.width}
            height={poster.height}
            alt=""
            sizes={frameSizes}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
          {/* Нажимается весь кадр, как рилс; круг стеклом — знак, что это ролик */}
          <button
            ref={button}
            type="button"
            onClick={start}
            aria-label={play}
            aria-busy={state === "loading"}
            className="group absolute inset-0 grid place-items-center rounded-[inherit]"
          >
            <span className="glass-float flex size-16 items-center justify-center rounded-full text-fg transition-colors group-hover:text-accent group-aria-busy:animate-pulse">
              <PlayIcon size={28} />
            </span>
          </button>
        </>
      )}
    </div>
  );
}
