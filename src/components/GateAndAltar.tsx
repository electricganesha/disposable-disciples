import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import { useStore } from "../store";

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

// ── Staircase: 15 steps climbing from x=4..7.4, y=0..1.5 ───────────────────
const Staircase = ({ texture }: { texture: THREE.Texture }) => {
  const steps = useMemo(() => {
    const count = 15;
    const startX = 4.2;
    const endX = 7.2;
    const dx = (endX - startX) / count;
    const dy = 1.5 / count;
    return Array.from({ length: count }, (_, i) => ({
      x: startX + i * dx + dx / 2,
      y: i * dy + dy / 2,
      z: 0,
      w: dx * 1.25,
      h: dy,
    }));
  }, []);

  return (
    <>
      {steps.map((s, i) => (
        <StaticBox
          key={i}
          position={[s.x, s.y, s.z]}
          args={[s.w, s.h, 1.4]}
          color="#ffffff"
          texture={texture}
        />
      ))}
    </>
  );
};

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
    <group position={position} scale={[1, 1.25, 1]}>
      {/* Torus ring */}
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.8, 0.08, 16, 48]} />
        <meshStandardMaterial
          color="#9333ea"
          emissive="#9333ea"
          emissiveIntensity={5}
        />
      </mesh>

      {/* Portal disc with custom shader */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.78, 32]} />
        <shaderMaterial
          ref={shaderRef}
          transparent
          side={THREE.DoubleSide}
          uniforms={uniforms}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            varying vec2 vUv;

            // Simple 2D noise
            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }
            float noise(vec2 p) {
              vec2 i = floor(p); vec2 f = fract(p);
              f = f*f*(3.0-2.0*f);
              return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                         mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
            }

            void main() {
              vec2 uv = vUv - 0.5;
              float dist = length(uv);
              
              // Swirling effect
              float angle = atan(uv.y, uv.x);
              float swirl = noise(vec2(dist * 8.0 - uTime * 0.5, angle + uTime * 0.2));
              
              // Multi-layered colors
              vec3 col = mix(uColor1, uColor2, swirl);
              col = mix(col, uColor3, noise(uv * 12.0 + uTime * 0.8) * 0.4);
              
              // Pulsing edge
              float edge = smoothstep(0.48, 0.4, dist);
              float glow = (1.0 - dist * 2.0) * 0.5;
              
              gl_FragColor = vec4(col + glow, edge * 0.95);
            }
          `}
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

  // Physics top surface: a flat box the cultist walks onto
  const [ref] = useBox<THREE.Mesh>(() => ({
    type: "Static",
    position: [px, py + 0.1, pz],
    args: [1.6, 0.2, 1.6],
    collisionFilterGroup: 1,
    collisionFilterMask: 0xffffffff,
  }));

  return (
    <group position={[px, py - 1, pz]}>
      {/* Base cylinder — visual only */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.9, 2, 8]} />
        <meshStandardMaterial color="#ffffff" map={texture} roughness={0.9} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 8]} />
        <meshStandardMaterial color="#ffffff" map={texture} roughness={0.9} />
      </mesh>
      {/* Invisible physics top */}
      <mesh ref={ref} position={[0, 1.1, 0]} visible={false}>
        <boxGeometry args={[1.6, 0.2, 1.6]} />
      </mesh>
      {/* Glow */}
      <pointLight
        position={[0, 1.5, 0]}
        intensity={15}
        color="#c084fc"
        distance={5}
      />
    </group>
  );
};

// ── Main export ──────────────────────────────────────────────────────────────
export const GateAndAltar = () => {
  const gatePos = useStore((s) => s.gatePosition);
  const altarPos = useStore((s) => s.altarPosition);

  const altarTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const t = loader.load("/textures/altar.jpg");
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
    return t;
  }, []);

  return (
    <group>
      <Staircase texture={altarTexture} />
      <PortalRing position={[gatePos[0], gatePos[1] + 0.5, gatePos[2]]} />
      <AltarPedestal position={altarPos} texture={altarTexture} />
    </group>
  );
};
