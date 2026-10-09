/* До 1024 px кадр во всю ширину контента: на телефоне — экран без полей 24 px, на
   планшете — колонка 640 px (DESIGN.md, «Брейкпоинты и сетка») */
const phoneWidth = "(min-width: 688px) 640px, calc(100vw - 48px)";

/**
 * Ширина кадра 4:5 на экране — для `sizes` у next/image: до/после и фото входа. На
 * десктопе кадр до 520 px (DESIGN.md, «Фотографии»).
 */
export const frameSizes = `(min-width: 1024px) 520px, ${phoneWidth}`;

/** То же для до/после в основной колонке страницы группы: на десктопе кадр до 420 px. */
export const columnFrameSizes = `(min-width: 1024px) 420px, ${phoneWidth}`;
