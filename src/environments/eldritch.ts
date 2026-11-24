import type { EnvironmentDefinition } from "./types";

export const eldritchEnv: EnvironmentDefinition = {
  id: "ELDRITCH",
  name: "Eldritch Domain",
  horizonColors: {
    c1: "#050208",
    c2: "#0d3b0d",
    c3: "#7e22ce"
  },
  backgroundColor: "#050208",
  ambientColor: "#c4b5fd",
  lightIntensity: 1.2,
  fogFloorColor: "#1a0566",
  props: {
    showTentacles: true,
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
