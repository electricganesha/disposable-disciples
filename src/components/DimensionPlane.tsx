import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const DimensionPlane = () => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame((state) => {
    const shader = matRef.current?.userData.shader;
    if (shader) shader.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    // Custom uniforms
    shader.uniforms.uTime   = { value: 0 };
    shader.uniforms.uColor1 = { value: new THREE.Color('#050208') };
    shader.uniforms.uColor2 = { value: new THREE.Color('#105210') };
    shader.uniforms.uColor3 = { value: new THREE.Color('#7e22ce') };

    // Pass UV + local position from vertex → fragment
    shader.vertexShader = `
      varying vec2 vCustomUv;
      varying vec3 vCustomPos;
      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vCustomUv  = uv;
       vCustomPos = position;`,
    );

    // Helper functions + uniforms declared once, above main()
    const helperGLSL = `
      uniform float uTime;
      uniform vec3  uColor1;
      uniform vec3  uColor2;
      uniform vec3  uColor3;
      varying vec2  vCustomUv;
      varying vec3  vCustomPos;

      float vNoise(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float smNoise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(vNoise(i), vNoise(i+vec2(1,0)), f.x),
                   mix(vNoise(i+vec2(0,1)), vNoise(i+vec2(1,1)), f.x), f.y);
      }
      vec3 voidSwirl(vec2 uv) {
        float dist  = length(uv);
        float angle = atan(uv.y, uv.x);
        float s1  = angle + uTime*0.3 + dist*2.0;
        float s2  = angle - uTime*0.15 + dist*1.0;
        vec2 r1 = vec2(cos(s1), sin(s1)) * dist;
        vec2 r2 = vec2(cos(s2), sin(s2)) * dist;
        float n  = smNoise(r1*5.0 + uTime*0.5)*0.5
                 + smNoise(r2*10.0 - uTime*0.8)*0.25;
        float p1 = sin(r1.x*12.0 + uTime + n*5.0)*0.5+0.5;
        float p2 = cos(r2.y*18.0 - uTime*0.4 + n*3.0)*0.5+0.5;
        float p3 = sin(dist*20.0 - uTime*1.5 + n*10.0)*0.5+0.5;
        vec3 col = mix(uColor1, uColor2, p1*p2+n);
        col = mix(col, uColor3, p3*(1.0-dist*0.7));
        return col;
      }
    `;

    shader.fragmentShader = `${helperGLSL}\n${shader.fragmentShader}`

      // ① Inject swirl as the diffuse albedo — lights will then illuminate it
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         vec2 _uv = vCustomUv * 2.0 - 1.0;
         vec3 swirl = voidSwirl(_uv);
         diffuseColor.rgb = mix(uColor1 * 0.5, swirl, 0.9);`,
      )

      // ② Add an emissive glow so the pattern glows even in shadow
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         vec2 _uv2 = vCustomUv * 2.0 - 1.0;
         float _d2 = length(_uv2);
         float _hb = 1.0 - smoothstep(0.8, 1.0, _d2);
         float _ab = smoothstep(0.0, 0.15, _d2);
         float voidAlpha = _hb * _ab;
         totalEmissiveRadiance += uColor3 * 0.35 * voidAlpha;`,
      )

      // ③ Alpha: fade at edges and centre (preserves transparency blending)
      .replace(
        '#include <premultiplied_alpha_fragment>',
        `vec2 _uv3 = vCustomUv * 2.0 - 1.0;
         float _d3 = length(_uv3);
         float _fade = (1.0 - smoothstep(0.8, 1.0, _d3)) * smoothstep(0.0, 0.15, _d3);
         gl_FragColor.a *= _fade * 0.9;
         #include <premultiplied_alpha_fragment>`,
      );

    matRef.current.userData.shader = shader;
  };

  return (
    <mesh position={[0, -3.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial
        ref={matRef}
        transparent
        side={THREE.DoubleSide}
        roughness={0.2}
        metalness={0.6}
        onBeforeCompile={onBeforeCompile}
        customProgramCacheKey={() => 'dimension-plane'}
      />
    </mesh>
  );
};
