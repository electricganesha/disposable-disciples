uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

// Simple 2D noise helpers
float vNoise(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float smNoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(vNoise(i), vNoise(i + vec2(1,0)), f.x),
              mix(vNoise(i + vec2(0,1)), vNoise(i + vec2(1,1)), f.x), f.y);
}

vec3 voidSwirl(vec2 uv) {
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  float s1 = angle + uTime * 0.3 + dist * 2.0;
  float s2 = angle - uTime * 0.15 + dist * 1.0;
  vec2 r1 = vec2(cos(s1), sin(s1)) * dist;
  vec2 r2 = vec2(cos(s2), sin(s2)) * dist;
  float n = smNoise(r1 * 5.0 + uTime * 0.5) * 0.5
          + smNoise(r2 * 10.0 - uTime * 0.8) * 0.25;
  float p1 = sin(r1.x * 12.0 + uTime + n * 5.0) * 0.5 + 0.5;
  float p2 = cos(r2.y * 18.0 - uTime * 0.4 + n * 3.0) * 0.5 + 0.5;
  float p3 = sin(dist * 20.0 - uTime * 1.5 + n * 10.0) * 0.5 + 0.5;
  vec3 col = mix(uColor1, uColor2, p1 * p2 + n);
  col = mix(col, uColor3, p3 * (1.0 - dist * 0.7));
  return col;
}

void main() {
  vec2 centeredUv = vUv * 2.0 - 1.0;
  float dist = length(centeredUv);
  
  // Swirling void pattern
  vec3 swirl = voidSwirl(centeredUv);
  
  // Edge and center fade
  float fade = (1.0 - smoothstep(0.8, 1.0, dist)) * smoothstep(0.0, 0.15, dist);
  
  // Basic lighting
  vec3 ambient = uAmbientColor * uAmbientIntensity;
  
  // Directional light (hardcoded match for App.tsx light position [10, 20, 10])
  vec3 lightDir = normalize(vec3(10.0, 20.0, 10.0));
  float diff = max(dot(vNormal, lightDir), 0.0);
  vec3 directional = vec3(2.5) * diff; // intensity 2.5
  
  vec3 finalColor = mix(uColor1 * 0.5, swirl, 0.9);
  finalColor *= (ambient + directional);
  
  // Add emissive glow
  finalColor += uColor3 * 0.35 * fade;
  
  gl_FragColor = vec4(finalColor, fade * 0.9);
}
