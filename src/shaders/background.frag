uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
varying vec2 vUv;
varying vec3 vPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), f.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}

void main() {
  float n1 = noise(vPosition.xy * 0.05 + uTime * 0.02);
  float n2 = noise(vPosition.yz * 0.08 - uTime * 0.015);
  vec3 col = mix(uColor1, uColor2, n1);
  col = mix(col, uColor3, n2 * 0.6);

  // Mountain silhouettes
  float m = noise(vec2(vPosition.x * 0.1, 0.0)) * 12.0 - 10.0;
  if (vPosition.y < m) col = mix(col, uColor1 * 0.4, 0.95);

  // Void sun
  vec3 sunDir = normalize(vec3(40.0, 20.0, 40.0));
  float sunD = distance(normalize(vPosition), sunDir);
  col = mix(col, vec3(0.4, 1.0, 0.4), max(0.0, 1.0 - sunD * 6.0) * 0.7);

  gl_FragColor = vec4(col, 1.0);
}
