import Image from "next/image";
import type { Photo } from "@/content/types";
import { frameSizes } from "@/lib/frame";
import { t, type Lang } from "@/lib/i18n";

type Props = {
  photo: Photo;
  lang: Lang;
  /** Подпись под кадром, сделанным ИИ: «Zdjęcie przykładowe». */
  caption: string;
  loading: "lazy" | "eager";
  className: string;
};

/* Одиночный кадр 4:5 — фото входа, кадры O nas: на телефоне во всю ширину, на десктопе до 520 px. */
export function FramePhoto({ photo, lang, caption, loading, className }: Props) {
  return (
    <figure className={className}>
      <Image
        src={photo.src}
        width={photo.width}
        height={photo.height}
        alt={t(photo.alt, lang)}
        sizes={frameSizes}
        loading={loading}
        className="aspect-[4/5] w-full rounded-card bg-surface object-cover lg:rounded-card-lg"
      />
      {photo.ai && <figcaption className="mt-2 text-12 leading-body text-muted">{caption}</figcaption>}
    </figure>
  );
}
