import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SEGMENTS = 8;
const SEGMENT_HEIGHT = 0.4;

const TentacleSegment = ({ index, total }: { index: number; total: number }) => {
  const ref = useRef<THREE.Group>(null!);
  
  // Use state initializer for idempotent random values
  const [params] = useState(() => ({
    factor: Math.random() * 0.5 + 0.5,
    phase: Math.random() * Math.PI * 2,
  }));

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      // Procedural writhing motion
      const wave = Math.sin(t * 2 * params.factor + params.phase + index * 0.5) * 0.2;
      ref.current.rotation.z = wave;
      ref.current.rotation.x = wave * 0.5;
    }
  });

  return (
    <group ref={ref} position={[0, index === 0 ? 0 : SEGMENT_HEIGHT, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.08 * (1 - index / total), 0.1 * (1 - index / total), SEGMENT_HEIGHT, 8]} />
        <meshLambertMaterial color="#2e1052" />
      </mesh>
      {index < total - 1 && <TentacleSegment index={index + 1} total={total} />}
    </group>
  );
};

export const Tentacles = () => {
  const count = 45;
  
  const [positions] = useState(() =>
    Array.from({ length: count }, () => {
      let z = (Math.random() - 0.5) * 22;
      // Ensure tentacles stay away from the central corridor (z=0)
      if (Math.abs(z) < 2.5) {
        z += z > 0 ? 2.5 : -2.5;
      }

      return {
        pos: [(Math.random() - 0.5) * 22, -3.0, z] as [number, number, number],
        scale: Math.random() * 1.5 + 0.5,
        rotation: [0, Math.random() * Math.PI * 2, 0] as [
          number,
          number,
          number,
        ],
      };
    }),
  );

  return (
    <group>
      {positions.map((p, i) => (
        <group key={i} position={p.pos} rotation={p.rotation} scale={p.scale}>
          <TentacleSegment index={0} total={SEGMENTS} />
        </group>
      ))}
    </group>
  );
};
