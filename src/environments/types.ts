export interface EnvironmentDefinition {
  id: string;
  name: string;
  
  // Horizon shader colors
  horizonColors: {
    c1: string;
    c2: string;
    c3: string;
  };

  // Scene colors
  backgroundColor: string;
  ambientColor: string;
  lightIntensity: number;

  // Volumetric fog floor tint
  fogFloorColor?: string;

  // Fog (optional)
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;

  // Props to render in this environment
  props: {
    showTentacles?: boolean;
    showShards?: boolean;
    showParticles?: boolean;
    showDimensionPlane?: boolean;
  };

  // Textures for this theme
  textures: {
    stone: string;
    bone: string;
    altar: string;
  };
}

