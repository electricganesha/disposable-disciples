import { useFrame } from "@react-three/fiber";
import { useStore } from "../../store";

export const CameraShake = () => {
  const shakeIntensity = useStore((s) => s.shakeIntensity);
  const decayShake = useStore((s) => s.decayShake);

  useFrame((state) => {
    if (shakeIntensity > 0.005) {
      const dx = (Math.random() - 0.5) * shakeIntensity;
      const dy = (Math.random() - 0.5) * shakeIntensity;
      const dz = (Math.random() - 0.5) * shakeIntensity;
      state.camera.position.x += dx;
      state.camera.position.y += dy;
      state.camera.position.z += dz;
      
      decayShake();
    }
  });

  return null;
};
