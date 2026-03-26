import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBox } from '@react-three/cannon';
import { useStore, type FloorType } from '../store';
import { DimensionPlane } from './DimensionPlane';
import { Tentacles } from './Tentacles';
import { ParticleSystem } from './Particles';

// ── Static floor tile with physics ─────────────────────────────────────────
const FloorTile = ({
  position,
  color,
  type,
  texture,
}: {
  position: [number, number, number];
  color: string;
  type: FloorType;
  texture?: THREE.Texture;
}) => {
  const isBone = type === 'BONE';
  const height = isBone ? 0.15 : 1.0;
  // Ensure top face is always at y=0. If height is 1, y is -0.5. If height 0.15, y is -0.075.
  const y = isBone ? -height / 2 : position[1];

  const [ref] = useBox<THREE.Mesh>(() => ({
    type: 'Static',
    position: [position[0], y, position[2]],
    args: [1, height, 1],
    collisionFilterGroup: 1,
    collisionFilterMask: 0xffffffff,
  }));

  return (
    <mesh ref={ref} position={[position[0], y, position[2]]} castShadow receiveShadow>
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

// ── Animated sky backdrop ────────────────────────────────────────────────────
const BackgroundHorizon = () => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color('#050208') },
      uColor2: { value: new THREE.Color('#0d3b0d') },
      uColor3: { value: new THREE.Color('#7e22ce') },
    }),
    [],
  );

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
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
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vPosition;
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uColor3;
          varying vec2 vUv;
          varying vec3 vPosition;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i), hash(i + vec2(1,0)), f.x),
              mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
          }

          void main() {
            float n1 = noise(vPosition.xy * 0.05 + uTime * 0.02);
            float n2 = noise(vPosition.yz * 0.08 - uTime * 0.015);
            vec3 col = mix(uColor1, uColor2, n1);
            col = mix(col, uColor3, n2 * 0.6);

            // Mountain silhouettes
            float m = noise(vec2(vPosition.x * 0.1, 0.0)) * 12.0 - 10.0;
            if (vPosition.y < m) col = mix(col, uColor1 * 0.4, 0.95);

            // Void sun
            vec3 sunDir = normalize(vec3(40.0, 20.0, 40.0));
            float sunD = distance(normalize(vPosition), sunDir);
            col = mix(col, vec3(0.4, 1.0, 0.4), max(0.0, 1.0 - sunD * 6.0) * 0.7);

            gl_FragColor = vec4(col, 1.0);
          }
        `}
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

  // Manual loading to allow property mutation (wrapping) without hook-related lint errors
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const s = loader.load('/textures/stone.jpg');
    const b = loader.load('/textures/bone.jpg');
    s.wrapS = s.wrapT = THREE.RepeatWrapping;
    b.wrapS = b.wrapT = THREE.RepeatWrapping;
    return { stone: s, bone: b };
  }, []);

  const floorBlocks = useMemo(() => {
    const blocks: { pos: [number, number, number]; type: FloorType }[] = [];
    grid.forEach((type, key) => {
      const [x, z] = key.split(',').map(Number);
      // Visual and physics both at y=0; tile height=1, so top face is at y=0.5
      blocks.push({ pos: [x, -0.5, z], type });
    });
    return blocks;
  }, [grid]);

  return (
    <>
      <color attach="background" args={['#050208']} />

      <BackgroundHorizon />
      <DimensionPlane />
      <Tentacles />
      <ParticleSystem />
      <VoidShard />

      {/* Floor tiles */}
      {floorBlocks.map((b, i) => (
        <FloorTile
          key={i}
          position={b.pos}
          color={b.type === 'STONE' ? '#ffffff' : '#ffffff'} // Remove color tinting to see textures clearly
          type={b.type}
          texture={b.type === 'STONE' ? textures.stone : textures.bone}
        />
      ))}
    </>
  );
};
