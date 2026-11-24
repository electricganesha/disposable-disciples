import { useRef, useMemo, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBox } from "@react-three/cannon";
import { useStore } from "../../store";
import type { FloorType } from "../../levels/types";
import { Tentacles } from "./Tentacles";
import { ParticleSystem } from "./Particles";
import { FogFloor } from "./FogFloor";

import backgroundVert from "../../shaders/background.vert?raw";
import backgroundFrag from "../../shaders/background.frag?raw";
import { getEnvironment } from "../../environments/registry";

// ── Static Geometries & Materials ────────────────────────────────────────────
const BONE_GEOMETRY = new THREE.BoxGeometry(1, 0.15, 1);
const STONE_GEOMETRY = new THREE.BoxGeometry(1, 1.0, 1);
const PILLAR_GEOMETRY = new THREE.CylinderGeometry(0.3, 0.45, 15, 8);
const SPHERE_GEOMETRY = new THREE.SphereGeometry(80, 32, 32);
const OCTAHEDRON_GEOMETRY = new THREE.OctahedronGeometry(0.55, 0);

const SHARD_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#9333ea",
  emissive: "#9333ea",
  emissiveIntensity: 4,
  roughness: 0,
  wireframe: true,
});

// ── Pillar: Support columns ────────────────────────────────────────────────
interface PillarProps {
  position: [number, number, number];
  material: THREE.Material;
}

const Pillar = memo(
  ({ position, material }: PillarProps) => {
    const height = 15;
    return (
      <mesh
        position={[position[0], position[1] - height / 2, position[2]]}
        geometry={PILLAR_GEOMETRY}
        material={material}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.material === nextProps.material &&
      prevProps.position[0] === nextProps.position[0] &&
      prevProps.position[1] === nextProps.position[1] &&
      prevProps.position[2] === nextProps.position[2]
    );
  }
);

Pillar.displayName = "Pillar";

// ── FloorTile: Individual platform blocks ────────────────────────────────────
interface FloorTileProps {
  position: [number, number, number];
  type: FloorType;
  material: THREE.Material;
  gridKey: string;
}

const FloorTile = memo(
  ({ position, type, material, gridKey }: FloorTileProps) => {
    const isBone = type === "BONE";
    const height = isBone ? 0.15 : 1.0;
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
        geometry={isBone ? BONE_GEOMETRY : STONE_GEOMETRY}
        material={material}
        castShadow
        receiveShadow
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.gridKey === nextProps.gridKey &&
      prevProps.type === nextProps.type &&
      prevProps.material === nextProps.material &&
      prevProps.position[0] === nextProps.position[0] &&
      prevProps.position[1] === nextProps.position[1] &&
      prevProps.position[2] === nextProps.position[2]
    );
  }
);

FloorTile.displayName = "FloorTile";

// ── Animated sky backdrop ────────────────────────────────────────────────────
const BackgroundHorizon = memo(() => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);
  const currentEnvType = useStore((s) => s.environmentType);
  const env = useMemo(() => getEnvironment(currentEnvType), [currentEnvType]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color() },
      uColor2: { value: new THREE.Color() },
      uColor3: { value: new THREE.Color() },
    }),
    [],
  );

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      shaderRef.current.uniforms.uColor1.value.set(env.horizonColors.c1);
      shaderRef.current.uniforms.uColor2.value.set(env.horizonColors.c2);
      shaderRef.current.uniforms.uColor3.value.set(env.horizonColors.c3);
    }
  });

  return (
    <mesh geometry={SPHERE_GEOMETRY}>
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
});

BackgroundHorizon.displayName = "BackgroundHorizon";

// ── Floating void shard ──────────────────────────────────────────────────────
const VoidShard = memo(() => {
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
      <mesh geometry={OCTAHEDRON_GEOMETRY} material={SHARD_MATERIAL} castShadow />
      <pointLight intensity={3} color="#9333ea" distance={12} />
    </group>
  );
});

VoidShard.displayName = "VoidShard";

// ── Main environment ─────────────────────────────────────────────────────────
export const RitualEnvironment = () => {
  const grid = useStore((state) => state.grid);
  const backgroundColor = useStore((state) => state.backgroundColor);
  const currentEnvType = useStore((state) => state.environmentType);
  const env = useMemo(() => getEnvironment(currentEnvType), [currentEnvType]);

  // Manual loading based on environment definition
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const s = loader.load(env.textures.stone);
    const b = loader.load(env.textures.bone);
    const a = loader.load(env.textures.altar);
    s.wrapS = s.wrapT = THREE.RepeatWrapping;
    b.wrapS = b.wrapT = THREE.RepeatWrapping;
    a.wrapS = a.wrapT = THREE.RepeatWrapping;
    return { stone: s, bone: b, altar: a };
  }, [env.textures]);

  // Shared materials created once per environment/texture change
  const materials = useMemo(() => {
    const stoneMat = new THREE.MeshStandardMaterial({
      map: textures.stone,
      color: "#ffffff",
      roughness: 0.7,
      metalness: 0.1,
    });
    const boneMat = new THREE.MeshStandardMaterial({
      map: textures.bone,
      color: "#ffffff",
      roughness: 0.7,
      metalness: 0.1,
    });
    const altarMat = new THREE.MeshStandardMaterial({
      map: textures.altar,
      color: "#ffffff",
      roughness: 0.7,
      metalness: 0.1,
    });
    const pillarMat = new THREE.MeshStandardMaterial({
      color: "#2d2d2d",
      map: textures.stone,
      roughness: 0.9,
    });
    return { stoneMat, boneMat, altarMat, pillarMat };
  }, [textures]);

  const floorBlocks = useMemo(() => {
    const blocks: {
      pos: [number, number, number];
      type: FloorType;
      key: string;
    }[] = [];
    grid.forEach((type, key) => {
      const [x, y_ascii] = key.split(",").map(Number);
      blocks.push({ pos: [x, y_ascii - 0.5, 0], type, key });
    });
    return blocks;
  }, [grid]);

  const getMaterial = (type: FloorType) => {
    if (type === "BONE") return materials.boneMat;
    if (type === "SUPPORT") return materials.altarMat;
    return materials.stoneMat;
  };

  return (
    <>
      <color attach="background" args={[backgroundColor]} />

      <BackgroundHorizon />
      {env.props.showTentacles && <Tentacles />}
      {env.props.showParticles && <ParticleSystem />}
      {env.props.showShards && <VoidShard />}

      {/* Fog floor — unified volumetric swirling void & mist sitting below the platforms */}
      <FogFloor
        baseY={-0.5}
        color={env.fogFloorColor ?? "#2a0a50"}
        c1={env.horizonColors.c1}
        c2={env.horizonColors.c2}
        c3={env.horizonColors.c3}
      />

      {/* Pillars */}
      {useStore((s) => s.pillarPositions).map((p, i) => (
        <Pillar key={i} position={p} material={materials.pillarMat} />
      ))}

      {/* Floor tiles */}
      {floorBlocks.map((b) => (
        <FloorTile
          key={b.key}
          gridKey={b.key}
          position={b.pos}
          type={b.type}
          material={getMaterial(b.type)}
        />
      ))}
    </>
  );
};
