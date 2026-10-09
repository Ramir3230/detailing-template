/**
 * Ширина кадра 4:5 на экране — для `sizes` у next/image: до/после и фото входа. На
 * десктопе кадр до 520 px, на телефоне — экран без полей 24 px (DESIGN.md, «Фотографии»).
 */
export const frameSizes = "(min-width: 1024px) 520px, calc(100vw - 48px)";
