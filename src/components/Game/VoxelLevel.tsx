import { useMemo, useEffect, useRef } from "react";
import { useVoxelStore } from "../../hooks/useVoxelStore";
import type { VoxelType } from "../../hooks/useVoxelStore";
import { InstancedMesh, Object3D, Color } from "three";
import { useBox } from "@react-three/cannon";

const tempObject = new Object3D();
const tempColor = new Color();

const VOXEL_COLORS: Record<VoxelType, string> = {
  DIRT: "#8B4513",
  GRASS: "#228B22",
  ROCK: "#808080",
  EMPTY: "#000000",
};

export const VoxelLevel = () => {
  const { voxels, initLevel } = useVoxelStore();
  const meshRef = useRef<InstancedMesh>(null);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  const voxelList = useMemo(() => {
    return Object.entries(voxels).map(([key, type]) => {
      const [x, y, z] = key.split(",").map(Number);
      return { x, y, z, type };
    });
  }, [voxels]);

  // Update instanced mesh
  useEffect(() => {
    if (!meshRef.current) return;

    voxelList.forEach((voxel, i) => {
      tempObject.position.set(voxel.x, voxel.y, voxel.z);
      tempObject.updateMatrix();
      meshRef.current?.setMatrixAt(i, tempObject.matrix);
      tempColor.set(VOXEL_COLORS[voxel.type]);
      meshRef.current?.setColorAt(i, tempColor);
    });

    meshRef.current.count = voxelList.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;
  }, [voxelList]);

  // For simplicity in physics, we'll create individual boxes for voxels
  // In a real voxel engine, we'd combine them, but for Lemmings, this is okay for small levels.
  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, 1000]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.6} metalness={0.1} />
      </instancedMesh>

      {voxelList.map((voxel) => (
        <VoxelPhysics key={`${voxel.x},${voxel.y},${voxel.z}`} {...voxel} />
      ))}
    </group>
  );
};

const VoxelPhysics = ({ x, y, z }: { x: number; y: number; z: number }) => {
  useBox(() => ({
    type: "Static",
    position: [x, y, z],
    args: [1, 1, 1],
    material: "voxel",
    collisionFilterGroup: 1, // GROUP_VOXEL
  }));
  return null;
};
