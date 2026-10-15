/*
 * Объёмная машина hero на WebGL2 (DESIGN.md, «Движение», «Объёмная машина»).
 *
 * Кадр машины — сетка, каждая вершина которой отодвинута на свою глубину вдоль луча
 * камеры: в покое сетка проецируется ровно в исходное фото, а при повороте ближние
 * части (бампер, зеркала) сдвигаются сильнее дальних (крыша). Карту глубины и её
 * наклоны готовит scripts/hero-car/cutout.py.
 *
 * В том же проходе рисуются слои, которые на статичной машине лежат поверх фото
 * отдельно (HeroCar): светодиоды фар, их размытый ореол и ореол каждой фары. Иначе при
 * повороте свет отставал бы от кузова.
 *
 * Под машиной — пол и неон подсветки днища, нарисованные кодом: трубки под передней
 * губой и вдоль порогов светят на пол, свет затухает с квадратом расстояния, колёса
 * заслоняют свет порогов и отбрасывают тени, глянцевый пол даёт блик трубки и отражение
 * машины. Трубки закреплены на машине: при повороте пятно света и тени поворачиваются
 * вместе с ней. Цвет — акцент темы.
 *
 * Единицы — высоты кадра машины, начало — центр кадра, z к зрителю, пол — низ кадра.
 */

import type { Headlight, Underglow } from "@/content/types";
import { SPECTRUM_MAX } from "@/lib/car-volume";

/* Камера в трёх высотах кадра от машины — перспектива около 19°, как у фото */
const CAMERA = 3;
/* Ось поворота — на этой глубине: перед машины ходит, крыша почти стоит */
const PIVOT = 0.6;
/* Пол — по низу кадра: вырезка обрезана чуть выше отражения в полу */
const FLOOR = -0.5;

/**
 * Поля холста вокруг кадра машины, в высотах кадра: по бокам и снизу — свет на полу и
 * отражение, сверху — запас на поворот. Всё нарисованное гаснет к краям холста, а не
 * обрывается ими.
 */
export const FIELD = { side: 0.24, top: 0.08, bottom: 0.6 };
/** Ячеек сетки по ширине кадра: ячейка ~5 px машины на десктопе. */
const GRID = 160;
/* Свет пола — в половинном разрешении холста */
const FLOOR_SCALE = 0.5;

/*
 * Подсветка в машинных координатах, в высотах кадра; размеры машины — как у настоящей:
 * кадр в высоту ~1,4 м. Трубка — чуть позади губы и над полом, колёса — в полуметре
 * за губой, пороги тянутся от передних колёс назад
 */
const TUBE_BEHIND_LIP = 0.08;
const TUBE_HEIGHT = 0.1;
const WHEEL_BEHIND_LIP = 0.55;
/* Половина пятна шины на высоте трубки по глубине: свет идёт низко над полом */
const WHEEL_HALF_DEPTH = 0.17;
const SILL_LENGTH = 1.8;
/*
 * Отсвет неона на кузове даёт освещённый пол перед губой, а не сама трубка под ней:
 * передние грани кузова смотрят на пол перед машиной. Источник — полоса по ширине
 * трубки впереди губы и чуть ниже пола, чтобы светить снизу. Без underglow (неон на
 * CSS) — по ширине трубки M3, под которую отсвет подбирался
 */
const BOUNCE_AHEAD_OF_LIP = 0.17;
const BOUNCE_BELOW_FLOOR = 0.05;
const BOUNCE_SPAN = [15, 85] as const;
/** Видимость ореола фар у машины без halo в данных — копия .ignite-headlight. */
const HALO = 0.85;

export type Layers = {
  /** Фото машины, светодиоды фар — те же <img>, что показывает страница. */
  color: HTMLImageElement;
  lights: HTMLImageElement;
  /** Карта объёма: три серые панели одна под другой. */
  map: HTMLImageElement;
};

export type Frame = {
  /** Поворот, rotation() из lib/car-volume, и его разворот в градусах — для подсветки. */
  rotation: Float32Array;
  yaw: number;
  /** Глубина рельефа, в высотах кадра. */
  depth: number;
  /** Рисовать машину: холст подменил фото. Без неё — только пол и отражение. */
  car: boolean;
  /** Отсвет неона на кузове. */
  light: number;
  /** Неон на полу: зажигание × яркость; 0 — не рисовать. */
  neon: number;
  /** С какой доли высоты низ машины растворяется в полу, как у фото: .fade-bottom. */
  fade: number;
  /** Глянец пола 0..1: от матового бетона до зеркальной эпоксидки. */
  gloss: number;
  /** Сила отражения машины в полу; 0 — без отражения. */
  reflection: number;
};

export type Volume = {
  /** Размер холста в пикселях устройства и ширина машины в CSS-пикселях. */
  resize(width: number, height: number, carCssWidth: number): void;
  /** Фото, фары и карта загружены: дальше рисуются машина и её отражение. */
  setCar(layers: Layers): void;
  /** Браузер сменил кандидата из srcset — заново взять фото и фары. */
  refresh(): void;
  /**
   * Что нарисовано: неон на полу (программы собраны — холст отвечает за неон, даже пока
   * вспышка на нуле) и машина. carReady — программа машины собрана: рисуются машина и её
   * отражение. waiting — программы ещё собираются, кадр надо повторить. Бросает
   * исключение, если шейдер не собрался.
   */
  draw(frame: Frame): { floor: boolean; car: boolean; carReady: boolean; waiting: boolean };
  destroy(): void;
};

/* Холст в координатах кадра: центр и половины размеров */
const frameCenterY = (FIELD.top - FIELD.bottom) / 2;
const frameHalfY = 0.5 + (FIELD.top + FIELD.bottom) / 2;
const constants = /* glsl */ `
const float CAMERA = ${CAMERA.toFixed(3)};
const float PIVOT = ${PIVOT.toFixed(3)};
const float FLOOR = ${FLOOR.toFixed(3)};
`;

const carVertex = /* glsl */ `#version 300 es
uniform sampler2D uMap;
uniform mat3 uRotation;
uniform float uAspect;
uniform float uDepth;
uniform float uPanel;
uniform vec4 uFrame;
uniform bool uMirror;
in vec2 aUv;
out vec2 vUv;
out vec3 vPosition;
out float vHeight;
${constants}
void main() {
  vUv = aUv;
  float depth = textureLod(uMap, vec2(aUv.x, clamp(aUv.y, uPanel, 1.0 - uPanel) / 3.0), 0.0).r;
  float z = (depth - PIVOT) * uDepth;
  vec2 plane = vec2((aUv.x - 0.5) * uAspect, 0.5 - aUv.y);
  // Точка на луче камеры через пиксель фото: в покое проецируется ровно в него
  vec3 position = uRotation * vec3(plane * (CAMERA - z) / CAMERA, z);
  vHeight = position.y - FLOOR;
  // Отражение в полу — та же машина, зеркально под полом
  if (uMirror) position.y = 2.0 * FLOOR - position.y;
  vPosition = position;
  float w = (CAMERA - position.z) / CAMERA;
  gl_Position = vec4((position.xy - uFrame.xy * w) / uFrame.zw, -position.z * w * 0.5, w);
}
`;

/*
 * Цвет неона вдоль машины (theme.spectrum, DESIGN.md, «Спектр неона»): цвета sRGB слева
 * направо по ширине кадра машины; без спектра — один цвет, акцент темы. Соседние цвета
 * смешиваются в sRGB, как у градиента CSS в .glow-floor-spectrum.
 */
const spectrumGlsl = /* glsl */ `
uniform vec3 uSpectrum[${SPECTRUM_MAX}];
uniform int uStops;

// Цвет неона в доле t ширины кадра машины, sRGB
vec3 neonAt(float t) {
  if (uStops < 2) return uSpectrum[0];
  float x = clamp(t, 0.0, 1.0) * float(uStops - 1);
  int i = min(int(x), uStops - 2);
  return mix(uSpectrum[i], uSpectrum[i + 1], x - float(i));
}

// sRGB в линейный свет — для пола, который считает свет физически
vec3 linearOf(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}
`;

const carFragment = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uLights;
uniform sampler2D uMap;
uniform mat3 uRotation;
uniform float uAspect;
uniform float uDepth;
uniform float uPanel;
uniform float uLight;
// Источник отсвета неона: x левого и правого края, высота, глубина (BOUNCE_*)
uniform vec4 uBounce;
uniform vec2 uBloomStep;
uniform float uBloomLod;
uniform vec3 uHeadlights[2];
uniform float uHalo;
uniform bool uMirror;
uniform float uFade;
uniform float uReflection;
uniform float uGloss;
uniform vec2 uResolution;
in vec2 vUv;
in vec3 vPosition;
in float vHeight;
out vec4 outColor;
${constants}
${spectrumGlsl}
// Наклон в карте — от −SLOPE до SLOPE: DEPTH_SLOPE в scripts/hero-car/cutout.py
const float SLOPE = 8.0;
// Сдвиг мип-уровня к резкости: браузер уменьшает картинку чётче, чем смесь мип-уровней,
// и без сдвига машина при подмене заметно смягчалась
const float SHARPEN = -0.75;
// Отсвет неона на низе кузова: высота, на которой он слабеет в e раз, и сила
const float RIM_HEIGHT = 0.04;
const float RIM = 0.9;

float slope(float panel) {
  vec2 uv = vec2(vUv.x, (clamp(vUv.y, uPanel, 1.0 - uPanel) + panel) / 3.0);
  return (texture(uMap, uv).r * 255.0 - 128.0) / 127.0 * SLOPE;
}

// Смешивание screen для цветов с premultiplied alpha
vec4 screen(vec4 below, vec4 above) {
  return below + above - below * above;
}

// Ореол фары — .glow-headlight и .ignite-headlight из app/globals.css: эллипс вдвое
// шире светодиодов и вдвое ниже своей ширины, белое ядро в холодный голубой,
// видимость uHalo (HALO или halo машины). Стопы в premultiplied alpha: градиент CSS
// смешивает их так же
vec4 halo(vec3 lamp) {
  float t = length((vUv - lamp.xy) / vec2(lamp.z, lamp.z * uAspect / 2.0));
  vec4 core = vec4(1.0);
  vec4 near = vec4(vec3(215.0, 230.0, 255.0) / 255.0 * 0.8, 0.8);
  vec4 mid = vec4(vec3(160.0, 190.0, 255.0) / 255.0 * 0.4, 0.4);
  vec4 far = vec4(vec3(120.0, 150.0, 255.0) / 255.0 * 0.1, 0.1);
  vec4 color;
  if (t < 0.22) color = mix(core, near, t / 0.22);
  else if (t < 0.5) color = mix(near, mid, (t - 0.22) / 0.28);
  else if (t < 0.8) color = mix(mid, far, (t - 0.5) / 0.3);
  else color = mix(far, vec4(0.0), min((t - 0.8) / 0.2, 1.0));
  return color * uHalo;
}

void main() {
  // Отражение размыто тем сильнее, чем матовее пол
  float blur = uMirror ? mix(4.5, 1.0, uGloss) : 0.0;
  vec4 color = texture(uColor, vUv, SHARPEN + blur);
  // Кузов растворяется в полу, как .fade-bottom: с uFade высоты до низа
  color *= clamp((1.0 - vUv.y) / (1.0 - uFade), 0.0, 1.0);

  if (uLight > 0.0 && color.a > 0.0) {
    vec3 normal = normalize(uRotation * vec3(
      -uDepth * slope(1.0) / uAspect,
      uDepth * slope(2.0),
      1.0
    ));
    // Освещённый пол перед губой — ближайшая точка полосы
    vec3 source = vec3(clamp(vPosition.x, uBounce.x, uBounce.y), uBounce.zw);
    vec3 toLight = source - (uMirror ? vec3(vPosition.x, 2.0 * FLOOR - vPosition.y, vPosition.z) : vPosition);
    float reach = length(toLight);
    float lit = max(dot(normal, toLight / reach), 0.0) / (1.0 + 6.0 * reach * reach);
    // Светлая краска отражает больше тёмного стекла и шин
    float albedo = dot(color.rgb / color.a, vec3(0.2126, 0.7152, 0.0722));
    // Цвет неона там, откуда идёт свет: у спектра левый край кузова светится иначе правого
    vec3 neon = neonAt(0.5 + source.x / uAspect);
    color = screen(color, vec4(neon * (uLight * lit * (0.4 + 0.6 * albedo) * color.a), 0.0));
    // Низ кузова у самого пола освещён снизу: губа, воздухозаборники, края колёс
    float rim = exp(-max(vHeight, 0.0) / RIM_HEIGHT);
    color = screen(color, vec4(neon * (uLight * RIM * rim * (0.5 + 0.5 * albedo) * color.a), 0.0));
  }

  // Ореол светодиодов, как .lights-bloom: размытие, затем яркость 1,5
  vec4 bloom = vec4(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      float weight = (x == 0 ? 2.0 : 1.0) * (y == 0 ? 2.0 : 1.0);
      bloom += weight * textureLod(uLights, vUv + vec2(x, y) * uBloomStep, uBloomLod + blur);
    }
  }
  bloom /= 16.0;
  bloom.rgb = min(bloom.rgb / max(bloom.a, 1e-4) * 1.5, 1.0) * bloom.a;
  color = screen(color, bloom);
  color = screen(color, texture(uLights, vUv, SHARPEN + blur));
  color = screen(color, halo(uHeadlights[0]));
  color = screen(color, halo(uHeadlights[1]));

  if (uMirror) {
    // Отражение сильнее под скользящим взглядом (Френель, эпоксидка) и гаснет с высотой
    // точки над полом — тем быстрее, чем матовее пол. К краям холста — в ноль
    vec3 view = normalize(vec3(0.0, 0.0, CAMERA) - vPosition);
    float fresnel = 0.04 + 0.96 * pow(1.0 - abs(view.y), 5.0);
    float fade = exp(-vHeight * mix(9.0, 2.5, uGloss));
    vec2 edge = gl_FragCoord.xy / uResolution;
    float vignette = smoothstep(0.0, 0.18, edge.y) * smoothstep(0.0, 0.1, edge.x) * smoothstep(0.0, 0.1, 1.0 - edge.x);
    color *= uReflection * fresnel * fade * vignette;
  }

  if (color.a < 1.0 / 255.0) discard;
  outColor = color;
}
`;

const floorVertex = /* glsl */ `#version 300 es
void main() {
  // Один треугольник на весь холст
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}
`;

const floorFragment = /* glsl */ `#version 300 es
precision highp float;
uniform vec4 uFrame;
uniform vec2 uResolution;
// Разворот машины: cos и sin
uniform vec2 uYaw;
uniform float uNeon;
uniform float uGloss;
// Трубка под губой: x левого и правого концов, z, высота
uniform vec4 uTube;
// Трубки порогов: x левой и правой, z от и до; высота — как у трубки под губой
uniform vec4 uSill;
// Колёса: x, полуширина, z, полуглубина
uniform vec4 uWheels[2];
// Трубка под губой на экране — для дымки: концы в координатах кадра
uniform vec4 uHaze;
// Кузов в координатах машины: полуширина и губа
uniform vec2 uBody;
out vec4 outColor;
${constants}
${spectrumGlsl}
const float PI = 3.14159265;
const int SHADOW_SAMPLES = 8;
// Щель под передней губой, в высотах кадра (~5 см)
const float GAP = 0.035;
// Как глубоко под машину виден освещённый пол — через щель под бампером
const float UNDER_DEPTH = 0.55;
// Свет из-под машины: высота над полом, ширина в долях кузова, сила
const vec3 BOUNCE[3] = vec3[3](vec3(0.035, 0.9, 0.8), vec3(0.14, 1.0, 0.5), vec3(0.34, 1.12, 0.3));
// Пол тёмный, как бетон или эпоксидка
const float ALBEDO = 0.2;
const float EXPOSURE = 1.5;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

// Фактура пола: два слоя шума под разными углами — без сетки ячеек одного слоя
float grainOf(vec2 p) {
  vec2 turned = mat2(0.8, -0.6, 0.6, 0.8) * p;
  return noise(p * 38.0) * 0.55 + noise(turned * 131.0 + 17.0) * 0.45;
}

// Отрезок от a до b в плоскости пола проходит через пятно шины
bool blocked(vec2 a, vec2 b, vec4 wheel) {
  vec2 low = vec2(wheel.x - wheel.y, wheel.z - wheel.w);
  vec2 high = vec2(wheel.x + wheel.y, wheel.z + wheel.w);
  vec2 d = b - a;
  vec2 inv = 1.0 / (d + vec2(1e-6));
  vec2 t0 = (low - a) * inv;
  vec2 t1 = (high - a) * inv;
  float enter = max(min(t0.x, t1.x), min(t0.y, t1.y));
  float leave = min(max(t0.x, t1.x), max(t0.y, t1.y));
  return enter < leave && leave > 0.0 && enter < 1.0;
}

// Освещённость пола от отрезка трубки a–b: интеграл cos/r² вдоль трубки — точно, без
// пунктира от отдельных точек
float lineDiffuse(vec3 p, vec3 a, vec3 b) {
  vec3 d = a - p;
  vec3 s = b - a;
  float al = dot(d, d);
  float be = dot(d, s);
  float ga = dot(s, s);
  float det = max(al * ga - be * be, 1e-8);
  return d.y * sqrt(ga) / det * ((ga + be) * inversesqrt(al + 2.0 * be + ga) - be * inversesqrt(al));
}

// Блик трубки на глянце (GGX): берётся точка трубки, ближайшая к отражённому лучу, — так
// считают трубчатые лампы в реальном времени. Свет копится с куска трубки шириной
// в лепесток блика
float lineGlint(vec3 p, vec3 view, vec3 a, vec3 b, float alpha, float radius) {
  vec3 r = vec3(-view.x, view.y, -view.z);
  vec3 l0 = a - p;
  vec3 ld = b - a;
  float rld = dot(r, ld);
  float t = clamp((dot(r, l0) * rld - dot(l0, ld)) / max(dot(ld, ld) - rld * rld, 1e-8), 0.0, 1.0);
  vec3 toLamp = l0 + t * ld;
  float r2 = dot(toLamp, toLamp);
  vec3 l = toLamp * inversesqrt(r2);
  float nl = max(l.y, 0.0);
  vec3 h = normalize(l + view);
  float nh = max(h.y, 0.0);
  // Источник с размером размывает блик: шероховатость растёт, энергия сохраняется
  float wide = min(1.0, alpha + radius * inversesqrt(r2) / 2.0);
  float a2 = wide * wide;
  float distribution = a2 / (PI * pow(nh * nh * (a2 - 1.0) + 1.0, 2.0)) * pow(alpha / wide, 2.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - max(dot(h, view), 0.0), 5.0);
  float nv = max(view.y, 1e-3);
  float k = wide / 2.0;
  float geometry = 1.0 / ((nl * (1.0 - k) + k) * (nv * (1.0 - k) + k));
  float width = min(length(ld), 2.0 * wide * sqrt(r2) + 0.01);
  return distribution * fresnel * geometry / 4.0 * nl / r2 * width;
}

// Доля трубки, видимой из точки пола мимо колёс. Точки трубки — со своим сдвигом в
// каждом пикселе: край тени выходит мягким зерном, а не ступеньками
float visibility(vec3 p, vec3 a, vec3 b) {
  float jitter = hash(gl_FragCoord.xy + a.xz * 91.0);
  float seen = 0.0;
  for (int i = 0; i < SHADOW_SAMPLES; i++) {
    vec3 q = mix(a, b, (float(i) + jitter) / float(SHADOW_SAMPLES));
    if (!blocked(q.xz, p.xz, uWheels[0]) && !blocked(q.xz, p.xz, uWheels[1])) seen += 1.0;
  }
  return seen / float(SHADOW_SAMPLES);
}

void main() {
  vec2 edge = gl_FragCoord.xy / uResolution;
  vec2 screen = uFrame.xy + (edge * 2.0 - 1.0) * uFrame.zw;
  vec3 light = vec3(0.0);

  if (screen.y < -1e-3) {
    // Луч из камеры через точку кадра до пола
    vec3 eye = vec3(0.0, 0.0, CAMERA);
    vec3 hit = eye + FLOOR / screen.y * vec3(screen, -CAMERA);
    // В координаты машины: обратный разворот вокруг вертикали
    vec3 p = vec3(hit.x * uYaw.x - hit.z * uYaw.y, FLOOR, hit.x * uYaw.y + hit.z * uYaw.x);
    vec3 e = vec3(eye.x * uYaw.x - eye.z * uYaw.y, 0.0, eye.x * uYaw.y + eye.z * uYaw.x);
    vec3 view = normalize(e - p);

    // Фактура пола: чуть разная шероховатость и тон
    float grain = grainOf(p.xz);
    float rough = clamp(mix(0.55, 0.07, uGloss) * (0.85 + 0.3 * grain), 0.03, 1.0);

    float alpha = rough * rough;
    // Прямой свет трубки: бампер заслоняет её от пола впереди, свет проходит только
    // через щель под губой — яркая полоска у самой губы
    vec3 front0 = vec3(uTube.x, uTube.w, uTube.z);
    vec3 front1 = vec3(uTube.y, uTube.w, uTube.z);
    float ahead = max(p.z - uBody.y, 0.0);
    float rayAtLip = (uTube.w - FLOOR) * ahead / max(p.z - uTube.z, 1e-3);
    float gap = 1.0 - smoothstep(GAP * 0.5, GAP * 1.6, rayAtLip);
    float diffuse = lineDiffuse(p, front0, front1) * gap;
    float glint = lineGlint(p, view, front0, front1, alpha, 0.02) * gap;
    // Свет, отражённый между днищем и полом, выходит из-под губы широко и мягко: стопка
    // источников у губы, чем выше — тем шире и слабее; концы пятна от этого мягкие
    for (int i = 0; i < 3; i++) {
      vec3 stack = BOUNCE[i];
      vec3 left = vec3(-uBody.x * stack.y, FLOOR + stack.x, uBody.y);
      vec3 right = vec3(uBody.x * stack.y, FLOOR + stack.x, uBody.y);
      diffuse += stack.z * lineDiffuse(p, left, right);
      glint += stack.z * lineGlint(p, view, left, right, alpha, stack.x);
    }
    for (int side = -1; side <= 1; side += 2) {
      float sillX = side < 0 ? uSill.x : uSill.y;
      vec3 sill0 = vec3(sillX, uTube.w, uSill.z);
      vec3 sill1 = vec3(sillX, uTube.w, uSill.w);
      // Бампер заслоняет и пороги: впереди губы их свет доходит только через щель. Сбоку
      // от кузова бампера нет
      float sillAtLip = (uTube.w - FLOOR) * ahead / max(p.z - uSill.z, 1e-3);
      float bumper = 1.0 - smoothstep(uBody.x - 0.05, uBody.x + 0.05, abs(p.x));
      float seen = visibility(p, sill0, sill1) * (1.0 - bumper * smoothstep(GAP * 0.5, GAP * 1.6, sillAtLip));
      diffuse += lineDiffuse(p, sill0, sill1) * seen;
      glint += lineGlint(p, view, sill0, sill1, alpha, 0.05) * seen;
    }
    // Под машиной пол виден только в щели под бампером — сквозь растворённый срез кадра.
    // Там и самое яркое: трубка прямо над ним. Глубже под машину взгляд не достаёт
    float under = (1.0 - smoothstep(uBody.y - UNDER_DEPTH - 0.3, uBody.y - UNDER_DEPTH, p.z))
      * (1.0 - smoothstep(uBody.x - 0.05, uBody.x, abs(p.x)));
    diffuse *= 1.0 - under;
    glint *= 1.0 - under;
    // Цвет — неона напротив точки пола: у спектра он меняется вдоль машины, сбоку от
    // кузова — крайний
    light = linearOf(neonAt(0.5 + p.x / (2.0 * uBody.x))) * (diffuse * ALBEDO / PI * (0.9 + 0.2 * grain) + glint);
  }

  // Дымка: свет трубки, рассеянный в воздухе у пола. Цвет — точки трубки напротив
  vec2 ab = uHaze.zw - uHaze.xy;
  float along = clamp(dot(screen - uHaze.xy, ab) / dot(ab, ab), 0.0, 1.0);
  float d = length(screen - uHaze.xy - ab * along);
  vec3 haze = linearOf(neonAt(0.5 + mix(uTube.x, uTube.y, along) / (2.0 * uBody.x)));
  light += haze * (0.9 * exp(-pow(d / 0.035, 2.0)) + 0.12 / (1.0 + pow(d / 0.09, 2.0)));

  // Экспозиция: яркое уходит в белое само, как у снимка неона; затем sRGB
  vec3 color = 1.0 - exp(-light * uNeon * EXPOSURE);
  color = pow(color, vec3(1.0 / 2.2));
  // К краям холста — в ноль, без обрывов
  float vignette = smoothstep(0.0, 0.16, edge.x) * smoothstep(0.0, 0.16, 1.0 - edge.x)
    * smoothstep(0.0, 0.22, edge.y) * smoothstep(0.0, 0.1, 1.0 - edge.y);
  color *= vignette;
  outColor = vec4(color, max(color.r, max(color.g, color.b)));
}
`;

/* Свет пола считается в половинном разрешении — он плавный, разницы не видно, а работы
   вчетверо меньше, — и растягивается на холст. Шум против полос на тёмном градиенте —
   уже здесь, в полном разрешении */
const stretchFragment = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uFloor;
uniform vec2 uResolution;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 color = texture(uFloor, gl_FragCoord.xy / uResolution).rgb;
  float lit = step(1.0 / 255.0, max(color.r, max(color.g, color.b)));
  color = max(color + (hash(gl_FragCoord.xy) - 0.5) / 255.0 * lit, 0.0);
  outColor = vec4(color, max(color.r, max(color.g, color.b)));
}
`;

type Linking = { program: WebGLProgram; ready(): boolean; dispose(): void };

/*
 * Сборка программы. С расширением KHR_parallel_shader_compile браузер собирает её в
 * фоне, а ready() только спрашивает, готова ли: главный поток не встаёт посреди
 * зажигания. Без расширения ready() ждёт сборку. Не собралась — исключение из ready()
 * с журналом компилятора. dispose() удаляет программу вместе с шейдерами, даже если
 * ready() до конца так и не дошёл.
 */
function startLink(
  gl: WebGL2RenderingContext,
  parallel: KHR_parallel_shader_compile | null,
  vertex: string,
  fragment: string,
): Linking {
  const program = gl.createProgram();
  const sources = [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const;
  const shaders = sources.map(([type, source]) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("createShader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    return shader;
  });
  gl.linkProgram(program);
  let done = false;
  // Несобранная программа отвечает исключением на каждый вопрос, а не «готова» со второго
  let failed: Error | null = null;
  let shadersFreed = false;
  const freeShaders = () => {
    if (shadersFreed) return;
    shadersFreed = true;
    for (const shader of shaders) {
      gl.detachShader(program, shader);
      gl.deleteShader(shader);
    }
  };
  return {
    program,
    ready() {
      if (failed) throw failed;
      if (done) return true;
      if (parallel && !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) return false;
      const linked = Boolean(gl.getProgramParameter(program, gl.LINK_STATUS));
      const log = linked
        ? ""
        : [...shaders.map((shader) => gl.getShaderInfoLog(shader)), gl.getProgramInfoLog(program)].join("\n");
      // Собранной программе шейдеры больше не нужны
      freeShaders();
      if (!linked) {
        failed = new Error(log || "linkProgram");
        throw failed;
      }
      done = true;
      return true;
    },
    dispose() {
      // Программу, которая ещё собирается в фоне, сначала дособрать: удалённая посреди
      // сборки, она сыплет в консоль ошибками GL (StrictMode, уход со страницы)
      gl.getProgramParameter(program, gl.LINK_STATUS);
      freeShaders();
      gl.deleteProgram(program);
    },
  };
}

/* Фото — с premultiplied alpha и мип-уровнями (машина на экране меньше файла, а ореол
   и отражение берутся с грубых уровней). Карта — данные: как есть, без цветокоррекции. */
function upload(
  gl: WebGL2RenderingContext,
  unit: number,
  texture: WebGLTexture,
  source: HTMLImageElement,
  kind: "photo" | "data",
) {
  const photo = kind === "photo";
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, photo);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, photo ? gl.BROWSER_DEFAULT_WEBGL : gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, photo ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  if (photo) gl.generateMipmap(gl.TEXTURE_2D);
}

/* Сетка в координатах кадра 0..1, v сверху вниз — как у текстур */
function grid(gl: WebGL2RenderingContext, program: WebGLProgram, aspect: number) {
  const columns = GRID;
  const rows = Math.round(GRID / aspect);
  const uv = new Float32Array((columns + 1) * (rows + 1) * 2);
  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      const i = (row * (columns + 1) + column) * 2;
      uv[i] = column / columns;
      uv[i + 1] = row / rows;
    }
  }
  const index = new Uint16Array(columns * rows * 6);
  for (let row = 0, i = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++, i += 6) {
      const a = row * (columns + 1) + column;
      const b = a + columns + 1;
      index.set([a, b, a + 1, a + 1, b, b + 1], i);
    }
  }
  const vao = gl.createVertexArray();
  const buffers = [gl.createBuffer(), gl.createBuffer()];
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers[0]);
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, "aUv");
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[1]);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return { count: index.length, vao, buffers };
}

/* Цвет темы для расчёта света — в линейных долях */
/**
 * Готовит сцену. Программы пола собираются сразу, ещё до фото, — неон на полу горит с
 * самого зажигания; программа машины — в setCar, когда сцена отыграла. Не собравшийся
 * шейдер бросает исключение из draw: страница остаётся со статичной машиной и неоном на
 * CSS.
 */
export function createVolume(
  gl: WebGL2RenderingContext,
  {
    aspect,
    spectrum,
    headlights,
    underglow,
    halo = HALO,
  }: {
    aspect: number;
    /** Цвета неона sRGB 0..1 слева направо; один — акцент темы. */
    spectrum: readonly (readonly [number, number, number])[];
    headlights: readonly Headlight[];
    underglow?: Underglow;
    halo?: number;
  },
): Volume {
  const parallel = gl.getExtension("KHR_parallel_shader_compile");
  const floorLink = startLink(gl, parallel, floorVertex, floorFragment);
  const stretchLink = startLink(gl, parallel, floorVertex, stretchFragment);
  let carLink: Linking | null = null;
  const floorTexture = gl.createTexture();
  const floorBuffer = gl.createFramebuffer();
  const empty = gl.createVertexArray();
  const [color, lights, map] = [gl.createTexture(), gl.createTexture(), gl.createTexture()];
  let mesh: ReturnType<typeof grid> | null = null;
  let layers: Layers | null = null;
  let size = [0, 0];
  let floorSize = [0, 0];
  let carCssWidth = 0;

  const frame = [0, frameCenterY, aspect / 2 + FIELD.side, frameHalfY] as const;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  /* Спектр неона — в обе программы: свет пола и отсвет на кузове */
  const stops = spectrum.slice(0, SPECTRUM_MAX);
  const setSpectrum = (program: WebGLProgram) => {
    gl.uniform3fv(gl.getUniformLocation(program, "uSpectrum"), stops.flat());
    gl.uniform1i(gl.getUniformLocation(program, "uStops"), stops.length);
  };

  /* Программы пола готовы — один раз задать то, что не меняется */
  type FloorUniform = "resolution" | "yaw" | "neon" | "gloss" | "tube" | "sill" | "wheels" | "haze" | "body" | "stretch";
  let floorUniforms: Record<FloorUniform, WebGLUniformLocation | null> | null = null;
  const floorReady = () => {
    if (floorUniforms) return true;
    if (!floorLink.ready() || !stretchLink.ready()) return false;
    const at = (name: string) => gl.getUniformLocation(floorLink.program, name);
    gl.useProgram(floorLink.program);
    gl.uniform4f(at("uFrame"), ...frame);
    setSpectrum(floorLink.program);
    gl.useProgram(stretchLink.program);
    gl.uniform1i(gl.getUniformLocation(stretchLink.program, "uFloor"), 3);
    floorUniforms = {
      resolution: at("uResolution"),
      yaw: at("uYaw"),
      neon: at("uNeon"),
      gloss: at("uGloss"),
      tube: at("uTube"),
      sill: at("uSill"),
      wheels: at("uWheels"),
      haze: at("uHaze"),
      body: at("uBody"),
      stretch: gl.getUniformLocation(stretchLink.program, "uResolution"),
    };
    return true;
  };

  /* Программа машины готова — сетка и постоянные значения */
  type CarUniform =
    | "rotation"
    | "depth"
    | "light"
    | "bounce"
    | "mirror"
    | "fade"
    | "reflection"
    | "gloss"
    | "resolution"
    | "bloomStep"
    | "bloomLod";
  let carUniforms: Record<CarUniform, WebGLUniformLocation | null> | null = null;
  // Размытие ореола светодиодов — 6 CSS-пикселей, как blur(6px) у .lights-bloom
  const bloom = () => {
    if (!carCssWidth || !layers || !carUniforms || !carLink) return;
    const sigma = 6 / carCssWidth;
    gl.useProgram(carLink.program);
    gl.uniform2f(carUniforms.bloomStep, sigma, sigma * aspect);
    gl.uniform1f(carUniforms.bloomLod, Math.max(0, Math.log2(sigma * layers.lights.naturalWidth)));
  };
  const carReady = () => {
    if (carUniforms) return true;
    if (!carLink || !layers || !carLink.ready()) return false;
    const program = carLink.program;
    const at = (name: string) => gl.getUniformLocation(program, name);
    mesh = grid(gl, program, aspect);
    gl.useProgram(program);
    gl.uniform1i(at("uColor"), 0);
    gl.uniform1i(at("uLights"), 1);
    gl.uniform1i(at("uMap"), 2);
    gl.uniform1f(at("uAspect"), aspect);
    setSpectrum(program);
    gl.uniform3fv(at("uHeadlights"), headlights.flatMap(({ x, y, w }) => [x / 100, y / 100, w / 100]));
    gl.uniform1f(at("uHalo"), halo);
    gl.uniform4f(at("uFrame"), ...frame);
    // Полтексела панели: выборка у её края не заглядывает в соседнюю
    gl.uniform1f(at("uPanel"), 0.5 / (layers.map.naturalHeight / 3));
    carUniforms = {
      rotation: at("uRotation"),
      depth: at("uDepth"),
      light: at("uLight"),
      bounce: at("uBounce"),
      mirror: at("uMirror"),
      fade: at("uFade"),
      reflection: at("uReflection"),
      gloss: at("uGloss"),
      resolution: at("uResolution"),
      bloomStep: at("uBloomStep"),
      bloomLod: at("uBloomLod"),
    };
    bloom();
    return true;
  };

  const photos = () => {
    if (!layers) return;
    upload(gl, 0, color, layers.color, "photo");
    upload(gl, 1, lights, layers.lights, "photo");
  };

  /* Подсветка в машинных координатах: губа машины — на её ближайшей глубине */
  const x = (percent: number) => (percent / 100 - 0.5) * aspect;
  const half = (percent: number) => (percent / 200) * aspect;
  const glow = (depth: number, yaw: number) => {
    if (!underglow) return null;
    const lip = (1 - PIVOT) * depth;
    const [left, right] = underglow.wheels;
    const wheelZ = lip - WHEEL_BEHIND_LIP;
    const wheels = [left, right].flatMap(({ x: at, w }) => [x(at), half(w), wheelZ, WHEEL_HALF_DEPTH]);
    const tubeZ = lip - TUBE_BEHIND_LIP;
    const tubeY = FLOOR + TUBE_HEIGHT;
    // Трубка под губой на экране: разворот, затем перспектива
    const [cos, sin] = [Math.cos((yaw * Math.PI) / 180), Math.sin((yaw * Math.PI) / 180)];
    const project = (px: number) => {
      const wx = px * cos + tubeZ * sin;
      const wz = -px * sin + tubeZ * cos;
      const scale = CAMERA / (CAMERA - wz);
      return [wx * scale, tubeY * scale];
    };
    return {
      yaw: [cos, sin],
      tube: [x(underglow.tube[0]), x(underglow.tube[1]), tubeZ, tubeY],
      // Пороги — по внутреннему краю своего колеса, от колёс назад
      sill: [
        x(left.x) + half(left.w),
        x(right.x) - half(right.w),
        wheelZ - WHEEL_HALF_DEPTH,
        wheelZ - WHEEL_HALF_DEPTH - SILL_LENGTH,
      ],
      wheels,
      haze: [...project(x(underglow.tube[0])), ...project(x(underglow.tube[1]))],
      body: [aspect / 2, lip],
    };
  };

  return {
    resize(width, height, cssWidth) {
      gl.viewport(0, 0, width, height);
      size = [width, height];
      floorSize = [Math.ceil(width * FLOOR_SCALE), Math.ceil(height * FLOOR_SCALE)];
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, floorTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, floorSize[0], floorSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, floorBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, floorTexture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      carCssWidth = cssWidth;
      bloom();
    },
    setCar(loaded) {
      layers = loaded;
      photos();
      upload(gl, 2, map, loaded.map, "data");
      carLink = startLink(gl, parallel, carVertex, carFragment);
    },
    refresh() {
      photos();
      bloom();
    },
    draw(state) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const scene = glow(state.depth, state.yaw);
      const floor = Boolean(scene) && floorReady();
      // Холст ещё не мерили — пол рисовать некуда
      if (scene && floor && floorUniforms && state.neon > 0 && floorSize[0] > 0) {
        gl.disable(gl.DEPTH_TEST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, floorBuffer);
        gl.viewport(0, 0, floorSize[0], floorSize[1]);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(floorLink.program);
        gl.bindVertexArray(empty);
        gl.uniform2f(floorUniforms.resolution, floorSize[0], floorSize[1]);
        gl.uniform2f(floorUniforms.yaw, scene.yaw[0], scene.yaw[1]);
        gl.uniform1f(floorUniforms.neon, state.neon);
        gl.uniform1f(floorUniforms.gloss, state.gloss);
        gl.uniform4fv(floorUniforms.tube, scene.tube);
        gl.uniform4fv(floorUniforms.sill, scene.sill);
        gl.uniform4fv(floorUniforms.wheels, scene.wheels);
        gl.uniform4fv(floorUniforms.haze, scene.haze);
        gl.uniform2fv(floorUniforms.body, scene.body);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, size[0], size[1]);
        gl.useProgram(stretchLink.program);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, floorTexture);
        gl.uniform2f(floorUniforms.stretch, size[0], size[1]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      const carProgram = carReady();
      const waiting = (Boolean(scene) && !floor) || (Boolean(carLink) && !carProgram);
      if (!carProgram || !carLink || !carUniforms || !mesh) {
        return { floor, car: false, carReady: false, waiting };
      }
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(carLink.program);
      gl.bindVertexArray(mesh.vao);
      gl.uniformMatrix3fv(carUniforms.rotation, false, state.rotation);
      gl.uniform1f(carUniforms.depth, state.depth);
      gl.uniform1f(carUniforms.light, state.light);
      const [from, to] = underglow?.tube ?? BOUNCE_SPAN;
      const lip = (1 - PIVOT) * state.depth;
      gl.uniform4f(carUniforms.bounce, x(from), x(to), FLOOR - BOUNCE_BELOW_FLOOR, lip + BOUNCE_AHEAD_OF_LIP);
      gl.uniform1f(carUniforms.gloss, state.gloss);
      gl.uniform1f(carUniforms.fade, state.fade);
      gl.uniform2f(carUniforms.resolution, size[0], size[1]);
      if (state.reflection > 0) {
        gl.uniform1i(carUniforms.mirror, 1);
        gl.uniform1f(carUniforms.reflection, state.reflection);
        gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
        gl.clear(gl.DEPTH_BUFFER_BIT);
      }
      if (state.car) {
        gl.uniform1i(carUniforms.mirror, 0);
        gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
      }
      return { floor, car: state.car, carReady: true, waiting };
    },
    destroy() {
      if (mesh) {
        gl.deleteVertexArray(mesh.vao);
        for (const buffer of mesh.buffers) gl.deleteBuffer(buffer);
      }
      gl.deleteVertexArray(empty);
      for (const texture of [color, lights, map, floorTexture]) gl.deleteTexture(texture);
      gl.deleteFramebuffer(floorBuffer);
      for (const linking of [floorLink, stretchLink, carLink]) linking?.dispose();
    },
  };
}
