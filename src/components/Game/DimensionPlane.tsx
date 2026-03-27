import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import dimensionVert from "../../shaders/dimension.vert?raw";
import dimensionFrag from "../../shaders/dimension.frag?raw";
import { useStore } from "../../store";

export const DimensionPlane = () => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);
  const ambientColor = useStore((s) => s.ambientColor);
  const ambientIntensity = useStore((s) => s.lightIntensity);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color("#050208") },
      uColor2: { value: new THREE.Color("#105210") },
      uColor3: { value: new THREE.Color("#7e22ce") },
      uAmbientColor: { value: new THREE.Color(ambientColor) },
      uAmbientIntensity: { value: ambientIntensity },
    }),
    [ambientColor, ambientIntensity],
  );

  return (
    <mesh position={[0, -3.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[120, 120]} />
      <shaderMaterial
        ref={shaderRef}
        transparent
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={dimensionVert}
        fragmentShader={dimensionFrag}
      />
    </mesh>
  );
};
