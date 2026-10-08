/*
 * Расчёты объёмной машины hero без WebGL и DOM: поворот, сглаживание движения, чтение
 * значений зажигания из вычисленных стилей.
 */

const toRadians = Math.PI / 180;

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

/** brightness() из вычисленного filter: «brightness(0.25)» → 0.25; без него — 1. */
export function brightness(filter: string): number {
  const match = /brightness\(\s*([\d.]+)(%?)\s*\)/.exec(filter);
  if (!match) return 1;
  const value = Number(match[1]);
  return match[2] ? value / 100 : value;
}

/** Вычисленный цвет «rgb(r, g, b)» или «rgba(…)» → доли 0..1; другой формат — null. */
export function rgb(color: string): [number, number, number] | null {
  const match = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(color);
  if (!match) return null;
  return [Number(match[1]) / 255, Number(match[2]) / 255, Number(match[3]) / 255];
}
