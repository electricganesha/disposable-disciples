import { useRef, useMemo, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import fogFloorVert from "../../shaders/fogfloor.vert?raw";
import fogFloorFrag from "../../shaders/fogfloor.frag?raw";

const FOG_PLANE_GEOMETRY = new THREE.PlaneGeometry(100, 100, 32, 32);

interface FogLayerProps {
  yOffset: number;
  alpha: number;
  scrollSpeed: number;
  scale: number;
  fogColor: THREE.Color;
  c1: string;
  c2: string;
  c3: string;
  baseAlpha: number;
}

const FogLayer = memo(({ yOffset, alpha, scrollSpeed, scale, fogColor, c1, c2, c3, baseAlpha }: FogLayerProps) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  const uniforms = useMemo(
    () => ({
      uTime:        { value: 0 },
      uFogColor:    { value: fogColor.clone() },
      uAlpha:       { value: alpha },
      uScrollSpeed: { value: scrollSpeed },
      uScale:       { value: scale },
      uColor1:      { value: new THREE.Color(c1) },
      uColor2:      { value: new THREE.Color(c2) },
      uColor3:      { value: new THREE.Color(c3) },
      uBaseAlpha:   { value: baseAlpha },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const material = meshRef.current.material as THREE.ShaderMaterial;
    if (material && material.uniforms) {
      material.uniforms.uTime.value = t;
      material.uniforms.uFogColor.value.copy(fogColor);
      material.uniforms.uColor1.value.set(c1);
      material.uniforms.uColor2.value.set(c2);
      material.uniforms.uColor3.value.set(c3);
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, yOffset, 0]}
      geometry={FOG_PLANE_GEOMETRY}
      renderOrder={2}
    >
      <shaderMaterial
        vertexShader={fogFloorVert}
        fragmentShader={fogFloorFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
});

FogLayer.displayName = "FogLayer";

interface FogFloorProps {
  baseY?: number;
  color?: string;
  c1?: string;
  c2?: string;
  c3?: string;
}

/**
 * FogFloor — 3 transparent planes of sparse animated volumetric fog.
 */
export const FogFloor = memo(({
  baseY = -1.0,
  color = "#2a0a50",
  c1 = "#050208",
  c2 = "#0d3b0d",
  c3 = "#7e22ce"
}: FogFloorProps) => {
  const fogColor = useMemo(() => new THREE.Color(color), [color]);

  // [yRelative, alpha, scrollSpeed, noiseScale, baseAlpha]
  const layerDefs: [number, number, number, number, number][] = [
    [  0.00, 0.12, 0.038, 0.13, 0.00 ],  // top: slow large wisps, barely visible
    [ -0.90, 0.22, 0.055, 0.18, 0.00 ],  // mid: medium speed
    [ -1.90, 0.35, 0.075, 0.22, 0.65 ],  // floor: faster, finer detail, solid swirling base
  ];

  const layers = useMemo(
    () =>
      layerDefs.map(([rel, alpha, scrollSpeed, scale, baseAlpha]) => ({
        yOffset: baseY + rel,
        alpha,
        scrollSpeed,
        scale,
        fogColor,
        c1,
        c2,
        c3,
        baseAlpha,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseY, fogColor, c1, c2, c3]
  );

  return (
    <>
      {layers.map((layer, i) => (
        <FogLayer key={i} {...layer} />
      ))}
    </>
  );
});

FogFloor.displayName = "FogFloor";
