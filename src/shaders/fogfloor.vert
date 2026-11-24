uniform float uTime;
uniform float uScrollSpeed;
uniform float uScale;

varying vec2 vUv;
varying vec2 vWorldXZ;

void main() {
  vUv = uv;

  // Use uScrollSpeed and uScale to give each layer a unique speed and phase,
  // preventing them from moving in lockstep and creating organic volumetric depth.
  // We've slowed down the wave speed to make it look gentler and more atmospheric.
  float speed = uTime * (0.8 + uScrollSpeed * 4.0) + uScale * 35.0;
  
  // Sweeping swell waves (wavelengths of ~22 and ~14 units)
  // We've reduced the amplitude to make the vertical bobbing very subtle and gentle.
  float swellX = sin(position.x * 0.30 + speed) * 0.30;
  float swellY = cos(position.y * 0.50 - speed * 0.8) * 0.20;
  
  // Detail diagonal wave for organic complexity
  float diagonal = sin((position.x - position.y) * 0.40 + speed * 1.2) * 0.08;
  
  float wave = swellX + swellY + diagonal;

  vec3 displacedPosition = position;
  displacedPosition.z += wave;

  vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
  vWorldXZ = worldPosition.xz;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}

