// Uniforms
uniform float uTime;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform float uAlpha;
uniform float uScrollSpeed;
uniform float uScale;
uniform float uBaseAlpha;

varying vec2 vUv;
varying vec2 vWorldXZ;

// Noise helpers
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i),           hash(i + vec2(1, 0)), f.x),
             mix(hash(i+vec2(0,1)), hash(i + vec2(1, 1)), f.x), f.y);
}

// Optimized 2-octave FBM for fog puffs
float fbm2(vec2 p) {
  float v = 0.0;
  v += vnoise(p) * 0.65; p *= 2.2;
  v += vnoise(p) * 0.35;
  return v;
}

// Swirl function (only computed on the bottom layer)
vec3 voidSwirl(vec2 uv) {
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  
  // Dynamic swirl angles
  float s1 = angle + uTime * 0.08 + dist * 2.0;
  float s2 = angle - uTime * 0.04 + dist * 1.0;
  vec2 r1 = vec2(cos(s1), sin(s1)) * dist;
  vec2 r2 = vec2(cos(s2), sin(s2)) * dist;
  
  float n = vnoise(r1 * 5.0 + uTime * 0.13) * 0.5
          + vnoise(r2 * 10.0 - uTime * 0.20) * 0.25;
          
  float p1 = sin(r1.x * 12.0 + uTime * 0.33 + n * 5.0) * 0.5 + 0.5;
  float p2 = cos(r2.y * 18.0 - uTime * 0.10 + n * 3.0) * 0.5 + 0.5;
  float p3 = sin(dist * 20.0 - uTime * 0.40 + n * 8.0) * 0.5 + 0.5;
  
  vec3 col = mix(uColor1, uColor2, p1 * p2 + n);
  col = mix(col, uColor3, p3 * (1.0 - dist * 0.7));
  return col;
}

void main() {
  // ── Volumetric fog calculation ─────────────────────────────────────────────
  vec2 p = vWorldXZ * uScale;
  
  // Wave distortion on UV (slowed down)
  float spd = uScrollSpeed * 2.0;
  p.x += sin(p.y * 2.8 + uTime * spd * 0.85) * 0.18
       + sin(p.x * 1.6 - uTime * spd * 0.60) * 0.10;
  p.y += cos(p.x * 2.4 + uTime * spd * 0.70) * 0.15
       + cos(p.y * 1.3 + uTime * spd * 0.45) * 0.08;

  float t = uTime * uScrollSpeed;
  // 2-octave FBM for n1
  float n1 = fbm2(p        + vec2( t * 0.85, t * 0.38));
  // Cheap 1-octave vnoise for n2 hole-punching
  float n2 = vnoise(p * 1.45 + vec2(-t * 0.60, t * 0.72));

  // Reduce the hole-punching factor to make the fog form a continuous, rolling bank
  float d = n1 - n2 * 0.15;

  // Widen the smoothstep range to soften the borders of the fog, making them feather out smoothly
  float shape = smoothstep(0.22, 0.80, d);

  // Early discard optimization: if this is an upper layer (no base background)
  // and the fog opacity is zero, we discard the pixel immediately to skip all further calculations!
  if (uBaseAlpha <= 0.0 && shape < 0.01) {
    discard;
  }

  // ── Blending the concepts ──────────────────────────────────────────────────
  vec3 swirlCol;
  if (uBaseAlpha > 0.0) {
    // Only compute expensive swirl on the bottom floor layer
    vec2 centeredUv = vUv * 2.0 - 1.0;
    swirlCol = voidSwirl(centeredUv);
  } else {
    // Upper layers use a cheap gradient mix of the environment colors
    swirlCol = mix(uColor1 * 0.4, uColor3 * 0.9, vUv.y);
  }

  // Puffs have a bright-core glow overlayed on the swirling color.
  float bright = pow(shape, 0.45);
  vec3 finalColor = swirlCol * (0.65 + bright * 0.85);
  finalColor += uColor3 * 0.30 * pow(shape, 2.5); // extra core glow

  // Background areas use uBaseAlpha (swirl floor), puffs blend up to uAlpha (volumetric mist).
  // Removed the steep exponent to ensure a soft, feathered blending transition.
  float finalAlpha = mix(uBaseAlpha, uAlpha, shape);

  // Vignette and Edge Fades
  float dist = length(vWorldXZ) / 50.0;
  float edge = 1.0 - smoothstep(0.55, 1.0, dist);
  float df = smoothstep(0.0, 0.10, vUv.y) * (1.0 - smoothstep(0.90, 1.0, vUv.y));

  gl_FragColor = vec4(finalColor, finalAlpha * edge * df);
}
