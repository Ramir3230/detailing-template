/**
 * Ширина кадра 4:5 на экране — для `sizes` у next/image: до/после и фото входа. На
 * десктопе кадр до 520 px, на телефоне — экран без полей 24 px (DESIGN.md, «Фотографии»).
 */
export const frameSizes = "(min-width: 1024px) 520px, calc(100vw - 48px)";

/** То же для до/после в основной колонке страницы группы: на десктопе кадр до 420 px. */
export const columnFrameSizes = "(min-width: 1024px) 420px, calc(100vw - 48px)";
