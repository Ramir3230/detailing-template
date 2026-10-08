import { ExternalIcon, StarIcon } from "@/components/icons";
import { ReviewStories } from "@/components/home/ReviewStories";
import { SectionTitle } from "@/components/home/SectionTitle";
import { studio } from "@/content/studio";
import type { Dictionary } from "@/dictionaries/types";
import { formatCount, formatRating, glue } from "@/lib/format";
import { fill, t, type Lang } from "@/lib/i18n";
import { sectionIds } from "@/lib/nav";
import { storyDuration } from "@/lib/stories";

const ratingNoteId = "rating-demo-note";

/* Ссылка-строка: поле нажатия 44 px отрицательными отступами, без раздувания вёрстки. */
const ratingLinkClass =
  "-my-3 inline-flex items-center gap-1 py-3 text-14 text-muted underline decoration-accent underline-offset-4 transition-colors hover:text-fg";

export function Reviews({ lang, dict }: { lang: Lang; dict: Dictionary }) {
  if (!studio.reviews.length) return null;
  const words = dict.reviews;
  const { rating } = studio;
  const ratingText = glue(
    fill(words.inGoogle, { count: formatCount(rating.count, words.count, lang) }),
    lang,
  );

  const stories = studio.reviews.map((review) => {
    const text = glue(t(review.text, lang), lang);
    return {
      author: review.author,
      text,
      label: review.source === "google" ? words.google : words.example,
      duration: storyDuration(text),
    };
  });

  return (
    <section
      id={sectionIds.reviews}
      className="scroll-mt-16 py-14 lg:scroll-mt-0 lg:border-t lg:border-line lg:py-24"
    >
      <div className="wrap lg:flex lg:flex-wrap lg:items-center lg:gap-x-20 lg:gap-y-12">
        <div className="lg:max-w-95 lg:flex-[1_1_300px]">
          <SectionTitle>{words.title}</SectionTitle>
          <div className="mt-6 flex items-center justify-center gap-4 lg:mt-7 lg:justify-start lg:gap-5">
            <span aria-hidden="true" className="display text-40 leading-none tracking-display lg:text-64">
              {formatRating(rating.value)}
            </span>
            <div className="flex flex-col items-start gap-1 lg:gap-2">
              <div
                role="img"
                aria-label={fill(words.stars, { value: formatRating(rating.value) })}
                className="flex gap-1 text-accent"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= Math.round(rating.value) ? "" : "text-line-strong"}>
                    <StarIcon size={18} />
                  </span>
                ))}
              </div>
              {rating.url ? (
                <a href={rating.url} target="_blank" rel="noopener noreferrer" className={ratingLinkClass}>
                  {ratingText}
                  <span className="sr-only"> ({dict.newTab})</span>
                  <ExternalIcon size={14} />
                </a>
              ) : (
                /* У студии ещё нет страницы отзывов в Google: строка как у настоящей,
                   а нажатие объясняет владельцу на питче, что здесь будет его ссылка. */
                <>
                  <button type="button" popoverTarget={ratingNoteId} className={ratingLinkClass}>
                    {ratingText}
                  </button>
                  <div
                    id={ratingNoteId}
                    popover="auto"
                    className="m-auto w-80 max-w-[calc(100vw-48px)] rounded-card border border-line-strong bg-bg p-6 text-15 text-fg"
                  >
                    <p>{glue(words.demoNote, lang)}</p>
                    <button
                      type="button"
                      popoverTarget={ratingNoteId}
                      popoverTargetAction="hide"
                      className="mt-4 inline-flex min-h-11 items-center rounded-full border border-line-strong px-5 font-medium transition-colors hover:border-accent-border"
                    >
                      {words.close}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <ReviewStories
          stories={stories}
          words={{
            carousel: words.carousel,
            previous: words.previous,
            next: words.next,
            pause: words.pause,
            resume: words.resume,
            position: words.position,
          }}
        />
      </div>
    </section>
  );
}
