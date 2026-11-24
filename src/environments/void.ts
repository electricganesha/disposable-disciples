import type { EnvironmentDefinition } from "./types";

export const voidEnv: EnvironmentDefinition = {
  id: "VOID",
  name: "Deep Void",
  horizonColors: {
    c1: "#020205",
    c2: "#051005",
    c3: "#1a1030"
  },
  backgroundColor: "#020205",
  ambientColor: "#8b5cf6",
  lightIntensity: 0.8,
  fogFloorColor: "#080320",
  props: {
    showTentacles: false,
    showShards: true,
    showParticles: true,
    showDimensionPlane: true
  },
  textures: {
    stone: "/textures/stone.jpg",
    bone: "/textures/bone.jpg",
    altar: "/textures/altar.jpg"
  }
};
