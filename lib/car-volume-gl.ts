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
 * повороте свет отставал бы от кузова. Холст подменяет фото, когда зажигание отыграло,
 * поэтому все слои рисуются в финальном кадре зажигания. Неон пола светит на кузов
 * цветом акцента: свет закреплён под машиной, а кузов поворачивается — отсвет
 * переползает по нему.
 *
 * Единицы — высоты кадра машины, начало — центр кадра, z к зрителю.
 */

import type { Headlight } from "@/content/types";

/** Поле холста вокруг машины, в ширинах машины: при повороте кромка не обрезается. */
export const PAD = 0.06;
/** Ячеек сетки по ширине кадра: ячейка ~5 px машины на десктопе. */
const GRID = 160;

export type Layers = {
  /** Фото машины, светодиоды фар — те же <img>, что показывает страница. */
  color: HTMLImageElement;
  lights: HTMLImageElement;
  /** Карта объёма: три серые панели одна под другой. */
  map: HTMLImageElement;
};

export type Frame = {
  /** Поворот, rotation() из lib/car-volume. */
  rotation: Float32Array;
  /** Глубина рельефа, в высотах кадра. */
  depth: number;
  /** Сила отсвета неона на кузове. */
  light: number;
};

export type Volume = {
  /** Размер холста в пикселях устройства и ширина машины в CSS-пикселях. */
  resize(width: number, height: number, carCssWidth: number): void;
  /** Браузер сменил кандидата из srcset — заново взять фото и фары. */
  refresh(): void;
  draw(frame: Frame): void;
  destroy(): void;
};

const vertex = /* glsl */ `#version 300 es
uniform sampler2D uMap;
uniform mat3 uRotation;
uniform float uAspect;
uniform float uDepth;
uniform float uPanel;
uniform vec2 uHalf;
in vec2 aUv;
out vec2 vUv;
out vec3 vPosition;

// Камера в трёх высотах кадра от машины — перспектива около 19°, как у фото
const float CAMERA = 3.0;
// Ось поворота — на этой глубине: перед машины ходит, крыша почти стоит
const float PIVOT = 0.6;

void main() {
  vUv = aUv;
  float depth = textureLod(uMap, vec2(aUv.x, clamp(aUv.y, uPanel, 1.0 - uPanel) / 3.0), 0.0).r;
  float z = (depth - PIVOT) * uDepth;
  vec2 plane = vec2((aUv.x - 0.5) * uAspect, 0.5 - aUv.y);
  // Точка на луче камеры через пиксель фото: в покое проецируется ровно в него
  vec3 position = uRotation * vec3(plane * (CAMERA - z) / CAMERA, z);
  vPosition = position;
  float w = (CAMERA - position.z) / CAMERA;
  gl_Position = vec4(position.xy / uHalf, -position.z * w, w);
}
`;

const fragment = /* glsl */ `#version 300 es
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
// Фары: центр и ширина светодиодов в долях кадра
uniform vec3 uHeadlights[2];
in vec2 vUv;
in vec3 vPosition;
out vec4 outColor;

// Наклон в карте — от −SLOPE до SLOPE: DEPTH_SLOPE в scripts/hero-car/cutout.py
const float SLOPE = 8.0;
// Сдвиг мип-уровня к резкости: браузер уменьшает картинку чётче, чем смесь мип-уровней,
// и без сдвига машина при подмене заметно смягчалась
const float SHARPEN = -0.75;

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
  vec4 color = texture(uColor, vUv, SHARPEN);
  // Кузов растворяется в полу, как .fade-bottom: с 70% высоты до низа
  color *= clamp((1.0 - vUv.y) / 0.3, 0.0, 1.0);

  if (uLight > 0.0 && color.a > 0.0) {
    vec3 normal = normalize(uRotation * vec3(
      -uDepth * slope(1.0) / uAspect,
      uDepth * slope(2.0),
      1.0
    ));
    // Неон пола — трубка поперёк машины чуть впереди и ниже бампера
    vec3 tube = vec3(clamp(vPosition.x, -0.35 * uAspect, 0.35 * uAspect), -0.55, 0.25);
    vec3 toLight = tube - vPosition;
    float reach = length(toLight);
    float lit = max(dot(normal, toLight / reach), 0.0) / (1.0 + 6.0 * reach * reach);
    // Светлая краска отражает больше тёмного стекла и шин
    float albedo = dot(color.rgb / color.a, vec3(0.2126, 0.7152, 0.0722));
    color = screen(color, vec4(uAccent * (uLight * lit * (0.4 + 0.6 * albedo) * color.a), 0.0));
  }

  // Ореол светодиодов, как .lights-bloom: размытие, затем яркость 1,5
  vec4 bloom = vec4(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      float weight = (x == 0 ? 2.0 : 1.0) * (y == 0 ? 2.0 : 1.0);
      bloom += weight * textureLod(uLights, vUv + vec2(x, y) * uBloomStep, uBloomLod);
    }
  }
  bloom /= 16.0;
  bloom.rgb = min(bloom.rgb / max(bloom.a, 1e-4) * 1.5, 1.0) * bloom.a;
  color = screen(color, bloom);
  color = screen(color, texture(uLights, vUv, SHARPEN));
  color = screen(color, halo(uHeadlights[0]));
  color = screen(color, halo(uHeadlights[1]));

  if (color.a < 1.0 / 255.0) discard;
  outColor = color;
}
`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("createShader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "compileShader");
  }
  return shader;
}

/* Собранной программе шейдеры больше не нужны */
function link(gl: WebGL2RenderingContext): WebGLProgram {
  const program = gl.createProgram();
  const shaders = [compile(gl, gl.VERTEX_SHADER, vertex), compile(gl, gl.FRAGMENT_SHADER, fragment)];
  for (const shader of shaders) gl.attachShader(program, shader);
  gl.linkProgram(program);
  for (const shader of shaders) {
    gl.detachShader(program, shader);
    gl.deleteShader(shader);
  }
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "linkProgram");
  }
  return program;
}

/* Фото — с premultiplied alpha и мип-уровнями (машина на экране меньше файла, а ореол
   берётся с грубого уровня). Карта — данные: как есть, без цветокоррекции. */
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
  return { count: index.length, vao, buffers };
}

/**
 * Готовит сцену. Бросает исключение, если шейдеры не собрались: страница остаётся со
 * статичной машиной.
 */
export function createVolume(
  gl: WebGL2RenderingContext,
  layers: Layers,
  {
    aspect,
    accent,
    headlights,
  }: { aspect: number; accent: [number, number, number]; headlights: readonly Headlight[] },
): Volume {
  const program = link(gl);
  gl.useProgram(program);
  const mesh = grid(gl, program, aspect);
  const [color, lights, map] = [gl.createTexture(), gl.createTexture(), gl.createTexture()];
  const photos = () => {
    upload(gl, 0, color, layers.color, "photo");
    upload(gl, 1, lights, layers.lights, "photo");
  };
  photos();
  upload(gl, 2, map, layers.map, "data");

  const at = (name: string) => gl.getUniformLocation(program, name);
  gl.uniform1i(at("uColor"), 0);
  gl.uniform1i(at("uLights"), 1);
  gl.uniform1i(at("uMap"), 2);
  gl.uniform1f(at("uAspect"), aspect);
  gl.uniform3f(at("uAccent"), ...accent);
  gl.uniform3fv(at("uHeadlights"), headlights.flatMap(({ x, y, w }) => [x / 100, y / 100, w / 100]));
  // Полтексела панели: выборка у её края не заглядывает в соседнюю
  gl.uniform1f(at("uPanel"), 0.5 / (layers.map.naturalHeight / 3));
  // Холст — машина с полем PAD ширины машины со всех сторон
  gl.uniform2f(at("uHalf"), aspect * (0.5 + PAD), 0.5 + PAD * aspect);

  const uniforms = {
    rotation: at("uRotation"),
    depth: at("uDepth"),
    light: at("uLight"),
    bloomStep: at("uBloomStep"),
    bloomLod: at("uBloomLod"),
  };

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let carCssWidth = 0;
  // Размытие ореола светодиодов — 6 CSS-пикселей, как blur(6px) у .lights-bloom
  const bloom = () => {
    if (!carCssWidth) return;
    const sigma = 6 / carCssWidth;
    gl.uniform2f(uniforms.bloomStep, sigma, sigma * aspect);
    gl.uniform1f(uniforms.bloomLod, Math.max(0, Math.log2(sigma * layers.lights.naturalWidth)));
  };

  return {
    resize(width, height, cssWidth) {
      gl.viewport(0, 0, width, height);
      carCssWidth = cssWidth;
      bloom();
    },
    refresh() {
      photos();
      bloom();
    },
    draw(frame) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix3fv(uniforms.rotation, false, frame.rotation);
      gl.uniform1f(uniforms.depth, frame.depth);
      gl.uniform1f(uniforms.light, frame.light);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    },
    destroy() {
      gl.deleteVertexArray(mesh.vao);
      for (const buffer of mesh.buffers) gl.deleteBuffer(buffer);
      for (const texture of [color, lights, map]) gl.deleteTexture(texture);
      gl.deleteProgram(program);
    },
  };
}
