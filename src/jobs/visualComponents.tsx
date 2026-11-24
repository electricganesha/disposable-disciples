import React from "react";

// Staff rendered inside CultistMesh when actively weaving
export const WeaverStaff: React.FC<{ isActive: boolean; frustumCulled?: boolean }> = ({ isActive, frustumCulled = true }) => {
  return (
    <group position={[0.4, 0.2, 0.3]} rotation={[0.4, 0, -0.2]} visible={isActive}>
      {/* Handle */}
      <mesh castShadow frustumCulled={frustumCulled}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
        <meshStandardMaterial color="#3d2b4d" roughness={0.9} />
      </mesh>
      {/* Orb */}
      <mesh position={[0, 0.6, 0]} castShadow frustumCulled={frustumCulled}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.7} />
      </mesh>
      <pointLight intensity={isActive ? 1.5 : 0} color="#c084fc" distance={2} />
    </group>
  );
};

// Blocker's red base ring mesh — rendered inside CultistMesh
export const BlockerRing: React.FC<{ isActive: boolean; frustumCulled?: boolean }> = ({ isActive, frustumCulled = true }) => (
  <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]} visible={isActive} frustumCulled={frustumCulled}>
    <torusGeometry args={[0.6, 0.02, 8, 32]} />
    <meshStandardMaterial
      color="#ff0000"
      emissive="#ff0000"
      emissiveIntensity={5}
      transparent
      opacity={0.6}
    />
  </mesh>
);

// Floating void ring / halo rendered above the cultist's head when falling
export const FloaterHalo: React.FC<{ isActive: boolean; frustumCulled?: boolean }> = ({ isActive, frustumCulled = true }) => {
  return (
    <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]} visible={isActive} frustumCulled={frustumCulled}>
      <torusGeometry args={[0.3, 0.02, 8, 24]} />
      <meshStandardMaterial
        color="#38bdf8"
        emissive="#0284c7"
        emissiveIntensity={4}
      />
    </mesh>
  );
};
