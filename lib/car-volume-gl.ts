/*
 * Объёмная машина hero на WebGL2 (ROADMAP 3b, эксперимент «объёмная машина»).
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
 * Под машиной — пол и неон подсветки днища, нарисованные кодом, слоем под машиной:
 * источник на уровне колёс даёт на полу эллипс с мягким ядром и длинным хвостом, под
 * шинами и у бампера — тень контакта, размытая маска машины — ореол по её нижним
 * кромкам, глянцевый пол — блик источника и отражение машины. Подсветка закреплена на
 * машине: при повороте пятно и тени поворачиваются вместе с ней. Цвет — акцент темы.
 *
 * Единицы — высоты кадра машины, начало — центр кадра, z к зрителю, пол — низ кадра.
 */

import type { Headlight, Underglow } from "@/content/types";

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
 * кадр в высоту ~1,4 м. Колёса — в полуметре за губой, источник — между передними
 * колёсами на уровне их осей. Пятно — эллипс с центром под источником: поперёк шире
 * трубки из данных, вдоль машины длиннее
 */
const WHEEL_BEHIND_LIP = 0.55;
/* Половина пятна шины на полу по глубине — для тени контакта */
const WHEEL_HALF_DEPTH = 0.12;
const SOURCE_HEIGHT = 0.22;
const POOL_WIDTH = 1.6;
const POOL_LENGTH = 1.1;
/* Ореол по маске: размытие силуэта, CSS-пиксели */
const MASK_BLUR = 22;

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
  /** Ореол по маске машины под ней: проявляется вместе с машиной, 0..1. */
  mask: number;
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
   * вспышка на нуле) и машина. waiting — программы ещё собираются, кадр надо повторить.
   * Бросает исключение, если шейдер не собрался.
   */
  draw(frame: Frame): { floor: boolean; car: boolean; waiting: boolean };
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
uniform vec3 uAccent;
uniform vec2 uBloomStep;
uniform float uBloomLod;
uniform vec3 uHeadlights[2];
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
// видимость 0,85. Стопы в premultiplied alpha: градиент CSS смешивает их так же
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
  return color * 0.85;
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
    // Неон днища — трубка поперёк машины чуть впереди и ниже бампера
    vec3 tube = vec3(clamp(vPosition.x, -0.35 * uAspect, 0.35 * uAspect), FLOOR - 0.05, 0.25);
    vec3 toLight = tube - (uMirror ? vec3(vPosition.x, 2.0 * FLOOR - vPosition.y, vPosition.z) : vPosition);
    float reach = length(toLight);
    float lit = max(dot(normal, toLight / reach), 0.0) / (1.0 + 6.0 * reach * reach);
    // Светлая краска отражает больше тёмного стекла и шин
    float albedo = dot(color.rgb / color.a, vec3(0.2126, 0.7152, 0.0722));
    color = screen(color, vec4(uAccent * (uLight * lit * (0.4 + 0.6 * albedo) * color.a), 0.0));
    // Низ кузова у самого пола освещён снизу: губа, воздухозаборники, края колёс
    float rim = exp(-max(vHeight, 0.0) / RIM_HEIGHT);
    color = screen(color, vec4(uAccent * (uLight * RIM * rim * (0.5 + 0.5 * albedo) * color.a), 0.0));
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
uniform vec3 uAccent;
uniform float uNeon;
uniform float uGloss;
uniform float uAspect;
// Пятно света на полу — эллипс в координатах машины: центр x и z, полуоси по x и z
uniform vec4 uPool;
// Источник на уровне колёс: x левого и правого концов, z, высота — для блика на глянце
uniform vec4 uSource;
// Колёса: x, полуширина, z, полуглубина пятна шины
uniform vec4 uWheels[2];
// Кузов в координатах машины: полуширина и губа
uniform vec2 uBody;
// Маска машины — альфа фото: размытая, она даёт ореол по силуэту под кузовом
uniform sampler2D uMask;
uniform float uMaskGlow;
uniform float uMaskLod;
out vec4 outColor;
${constants}
const float PI = 3.14159265;
// Пятно: сила, мягкое ядро и длинный хвост — края нет нигде
const float POOL = 0.8;
const float POOL_CORE = 2.0;
const float POOL_TAIL = 0.22;
// Блик источника на глянце
const float GLINT = 0.55;
// Тень контакта: размытие у шин и у бампера, в высотах кадра, и её глубина
const float CONTACT = 0.07;
const float BUMPER_SHADOW = 0.06;
const float SHADOW = 0.85;
// Ореол по маске: доля от неона и как высоко по кузову он поднимается
const float MASK = 0.55;
const float MASK_RISE = 0.14;
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

// Блик отрезка-источника на глянце (GGX): берётся точка источника, ближайшая к
// отражённому лучу, — так считают трубчатые лампы в реальном времени. Источник с
// размером размывает блик, энергия сохраняется
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

// Тень контакта: под шинами и у бампера пол темнее — машина стоит на полу, а не висит
float contact(vec3 p) {
  float lit = 1.0;
  for (int i = 0; i < 2; i++) {
    vec4 wheel = uWheels[i];
    vec2 outside = max(abs(p.xz - wheel.xz) - wheel.yw, 0.0);
    lit *= 1.0 - SHADOW * exp(-dot(outside, outside) / (CONTACT * CONTACT));
  }
  // У бампера: чем ближе к губе, тем темнее; под кузовом — тень целиком
  float across = 1.0 - smoothstep(uBody.x - 0.08, uBody.x + 0.06, abs(p.x));
  lit *= 1.0 - across * SHADOW * exp(-max(p.z - uBody.y, 0.0) / BUMPER_SHADOW);
  return lit;
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
    float grain = grainOf(p.xz);
    float shade = contact(p);

    // Пятно — эллипс на плоскости пола под машиной: мягкое ядро и длинный хвост
    vec2 q = (p.xz - uPool.xy) / uPool.zw;
    float d2 = dot(q, q);
    float pool = exp(-POOL_CORE * d2) + POOL_TAIL / (1.0 + 3.0 * d2);
    light += uAccent * (POOL * pool * (0.9 + 0.2 * grain) * shade);

    // Блик источника на глянце — внутри пятна
    float rough = clamp(mix(0.55, 0.07, uGloss) * (0.85 + 0.3 * grain), 0.03, 1.0);
    vec3 a = vec3(uSource.x, uSource.w, uSource.z);
    vec3 b = vec3(uSource.y, uSource.w, uSource.z);
    light += uAccent * (GLINT * lineGlint(p, view, a, b, rough * rough, 0.2) * pool * shade);
  }

  // Ореол по маске машины: размытый силуэт, сильнее у низа кузова. Лежит под машиной —
  // кузов его закрывает, виден только мягкий край вокруг нижних кромок
  if (uMaskGlow > 0.0) {
    vec2 uv = vec2(screen.x / uAspect + 0.5, 0.5 - screen.y);
    float mask = textureLod(uMask, uv, uMaskLod).a;
    float low = exp(-max(1.0 - uv.y, 0.0) / MASK_RISE);
    light += uAccent * (MASK * uMaskGlow * mask * low);
  }

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

type Linking = { program: WebGLProgram; ready(): boolean };

/*
 * Сборка программы. С расширением KHR_parallel_shader_compile браузер собирает её в
 * фоне, а ready() только спрашивает, готова ли: главный поток не встаёт посреди
 * зажигания. Без расширения ready() ждёт сборку. Не собралась — исключение из ready()
 * с журналом компилятора.
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
  return {
    program,
    ready() {
      if (done) return true;
      if (parallel && !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) return false;
      const linked = Boolean(gl.getProgramParameter(program, gl.LINK_STATUS));
      const log = linked
        ? ""
        : [...shaders.map((shader) => gl.getShaderInfoLog(shader)), gl.getProgramInfoLog(program)].join("\n");
      // Собранной программе шейдеры больше не нужны
      for (const shader of shaders) {
        gl.detachShader(program, shader);
        gl.deleteShader(shader);
      }
      done = true;
      if (!linked) throw new Error(log || "linkProgram");
      return true;
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
function linear([r, g, b]: [number, number, number]): [number, number, number] {
  const channel = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return [channel(r), channel(g), channel(b)];
}

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
    accent,
    headlights,
    underglow,
  }: {
    aspect: number;
    accent: [number, number, number];
    headlights: readonly Headlight[];
    underglow?: Underglow;
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

  /* Программы пола готовы — один раз задать то, что не меняется */
  type FloorUniform =
    | "resolution"
    | "yaw"
    | "neon"
    | "gloss"
    | "pool"
    | "source"
    | "wheels"
    | "body"
    | "maskGlow"
    | "maskLod"
    | "stretch";
  let floorUniforms: Record<FloorUniform, WebGLUniformLocation | null> | null = null;
  const floorReady = () => {
    if (floorUniforms) return true;
    if (!floorLink.ready() || !stretchLink.ready()) return false;
    const at = (name: string) => gl.getUniformLocation(floorLink.program, name);
    gl.useProgram(floorLink.program);
    gl.uniform4f(at("uFrame"), ...frame);
    gl.uniform3f(at("uAccent"), ...linear(accent));
    gl.uniform1f(at("uAspect"), aspect);
    // Маска — альфа фото машины в блоке 0
    gl.uniform1i(at("uMask"), 0);
    gl.useProgram(stretchLink.program);
    gl.uniform1i(gl.getUniformLocation(stretchLink.program, "uFloor"), 3);
    floorUniforms = {
      resolution: at("uResolution"),
      yaw: at("uYaw"),
      neon: at("uNeon"),
      gloss: at("uGloss"),
      pool: at("uPool"),
      source: at("uSource"),
      wheels: at("uWheels"),
      body: at("uBody"),
      maskGlow: at("uMaskGlow"),
      maskLod: at("uMaskLod"),
      stretch: gl.getUniformLocation(stretchLink.program, "uResolution"),
    };
    return true;
  };

  /* Программа машины готова — сетка и постоянные значения */
  type CarUniform =
    | "rotation"
    | "depth"
    | "light"
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
    gl.uniform3f(at("uAccent"), ...accent);
    gl.uniform3fv(at("uHeadlights"), headlights.flatMap(({ x, y, w }) => [x / 100, y / 100, w / 100]));
    gl.uniform4f(at("uFrame"), ...frame);
    // Полтексела панели: выборка у её края не заглядывает в соседнюю
    gl.uniform1f(at("uPanel"), 0.5 / (layers.map.naturalHeight / 3));
    carUniforms = {
      rotation: at("uRotation"),
      depth: at("uDepth"),
      light: at("uLight"),
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
    const [from, to] = [x(underglow.tube[0]), x(underglow.tube[1])];
    return {
      yaw: [Math.cos((yaw * Math.PI) / 180), Math.sin((yaw * Math.PI) / 180)],
      pool: [(from + to) / 2, wheelZ, ((to - from) / 2) * POOL_WIDTH, POOL_LENGTH],
      source: [from, to, wheelZ, FLOOR + SOURCE_HEIGHT],
      wheels,
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
        gl.uniform4fv(floorUniforms.pool, scene.pool);
        gl.uniform4fv(floorUniforms.source, scene.source);
        gl.uniform4fv(floorUniforms.wheels, scene.wheels);
        gl.uniform2fv(floorUniforms.body, scene.body);
        // Маска есть, только когда фото уже в текстуре
        const mask = layers && carCssWidth ? state.mask : 0;
        gl.uniform1f(floorUniforms.maskGlow, mask);
        if (mask > 0 && layers) {
          const lod = Math.log2((MASK_BLUR / carCssWidth) * layers.color.naturalWidth);
          gl.uniform1f(floorUniforms.maskLod, Math.max(0, lod));
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, color);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, size[0], size[1]);
        gl.useProgram(stretchLink.program);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, floorTexture);
        gl.uniform2f(floorUniforms.stretch, size[0], size[1]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      const car = carReady();
      const waiting = (Boolean(scene) && !floor) || (Boolean(carLink) && !car);
      if (!car || !carLink || !carUniforms || !mesh) return { floor, car: false, waiting };
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(carLink.program);
      gl.bindVertexArray(mesh.vao);
      gl.uniformMatrix3fv(carUniforms.rotation, false, state.rotation);
      gl.uniform1f(carUniforms.depth, state.depth);
      gl.uniform1f(carUniforms.light, state.light);
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
      return { floor, car: state.car, waiting };
    },
    destroy() {
      if (mesh) {
        gl.deleteVertexArray(mesh.vao);
        for (const buffer of mesh.buffers) gl.deleteBuffer(buffer);
      }
      gl.deleteVertexArray(empty);
      for (const texture of [color, lights, map, floorTexture]) gl.deleteTexture(texture);
      gl.deleteFramebuffer(floorBuffer);
      for (const linking of [floorLink, stretchLink, carLink]) {
        if (!linking) continue;
        // Программу, которая ещё собирается в фоне, сначала дособрать: удалённая посреди
        // сборки, она сыплет в консоль ошибками GL (StrictMode, уход со страницы)
        gl.getProgramParameter(linking.program, gl.LINK_STATUS);
        gl.deleteProgram(linking.program);
      }
    },
  };
}
