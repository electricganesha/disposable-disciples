uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
varying vec2 vUv;

// Simple 2D noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}

void main() {
  vec2 uv = vUv - 0.5;
  float dist = length(uv);
  
  // Swirling effect
  float angle = atan(uv.y, uv.x);
  float swirl = noise(vec2(dist * 8.0 - uTime * 0.5, angle + uTime * 0.2));
  
  // Multi-layered colors
  vec3 col = mix(uColor1, uColor2, swirl);
  col = mix(col, uColor3, noise(uv * 12.0 + uTime * 0.8) * 0.4);
  
  // Pulsing edge
  float edge = smoothstep(0.48, 0.4, dist);
  float glow = (1.0 - dist * 2.0) * 0.5;
  
  gl_FragColor = vec4(col + glow, edge * 0.95);
}
