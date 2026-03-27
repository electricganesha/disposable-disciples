import { useFrame } from "@react-three/fiber";
import { useStore } from "../../store";
import * as THREE from "three";
import { useCallback, useState, useRef } from "react";

export const EditorInteraction = () => {
  const { placeAt, removeAt, selectedPaletteItem } = useStore();
  const [hoverPos, setHoverPos] = useState<[number, number, number] | null>(
    null,
  );
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ raycaster, mouse, camera }) => {
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.setFromCamera(mouse, camera);

    if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
      const x = Math.round(intersectPoint.x);
      const y = Math.round(intersectPoint.y);
      if (!hoverPos || hoverPos[0] !== x || hoverPos[1] !== y) {
        setHoverPos([x, y, 0]);
      }
    } else {
      setHoverPos(null);
    }
  });

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!hoverPos) return;
      if (event.button === 0) {
        // Left click
        if (selectedPaletteItem === "REMOVE") {
          removeAt(hoverPos[0], hoverPos[1]);
        } else {
          placeAt(hoverPos[0], hoverPos[1], selectedPaletteItem);
        }
      } else if (event.button === 2) {
        // Right click
        removeAt(hoverPos[0], hoverPos[1]);
      }
    },
    [hoverPos, selectedPaletteItem, placeAt, removeAt],
  );

  return (
    <>
      {/* Invisible plane for intersection */}
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => e.nativeEvent.preventDefault()}
        visible={false}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Preview Ghost / Erase Highlight */}
      {hoverPos && (
        <group position={[hoverPos[0], hoverPos[1], 0]}>
          {selectedPaletteItem === "REMOVE" ? (
            <mesh position={[0, -0.5, 0]}>
              <boxGeometry args={[1.05, 1.05, 1.05]} />
              <meshBasicMaterial
                color="#ef4444"
                wireframe
                transparent
                opacity={0.6}
              />
            </mesh>
          ) : selectedPaletteItem === "G" || selectedPaletteItem === "A" ? (
            <mesh position={[0, 1.0, 0]}>
              <boxGeometry args={[0.8, 2, 0.8]} />
              <meshStandardMaterial
                color={selectedPaletteItem === "G" ? "#3b82f6" : "#a855f7"}
                transparent
                opacity={0.4}
              />
            </mesh>
          ) : selectedPaletteItem === "|" ? (
            <mesh position={[0, -5.5, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 10]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
            </mesh>
          ) : (
            <mesh position={[0, -0.5, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
            </mesh>
          )}
        </group>
      )}
    </>
  );
};
