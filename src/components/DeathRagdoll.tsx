import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBox, useSphere, usePointToPointConstraint } from "@react-three/cannon";
import { useStore, type RagdollData } from "../store";

const RAGDOLL_DURATION = 4000;

const Joint = ({ bodyA, bodyB, pivotA, pivotB }: { 
  bodyA: React.MutableRefObject<THREE.Object3D>, 
  bodyB: React.MutableRefObject<THREE.Object3D>, 
  pivotA: [number, number, number], 
  pivotB: [number, number, number] 
}) => {
  usePointToPointConstraint(bodyA, bodyB, { pivotA, pivotB });
  return null;
};

export const DeathRagdoll = ({ data }: { data: RagdollData }) => {
  const { position } = data;
  const color = "#3d2b4d"; // Default cultist color
  const headColor = "#f5f5dc";

  const [tRef] = useBox<THREE.Mesh>(() => ({ 
    mass: 2, 
    position: [position.x, position.y + 0.5, position.z],
    args: [0.3, 0.4, 0.2],
    collisionFilterGroup: 4,
    collisionFilterMask: 1,
  }));
  
  const [hRef] = useSphere<THREE.Mesh>(() => ({ 
    mass: 1, 
    position: [position.x, position.y + 0.8, position.z],
    args: [0.15],
    collisionFilterGroup: 4,
    collisionFilterMask: 1,
  }));

  const [laRef] = useBox<THREE.Mesh>(() => ({ 
    mass: 0.5, 
    position: [position.x - 0.2, position.y + 0.5, position.z],
    args: [0.1, 0.3, 0.1],
    collisionFilterGroup: 4,
    collisionFilterMask: 1,
  }));

  const [raRef] = useBox<THREE.Mesh>(() => ({ 
    mass: 0.5, 
    position: [position.x + 0.2, position.y + 0.5, position.z],
    args: [0.1, 0.3, 0.1],
    collisionFilterGroup: 4,
    collisionFilterMask: 1,
  }));

  const [llRef] = useBox<THREE.Mesh>(() => ({ 
    mass: 0.8, 
    position: [position.x - 0.1, position.y + 0.2, position.z],
    args: [0.12, 0.3, 0.12],
    collisionFilterGroup: 4,
    collisionFilterMask: 1,
  }));

  const [rlRef] = useBox<THREE.Mesh>(() => ({ 
    mass: 0.8, 
    position: [position.x + 0.1, position.y + 0.2, position.z],
    args: [0.12, 0.3, 0.12],
    collisionFilterGroup: 4,
    collisionFilterMask: 1,
  }));

  useFrame(() => {
    const elapsed = Date.now() - data.time;
    if (elapsed > RAGDOLL_DURATION) {
      useStore.getState().removeRagdoll(data.id);
    }
  });

  return (
    <group>
      <mesh ref={tRef} castShadow><boxGeometry args={[0.3, 0.4, 0.2]} /><meshStandardMaterial color={color} /></mesh>
      <mesh ref={hRef} castShadow><sphereGeometry args={[0.15]} /><meshStandardMaterial color={headColor} /></mesh>
      <mesh ref={laRef} castShadow><boxGeometry args={[0.1, 0.3, 0.1]} /><meshStandardMaterial color={color} /></mesh>
      <mesh ref={raRef} castShadow><boxGeometry args={[0.1, 0.3, 0.1]} /><meshStandardMaterial color={color} /></mesh>
      <mesh ref={llRef} castShadow><boxGeometry args={[0.12, 0.3, 0.12]} /><meshStandardMaterial color={color} /></mesh>
      <mesh ref={rlRef} castShadow><boxGeometry args={[0.12, 0.3, 0.12]} /><meshStandardMaterial color={color} /></mesh>

      {/* Constraints */}
      <Joint bodyA={tRef as any} bodyB={hRef as any} pivotA={[0, 0.2, 0]} pivotB={[0, -0.15, 0]} />
      <Joint bodyA={tRef as any} bodyB={laRef as any} pivotA={[-0.15, 0.15, 0]} pivotB={[0, 0.15, 0]} />
      <Joint bodyA={tRef as any} bodyB={raRef as any} pivotA={[0.15, 0.15, 0]} pivotB={[0, 0.15, 0]} />
      <Joint bodyA={tRef as any} bodyB={llRef as any} pivotA={[-0.1, -0.2, 0]} pivotB={[0, 0.15, 0]} />
      <Joint bodyA={tRef as any} bodyB={rlRef as any} pivotA={[0.1, -0.2, 0]} pivotB={[0, 0.15, 0]} />
    </group>
  );
};
