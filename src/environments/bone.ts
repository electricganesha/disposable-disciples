import type { EnvironmentDefinition } from "./types";

export const boneEnv: EnvironmentDefinition = {
  id: "BONE",
  name: "Ossuary of Spirits",
  horizonColors: {
    c1: "#1a1510",
    c2: "#2a2015",
    c3: "#4a3020"
  },
  backgroundColor: "#1a1510",
  ambientColor: "#fde68a",
  lightIntensity: 1.5,
  fogFloorColor: "#2a1a08",
  props: {
    showTentacles: true,
    showShards: false,
    showParticles: true,
    showDimensionPlane: true
  },
  textures: {
    stone: "/textures/bone.jpg",
    bone: "/textures/bone.jpg",
    altar: "/textures/stone.jpg"
  }
};
