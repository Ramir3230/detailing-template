/*
 * Ширины картинок для `sizes` у next/image. До 1024 px раскладка телефона: с 688 px
 * ширины — колонка 640 px с полями 24 (--container-tablet в app/globals.css: меняются
 * вместе; DESIGN.md, «Брейкпоинты и сетка»).
 */

/* Кадр во всю ширину контента: на телефоне — экран без полей, на планшете — колонка */
const phoneWidth = "(min-width: 688px) 640px, calc(100vw - 48px)";

/** Машина hero: на телефоне — 92% экрана, на планшете — 92% колонки 688 px с полями, на
 *  десктопе — до 780 px (--container-hero-car). */
export const heroCarSizes = "(min-width: 1024px) 780px, (min-width: 688px) 633px, 92vw";

/**
 * Ширина кадра 4:5 на экране — для `sizes` у next/image: до/после, фото входа, кадры O nas. На
 * десктопе кадр до 520 px (DESIGN.md, «Фотографии»).
 */
export const frameSizes = `(min-width: 1024px) 520px, ${phoneWidth}`;

/** То же для до/после в основной колонке страницы группы: на десктопе кадр до 420 px. */
export const columnFrameSizes = `(min-width: 1024px) 420px, ${phoneWidth}`;
