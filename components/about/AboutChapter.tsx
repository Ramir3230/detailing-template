import { FramePhoto } from "@/components/FramePhoto";
import { PageHeading } from "@/components/group/PageHeading";
import type { AboutChapter as Chapter } from "@/content/types";
import type { Dictionary } from "@/dictionaries/types";
import { glue } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";

type Props = {
  chapter: Chapter;
  lang: Lang;
  dict: Dictionary;
  /** Сторона кадра на десктопе: главы чередуются, чтобы страница не шла одним столбом. */
  photoSide: "left" | "right";
  /** Кадр первой главы — на первом экране: ждать прокрутки ему незачем. */
  loading: "lazy" | "eager";
};

/*
 * Глава O nas (DESIGN.md, «Страница O nas»). Телефон — кадр 4:5, под ним заголовок и
 * абзацы. Десктоп — кадр до 520 и текст до 536 по центру его высоты, между ними 80: ровно
 * контейнер, как в контактах и до/после.
 */
export function AboutChapter({ chapter, lang, dict, photoSide, loading }: Props) {
  const right = photoSide === "right";

  return (
    <section className="wrap pt-14 lg:pt-24">
      <div
        className={`lg:grid lg:items-center lg:gap-x-20 ${right ? "lg:grid-cols-[minmax(0,536px)_minmax(0,520px)]" : "lg:grid-cols-[minmax(0,520px)_minmax(0,536px)]"}`}
      >
        <FramePhoto
          photo={chapter.photo}
          lang={lang}
          caption={dict.photoExample}
          loading={loading}
          className={right ? "lg:col-start-2 lg:row-start-1" : ""}
        />
        <div className={`mt-6 lg:mt-0 ${right ? "lg:col-start-1 lg:row-start-1" : ""}`}>
          <PageHeading>{glue(t(chapter.title, lang), lang)}</PageHeading>
          {chapter.paragraphs.map((paragraph) => (
            <p key={paragraph.pl} className="mt-3 text-16 leading-long lg:mt-4 lg:text-17">
              {glue(t(paragraph, lang), lang)}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
