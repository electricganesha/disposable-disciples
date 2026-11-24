import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import dimensionVert from "../../shaders/dimension.vert?raw";
import dimensionFrag from "../../shaders/dimension.frag?raw";
import { useStore } from "../../store";

import { getEnvironment } from "../../environments/registry";

export const DimensionPlane = () => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);
  const ambientColor = useStore((s) => s.ambientColor);
  const ambientIntensity = useStore((s) => s.lightIntensity);
  const environmentType = useStore((s) => s.environmentType);

  const env = useMemo(() => getEnvironment(environmentType), [environmentType]);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(env.horizonColors.c1) },
      uColor2: { value: new THREE.Color(env.horizonColors.c2) },
      uColor3: { value: new THREE.Color(env.horizonColors.c3) },
      uAmbientColor: { value: new THREE.Color(ambientColor) },
      uAmbientIntensity: { value: ambientIntensity },
    }),
    [env, ambientColor, ambientIntensity],
  );

  return (
    <mesh position={[0, -3.0, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[120, 120]} />
      <shaderMaterial
        ref={shaderRef}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={dimensionVert}
        fragmentShader={dimensionFrag}
      />
    </mesh>
  );
};
