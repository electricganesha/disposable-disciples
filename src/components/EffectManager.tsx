import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useVoxelStore } from '../hooks/useVoxelStore';
import type { Effect } from '../hooks/useVoxelStore';
import { InstancedMesh, Object3D, Vector3, Mesh } from 'three';

const tempObject = new Object3D();

export const EffectManager = () => {
  const effects = useVoxelStore(s => s.effects);

  return (
    <group>
      {effects.map((effect) => (
        effect.type === 'DEBRIS' ? (
          <Debris key={effect.id} {...effect} />
        ) : (
          <Explosion key={effect.id} {...effect} />
        )
      ))}
    </group>
  );
};

interface ParticleData {
  position: Vector3;
  velocity: Vector3;
  scale: number;
  life: number;
}

const Debris = ({ x, y, z, color }: Effect) => {
  const meshRef = useRef<InstancedMesh>(null);
  const count = 12;
  const particles = useRef<ParticleData[]>([]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Initialize particles on first frame
    if (particles.current.length === 0) {
      particles.current = Array.from({ length: count }).map(() => ({
        position: new Vector3(x, y, z),
        velocity: new Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 5 + 2,
          (Math.random() - 0.5) * 4
        ),
        scale: Math.random() * 0.15 + 0.05,
        life: 1.0,
      }));
    }

    particles.current.forEach((p, i) => {
      p.velocity.y -= 9.8 * delta; // Gravity
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.life -= delta * 0.8;
      
      tempObject.position.copy(p.position);
      tempObject.scale.setScalar(Math.max(0, p.life * p.scale));
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </instancedMesh>
  );
};

const Explosion = ({ x, y, z }: Effect) => {
  const meshRef = useRef<InstancedMesh>(null);
  const ringRef = useRef<Mesh>(null);
  const count = 40;
  const particles = useRef<ParticleData[]>([]);

  useFrame((_state, delta) => {
    // Initialize particles on first frame
    if (meshRef.current && particles.current.length === 0) {
      particles.current = Array.from({ length: count }).map(() => ({
        position: new Vector3(x, y, z),
        velocity: new Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        ),
        scale: Math.random() * 0.3 + 0.2,
        life: 1.0,
      }));
    }

    if (meshRef.current && particles.current.length > 0) {
      particles.current.forEach((p, i) => {
        p.position.add(p.velocity.clone().multiplyScalar(delta));
        p.velocity.multiplyScalar(0.95);
        p.life -= delta * 1.5;
        
        tempObject.position.copy(p.position);
        tempObject.scale.setScalar(Math.max(0, p.life * p.scale));
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (ringRef.current) {
      ringRef.current.scale.addScalar(delta * 15);
      const mat = ringRef.current.material as any;
      if (mat && mat.opacity > 0) mat.opacity -= delta * 2;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff0000" emissiveIntensity={2} transparent />
      </instancedMesh>
      
      {/* Shockwave ring */}
      <mesh ref={ringRef} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.2, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};
