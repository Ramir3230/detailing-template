import { FramePhoto } from "@/components/FramePhoto";
import { CheckIcon, ExternalIcon } from "@/components/icons";
import { SectionTitle } from "@/components/home/SectionTitle";
import { StudioVideo } from "@/components/home/StudioVideo";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { glue } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";

/*
 * «Почему мы» после до/после (DESIGN.md, «Почему мы»): кадр студии — фото или ролик — и
 * причины её словами. Студии без отзывов блок их заменяет: под пунктами — приглашение
 * оставить первый отзыв в Google. Телефон — одной колонкой; десктоп — кадр до 520 слева,
 * заголовок, пункты и карточка справа по центру его высоты, как у контактов.
 */
export function WhyUs({ lang, dict }: { lang: Lang; dict: Dictionary }) {
  const { whyUs } = studio;
  if (!whyUs) return null;
  const words = dict.whyUs;
  const { media } = whyUs;
  const reviewUrl = studio.reviews.length ? undefined : whyUs.reviewUrl;
  const captions = media.kind === "video" ? media.video.captions.find((item) => item.lang === lang)?.src : undefined;
  const frame = "mt-6 lg:col-start-1 lg:row-span-full lg:mt-0 lg:self-center";

  return (
    <section className="py-14 lg:border-t lg:border-line lg:py-24">
      <div className="wrap lg:grid lg:grid-cols-[minmax(0,520px)_minmax(0,536px)] lg:grid-rows-[1fr_auto_auto_auto_1fr] lg:gap-x-20">
        <div className="lg:col-start-2 lg:row-start-2">
          <SectionTitle>{words.title}</SectionTitle>
        </div>

        {media.kind === "photo" ? (
          <FramePhoto photo={media.photo} lang={lang} caption={dict.photoExample} loading="lazy" className={frame} />
        ) : (
          <figure className={frame}>
            <StudioVideo
              src={media.video.src}
              poster={{ ...media.video.poster, alt: t(media.video.poster.alt, lang) }}
              captions={captions ? { src: captions, lang, label: words.captions } : undefined}
              play={words.play}
            />
            {media.video.poster.ai && (
              <figcaption className="mt-2 text-12 leading-body text-muted">{dict.photoExample}</figcaption>
            )}
          </figure>
        )}

        <ul className="mt-6 flex flex-col gap-3 lg:col-start-2 lg:row-start-3 lg:mt-7 lg:gap-4">
          {whyUs.points.map((point) => (
            <li key={point.pl} className="flex gap-3 text-16 leading-body lg:text-17">
              {/* Галочка по центру первой строки пункта */}
              <span className="flex h-[1lh] items-center text-accent">
                <CheckIcon />
              </span>
              {glue(t(point, lang), lang)}
            </li>
          ))}
        </ul>

        {reviewUrl && (
          <div className="mt-8 rounded-card border border-line bg-surface p-6 lg:col-start-2 lg:row-start-4 lg:mt-10 lg:rounded-card-lg">
            <h3 className="text-17 leading-item font-medium">{words.firstReview.title}</h3>
            <p className="mt-2 text-15 text-balance text-muted">{glue(words.firstReview.text, lang)}</p>
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full border border-line-strong px-4 text-15 font-medium transition-colors hover:border-accent-border"
            >
              {words.firstReview.action}
              <span className="sr-only"> ({dict.newTab})</span>
              <ExternalIcon size={14} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
