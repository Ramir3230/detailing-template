/*
 * Расчёты объёмной машины hero без WebGL и DOM: поворот и сглаживание движения.
 */

const toRadians = Math.PI / 180;

/** Сколько цветов спектра неона берёт шейдер: длиннее theme.spectrum не пускает тест данных. */
export const SPECTRUM_MAX = 8;

/* Слой неона пола на CSS шире машины на 12% с каждой стороны (.glow-floor-spectrum) */
const FLOOR_EDGE = 12 / 124;

/**
 * Стопы градиента CSS неона пола — по ширине машины, а не слоя: холст раскладывает спектр
 * по кадру машины и за его краями держит крайний цвет, градиент — так же. Иначе при
 * смене слоя на CSS холстом цвет у краёв машины сдвигался бы.
 */
export function spectrumStops(colors: readonly string[]): string {
  const span = 1 - 2 * FLOOR_EDGE;
  return colors
    .map((color, i) => `${color} ${(100 * (FLOOR_EDGE + (span * i) / (colors.length - 1))).toFixed(2)}%`)
    .join(", ");
}

/**
 * Поворот кадра машины: сначала наклон (pitch), затем разворот (yaw), в градусах.
 * Положительный yaw уводит перед машины вправо, положительный pitch — вверх: машина
 * поворачивается к курсору. Матрица 3×3 по столбцам — так её ждёт GLSL.
 */
export function rotation(yaw: number, pitch: number): Float32Array {
  const [sy, cy] = [Math.sin(yaw * toRadians), Math.cos(yaw * toRadians)];
  const [sp, cp] = [Math.sin(pitch * toRadians), Math.cos(pitch * toRadians)];
  return new Float32Array([cy, 0, -sy, -sy * sp, cp, -cy * sp, sy * cp, sp, cy * cp]);
}

/**
 * Шаг плавного догоняния цели: за время tau проходится ~63% оставшегося пути, и от
 * частоты кадров это не зависит.
 */
export function approach(current: number, target: number, dt: number, tau: number): number {
  return target + (current - target) * Math.exp(-dt / tau);
}
