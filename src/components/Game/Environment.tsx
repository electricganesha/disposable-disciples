import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBox } from "@react-three/cannon";
import { useStore, type FloorType } from "../../store";
import { DimensionPlane } from "./DimensionPlane";
import { Tentacles } from "./Tentacles";
import { ParticleSystem } from "./Particles";

// ── Pillar: Support columns ────────────────────────────────────────────────
const Pillar = ({
  position,
  texture,
}: {
  position: [number, number, number];
  texture?: THREE.Texture;
}) => {
  // Pillars are purely visual for now, but we'll give them a height that reaches the floor
  const height = 15;
  return (
    <mesh position={[position[0], position[1] - height / 2, position[2]]}>
      <cylinderGeometry args={[0.3, 0.45, height, 8]} />
      <meshStandardMaterial color="#2d2d2d" map={texture} roughness={0.9} />
    </mesh>
  );
};
const FloorTile = ({
  position,
  color,
  type,
  texture,
  gridKey,
}: {
  position: [number, number, number];
  color: string;
  type: FloorType;
  texture?: THREE.Texture;
  gridKey: string;
}) => {
  const isBone = type === "BONE";
  const height = isBone ? 0.15 : 1.0;
  // Ensure top face is always at y=0. If height is 1, y is -0.5. If height 0.15, y is -0.075.
  const y = isBone ? -height / 2 : position[1];
  const [x_grid, y_grid] = gridKey.split(",").map(Number);

  const [ref] = useBox<THREE.Mesh>(() => ({
    type: "Static",
    position: [position[0], y, position[2]],
    args: [1, height, 1],
    collisionFilterGroup: 1,
    collisionFilterMask: 0xffffffff,
    userData: { isFloor: true, x: x_grid, y: y_grid },
  }));

  return (
    <mesh
      ref={ref}
      position={[position[0], y, position[2]]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, height, 1]} />
      <meshStandardMaterial
        map={texture}
        color={color}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
};

import backgroundVert from "../../shaders/background.vert?raw";
import backgroundFrag from "../../shaders/background.frag?raw";

// ── Animated sky backdrop ────────────────────────────────────────────────────
const BackgroundHorizon = () => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color() },
      uColor2: { value: new THREE.Color() },
      uColor3: { value: new THREE.Color() },
    }),
    [],
  );

  const currentEnvType = useStore((s) => s.environmentType);
  const envColors = useMemo(() => {
    switch (currentEnvType) {
      case "VOID":
        return { c1: "#020205", c2: "#051005", c3: "#1a1030" };
      case "BONE":
        return { c1: "#1a1510", c2: "#2a2015", c3: "#4a3020" };
      default: // ELDRITCH
        return { c1: "#050208", c2: "#0d3b0d", c3: "#7e22ce" };
    }
  }, [currentEnvType]);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      shaderRef.current.uniforms.uColor1.value.set(envColors.c1);
      shaderRef.current.uniforms.uColor2.value.set(envColors.c2);
      shaderRef.current.uniforms.uColor3.value.set(envColors.c3);
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[80, 32, 32]} />
      <shaderMaterial
        ref={shaderRef}
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={backgroundVert}
        fragmentShader={backgroundFrag}
      />
    </mesh>
  );
};

// ── Floating void shard ──────────────────────────────────────────────────────
const VoidShard = () => {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.position.y = 5 + Math.sin(t * 0.5) * 0.8;
    ref.current.position.x = Math.sin(t * 0.3) * 4;
    ref.current.rotation.y += 0.012;
    ref.current.rotation.z += 0.006;
  });

  return (
    <group ref={ref} position={[0, 5, 0]}>
      <mesh castShadow>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color="#9333ea"
          emissive="#9333ea"
          emissiveIntensity={4}
          roughness={0}
          wireframe
        />
      </mesh>
      <pointLight intensity={3} color="#9333ea" distance={12} />
    </group>
  );
};

// ── Main environment ─────────────────────────────────────────────────────────
export const RitualEnvironment = () => {
  const grid = useStore((state) => state.grid);
  const backgroundColor = useStore((state) => state.backgroundColor);

  // Manual loading to allow property mutation (wrapping) without hook-related lint errors
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const s = loader.load("/textures/stone.jpg");
    const b = loader.load("/textures/bone.jpg");
    const a = loader.load("/textures/altar.jpg");
    s.wrapS = s.wrapT = THREE.RepeatWrapping;
    b.wrapS = b.wrapT = THREE.RepeatWrapping;
    a.wrapS = a.wrapT = THREE.RepeatWrapping;
    return { stone: s, bone: b, altar: a };
  }, []);

  const floorBlocks = useMemo(() => {
    const blocks: {
      pos: [number, number, number];
      type: FloorType;
      key: string;
    }[] = [];
    grid.forEach((type, key) => {
      const [x, y_ascii] = key.split(",").map(Number);
      // y_ascii is the grid height. Floor used to be y=0 -> y_phys=-0.5.
      // Now we support multi-level grids, so y_phys = y_ascii - 0.5.
      blocks.push({ pos: [x, y_ascii - 0.5, 0], type, key });
    });
    return blocks;
  }, [grid]);

  const getTexture = (type: FloorType) => {
    if (type === "BONE") return textures.bone;
    if (type === "SUPPORT") return textures.altar;
    return textures.stone;
  };

  return (
    <>
      <color attach="background" args={[backgroundColor]} />

      <BackgroundHorizon />
      <DimensionPlane />
      <Tentacles />
      <ParticleSystem />
      <VoidShard />

      {/* Pillars */}
      {useStore((s) => s.pillarPositions).map((p, i) => (
        <Pillar key={i} position={p} texture={textures.stone} />
      ))}

      {/* Floor tiles */}
      {floorBlocks.map((b) => (
        <FloorTile
          key={b.key}
          gridKey={b.key}
          position={b.pos}
          color="#ffffff"
          type={b.type}
          texture={getTexture(b.type)}
        />
      ))}
    </>
  );
};
