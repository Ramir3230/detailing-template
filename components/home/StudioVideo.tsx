"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { PlayIcon } from "@/components/icons";
import { frameSizes } from "@/lib/frame";

type Props = {
  src: string;
  /** Обложка — кадр ролика 4:5. */
  poster: { src: string; width: number; height: number; alt: string };
  /** Субтитры на языке страницы, если они у ролика есть. */
  captions?: { src: string; lang: string; label: string };
  /** Кнопка ▶ для диктора. */
  play: string;
};

/*
 * Ролик студии в кадре 4:5 (DESIGN.md, «Почему мы»). До нажатия — обложка и ▶, а файл не
 * грузится; нажатие запускает его со звуком, дальше — штатные кнопки плеера. Обложка
 * стоит, пока не пошёл первый кадр: иначе на её месте мигнул бы пустой кадр.
 */
export function StudioVideo({ src, poster, captions, play }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"poster" | "loading" | "playing">("poster");

  function start() {
    setState("loading");
    // Запуск по нажатию — звук разрешён. Файл не играется — снова обложка
    video.current?.play().catch(() => setState("poster"));
  }

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface lg:rounded-card-lg">
      <video
        ref={video}
        preload="none"
        playsInline
        controls={state === "playing"}
        aria-label={poster.alt}
        onPlaying={() => setState("playing")}
        className="absolute inset-0 size-full object-cover"
      >
        <source src={src} type="video/mp4" />
        {captions && (
          <track kind="subtitles" src={captions.src} srcLang={captions.lang} label={captions.label} default />
        )}
      </video>
      {state !== "playing" && (
        <>
          <Image
            src={poster.src}
            width={poster.width}
            height={poster.height}
            alt={poster.alt}
            sizes={frameSizes}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
          <button
            type="button"
            onClick={start}
            aria-label={play}
            aria-busy={state === "loading"}
            className="glass-float absolute top-1/2 left-1/2 flex size-16 -translate-1/2 items-center justify-center rounded-full text-fg transition-colors hover:text-accent aria-busy:animate-pulse"
          >
            <PlayIcon size={28} />
          </button>
        </>
      )}
    </div>
  );
}
