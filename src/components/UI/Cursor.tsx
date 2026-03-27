import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointLight } from 'three';

export const Cursor = () => {
  const lightRef = useRef<PointLight>(null!);
  const { mouse, camera } = useThree();

  useFrame(() => {
    // Convert mouse to 3D world position at y=1
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.y / dir.y;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    
    if (lightRef.current) {
      lightRef.current.position.set(pos.x, 3, pos.z);
    }
  });

  return (
    <pointLight
      ref={lightRef}
      intensity={10}
      distance={12}
      color="#e9d5ff"
      castShadow
    />
  );
};

import * as THREE from 'three';
