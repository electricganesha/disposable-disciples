import { useRef, useState, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore, type ExplosionData } from "../../store";

const PARTICLE_COUNT = 32;
const DURATION = 1200; // ms

const SingleExplosion = ({ data }: { data: ExplosionData }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const [tempObject] = useState(() => new THREE.Object3D());

  // Use state initializer for idempotent random values
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.2) * 8,
        (Math.random() - 0.5) * 6,
      ),
      position: new THREE.Vector3(0, 0, 0),
      scale: Math.random() * 0.12 + 0.04,
    })),
  );

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - data.time;
    const progress = elapsed / DURATION;

    if (progress >= 1) {
      useStore.getState().removeExplosion(data.id);
      return;
    }

    particles.forEach((p, i) => {
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.y -= 12 * delta; // Gravity on particles

      const s = p.scale * (1.2 - progress);
      tempObject.position.copy(p.position);
      tempObject.scale.setScalar(Math.max(0, s));
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLE_COUNT]}
      position={data.position}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color="#9333ea"
        emissive="#9333ea"
        emissiveIntensity={3}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  );
};

const SuccessBurst = ({ data }: { data: ExplosionData }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const [tempObject] = useState(() => new THREE.Object3D());
  const COUNT = 24;
  const WIN_DURATION = 2000;

  const [particles] = useState(() =>
    Array.from({ length: COUNT }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 4 + 2, // Upward movement
        (Math.random() - 0.5) * 2,
      ),
      position: new THREE.Vector3(0, 0, 0),
      scale: Math.random() * 0.15 + 0.05,
      rotationSpeed: (Math.random() - 0.5) * 5,
    })),
  );

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - data.time;
    const progress = elapsed / WIN_DURATION;

    if (progress >= 1) {
      useStore.getState().removeSuccess(data.id);
      return;
    }

    particles.forEach((p, i) => {
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.y += 2 * delta; // Upward acceleration (Soul float)

      const s = p.scale * (1.0 - progress);
      tempObject.position.copy(p.position);
      tempObject.scale.setScalar(Math.max(0, s));
      tempObject.rotation.y += p.rotationSpeed * delta;
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      position={data.position}
    >
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial
        color="#22c55e" // Success Green
        emissive="#22c55e"
        emissiveIntensity={4}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
};

const DebrisBurst = ({ data }: { data: ExplosionData }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const [tempObject] = useState(() => new THREE.Object3D());
  const COUNT = 16;
  const DEBRIS_DURATION = 1000; // 1s

  const [particles] = useState(() =>
    Array.from({ length: COUNT }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 3.5,
        Math.random() * 4.5 + 2.0, // upward burst
        (Math.random() - 0.5) * 2.0,
      ),
      position: new THREE.Vector3(0, 0, 0),
      scale: Math.random() * 0.08 + 0.04,
    })),
  );

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - data.time;
    const progress = elapsed / DEBRIS_DURATION;

    if (progress >= 1) {
      useStore.getState().removeDebris(data.id);
      return;
    }

    particles.forEach((p, i) => {
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.y -= 14 * delta; // Gravity on debris

      const s = p.scale * (1.0 - progress);
      tempObject.position.copy(p.position);
      tempObject.scale.setScalar(Math.max(0, s));
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      position={data.position}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#7c2d12" // Stone brown / reddish void stone
        roughness={0.9}
      />
    </instancedMesh>
  );
};

export const ParticleSystem = memo(() => {
  const explosions = useStore((state) => state.explosions);
  const successes = useStore((state) => state.successes);
  const debris = useStore((state) => state.debris);

  return (
    <group>
      {explosions.map((exp) => (
        <SingleExplosion key={exp.id} data={exp} />
      ))}
      {successes.map((suc) => (
        <SuccessBurst key={suc.id} data={suc} />
      ))}
      {debris.map((deb) => (
        <DebrisBurst key={deb.id} data={deb} />
      ))}
    </group>
  );
});

ParticleSystem.displayName = "ParticleSystem";
