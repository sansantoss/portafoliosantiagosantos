/*
  Shaders for the space around the planets: the black hole (SB-0) and the sky.
  Both are our own: a dark horizon, a thin photon ring, an accretion disk seen at an angle and the
  lensed back of the disk arching over the top. Physically inspired, not copied from any film.
*/

const NOISE = `
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm2(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
`;

export const QUAD_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/** Black hole on a camera-facing quad. uv -1..1 across the quad; the horizon is uHole wide. */
export const HOLE_FRAG = `
varying vec2 vUv;
uniform float uTime; uniform float uHole;
${NOISE}
vec3 diskColor(float heat){
  // white-hot inside, amber, then deep red at the edge
  return mix(mix(vec3(1.0, 0.42, 0.12), vec3(1.0, 0.78, 0.45), smoothstep(0.2, 0.6, heat)), vec3(1.0, 0.97, 0.9), smoothstep(0.65, 1.0, heat));
}
void main(){
  vec2 uv = vUv * 2.0 - 1.0;
  float rb = uHole;
  float r = length(uv);
  vec3 col = vec3(0.0); float a = 0.0;

  // accretion disk, tilted towards us: an ellipse in screen space
  float tilt = 0.2;
  vec2 dp = vec2(uv.x, uv.y / tilt);
  float rd = length(dp);
  float ang = atan(dp.y, dp.x);
  float inner = rb * 1.55, outer = rb * 4.3;
  float band = smoothstep(inner, inner * 1.12, rd) * smoothstep(outer, outer * 0.7, rd);
  float heat = 1.0 - clamp((rd - inner) / (outer - inner), 0.0, 1.0);
  // noise sampled on a circle so there is no seam where the angle wraps around
  float a2 = ang - uTime * 0.6 / max(rd, 0.1);
  float swirl = fbm2(vec2(cos(a2), sin(a2)) * 2.4 + vec2(rd * 9.0, -rd * 5.0));
  float streaks = 0.55 + 0.45 * sin(rd * 70.0 - uTime * 2.0 + swirl * 5.0);
  float doppler = 1.0 + 0.55 * (-uv.x / max(rd, 0.001)) * 0.8;   // the side coming towards us is brighter
  float disk = band * (0.45 + 0.75 * swirl) * streaks * doppler;
  bool front = uv.y < 0.0;

  // lensed image of the far side of the disk, arching over and under the horizon
  float ring = smoothstep(rb * 1.02, rb * 1.08, r) * smoothstep(rb * 1.75, rb * 1.18, r);
  float a3 = atan(uv.y, uv.x) + uTime * 0.4;
  float arc = ring * (0.5 + 0.5 * fbm2(vec2(cos(a3), sin(a3)) * 3.0 + vec2(r * 20.0, 0.0)));
  arc *= 0.85 + 0.35 * (-uv.x / max(r, 0.001));
  float photon = exp(-pow((r - rb * 1.04) / (rb * 0.025), 2.0)) * 1.4;

  // back part of the disk (hidden by the horizon), then the lensed arc, then the horizon, then the front part
  if (!front && r > rb) { col += diskColor(heat) * disk; a += disk; }
  col += diskColor(0.8) * arc * 0.9 + vec3(1.0, 0.92, 0.8) * photon;
  a += arc * 0.9 + photon;
  float horizon = smoothstep(rb, rb * 0.97, r);
  col *= 1.0 - horizon; a = max(a, horizon);
  if (front) { col += diskColor(heat) * disk; a += disk; }

  // soft glow
  float glow = exp(-r / (rb * 2.2)) * 0.18 * (1.0 - horizon);
  col += vec3(1.0, 0.6, 0.3) * glow; a += glow;

  a = clamp(a, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}`;

/** The sky: a dark sphere with a faint Milky Way band in violet and teal. */
export const SKY_VERT = `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export const SKY_FRAG = `
varying vec3 vDir;
uniform float uTime;
${NOISE}
void main(){
  vec3 d = normalize(vDir);
  // distance to a tilted great circle = the band
  vec3 n = normalize(vec3(0.25, 1.0, 0.35));
  float b = dot(d, n);
  float band = exp(-b * b * 9.0);
  vec2 p = vec2(atan(d.z, d.x) * 2.2, b * 6.0);
  float cloud = fbm2(p * 1.6 + vec2(uTime * 0.003, 0.0));
  float dust = fbm2(p * 4.0 + 11.0);
  vec3 violet = vec3(0.32, 0.2, 0.55), teal = vec3(0.12, 0.42, 0.45), core = vec3(0.85, 0.8, 0.95);
  vec3 col = vec3(0.012, 0.016, 0.035);
  col += mix(violet, teal, smoothstep(0.35, 0.7, cloud)) * band * cloud * 0.55;
  col += core * pow(band, 6.0) * smoothstep(0.45, 0.8, cloud) * 0.25;
  col *= 1.0 - smoothstep(0.55, 0.85, dust) * band * 0.7;   // dark dust lanes
  gl_FragColor = vec4(col, 1.0);
}`;
