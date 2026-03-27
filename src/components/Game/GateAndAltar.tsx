import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import { useStore } from "../../store";

// ── Static physics box helper ────────────────────────────────────────────────
const StaticBox = ({
  position,
  args,
  color,
  texture,
  visible = true,
}: {
  position: [number, number, number];
  args: [number, number, number];
  color?: string;
  texture?: THREE.Texture;
  visible?: boolean;
}) => {
  const [ref] = useBox<THREE.Mesh>(() => ({
    type: "Static",
    position,
    args,
    collisionFilterGroup: 1,
    collisionFilterMask: 0xffffffff,
  }));

  if (!visible) {
    // Invisible physics body only
    return <mesh ref={ref} />;
  }

  return (
    <mesh ref={ref} position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color ?? "#ffffff"}
        map={texture}
        roughness={0.8}
      />
    </mesh>
  );
};

// ── Staircase: Detailed steps from level data ───────────────────────────────
const Staircase = ({
  positions,
  texture,
}: {
  positions: [number, number, number][];
  texture: THREE.Texture;
}) => {
  const altarX = useStore((s) => s.altarPosition[0]);

  return (
    <>
      {positions.map((p, i) => {
        const isRisingRight = altarX > p[0];
        const stepCount = 5;
        const stepWidth = 1.0 / stepCount;
        const stepHeight = 1.0 / stepCount;

        return (
          <group key={i}>
            {Array.from({ length: stepCount }).map((_, j) => {
              const h = (j + 1) * stepHeight;
              const xOffset = isRisingRight
                ? -0.5 + j * stepWidth + stepWidth / 2
                : 0.5 - j * stepWidth - stepWidth / 2;

              // Each sub-step box - slightly wider to overlap and prevent gaps
              return (
                <StaticBox
                  key={j}
                  // World position: block_pos + offset
                  position={[p[0] + xOffset, p[1] - 1.0 + h / 2, p[2]]}
                  args={[stepWidth + 0.08, h, 1.2]}
                  color="#ffffff"
                  texture={texture}
                />
              );
            })}
          </group>
        );
      })}
    </>
  );
};

import portalVert from "../../shaders/portal.vert?raw";
import portalFrag from "../../shaders/portal.frag?raw";

// ── Portal ring at gate ──────────────────────────────────────────────────────
const PortalRing = ({ position }: { position: [number, number, number] }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color("#2e1065") }, // Deep purple
      uColor2: { value: new THREE.Color("#4c1d95") }, // Mid purple
      uColor3: { value: new THREE.Color("#064e3b") }, // Eldritch green
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = t;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 4 + Math.sin(t * 3) * 1.5;
    }
  });

  return (
    <group position={position} scale={[1, 1, 1]}>
      {/* Torus ring */}
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[1.0, 0.08, 16, 48]} />
        <meshStandardMaterial
          color="#9333ea"
          emissive="#9333ea"
          emissiveIntensity={5}
        />
      </mesh>

      {/* Portal disc with custom shader */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[1.0, 32]} />
        <shaderMaterial
          ref={shaderRef}
          transparent
          side={THREE.DoubleSide}
          uniforms={uniforms}
          vertexShader={portalVert}
          fragmentShader={portalFrag}
        />
      </mesh>
      <pointLight ref={lightRef} intensity={4} color="#a855f7" distance={8} />
    </group>
  );
};

// ── Altar pedestal at goal ───────────────────────────────────────────────────
const AltarPedestal = ({
  position,
  texture,
}: {
  position: [number, number, number];
  texture: THREE.Texture;
}) => {
  const [px, py, pz] = position;

  // Physics top surface: aligned with the visual top cap at py + 1.5
  const [ref] = useBox<THREE.Mesh>(() => ({
    type: "Static",
    position: [px, py + 1.5, pz],
    args: [2.0, 0.4, 2.0],
    collisionFilterGroup: 1,
    collisionFilterMask: 0xffffffff,
  }));

  return (
    <group position={[px, py + 0.5, pz]}>
      {/* Base cylinder — visual only */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.9, 2, 8]} />
        <meshStandardMaterial color="#ffffff" map={texture} roughness={0.9} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 8]} />
        <meshStandardMaterial color="#ffffff" map={texture} roughness={0.9} />
      </mesh>
      {/* Invisible physics top */}
      <mesh ref={ref} position={[0, 1.0, 0]} visible={false}>
        <boxGeometry args={[2.0, 0.4, 2.0]} />
      </mesh>

      {/* Glow */}
      <pointLight
        position={[0, 1.5, 0]}
        intensity={25}
        color="#c084fc"
        distance={6}
      />
    </group>
  );
};

// ── Main export ──────────────────────────────────────────────────────────────
export const GateAndAltar = () => {
  const gatePos = useStore((s) => s.gatePosition);
  const altarPos = useStore((s) => s.altarPosition);
  const staircasePositions = useStore((s) => s.staircasePositions);

  const altarTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const t = loader.load("/textures/altar.jpg");
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
    return t;
  }, []);

  return (
    <group>
      <Staircase positions={staircasePositions} texture={altarTexture} />
      <PortalRing position={[gatePos[0], gatePos[1] - 0.5 + 0.5, gatePos[2]]} />
      <AltarPedestal
        position={[altarPos[0], altarPos[1] - 0.5, altarPos[2]]}
        texture={altarTexture}
      />
    </group>
  );
};
