import type { EnvironmentDefinition } from "./types";

export const lavaEnv: EnvironmentDefinition = {
  id: "LAVA",
  name: "Molten Core",
  horizonColors: {
    c1: "#110000",
    c2: "#450a0a",
    c3: "#facc15"
  },
  backgroundColor: "#110000",
  ambientColor: "#f87171",
  lightIntensity: 2.0,
  fogFloorColor: "#3a0800",
  props: {
    showTentacles: false,
    showShards: false,
    showParticles: true,
    showDimensionPlane: true
  },
  textures: {
    stone: "/textures/stone.jpg",
    bone: "/textures/stone.jpg",
    altar: "/textures/altar.jpg"
  }
};
