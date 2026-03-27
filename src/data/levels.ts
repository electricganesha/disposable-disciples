import type { FloorType } from "../store";

export interface Level {
  id: string;
  name: string;
  description: string;
  gridData: { [key: string]: FloorType };
  gatePosition: [number, number, number];
  altarPosition: [number, number, number];
  staircasePositions?: [number, number, number][];
  pillarPositions?: [number, number, number][];
  spawnLimit: number;
  requiredSaved: number;
  jobQuotas: { [key: string]: number };
  // Environment parameters
  environmentType?: "ELDRITCH" | "VOID" | "BONE";
  backgroundColor?: string;
  fogColor?: string;
  ambientColor?: string;
  lightIntensity?: number;
}

/**
 * Converts a multi-line string into level data.
 * # = STONE (floor), B = BONE (floor), . = EMPTY
 * G = GATE, A = ALTAR, S = STAIR/STEP, | = PILLAR
 * The parser finds the first line with floor tiles (#/B) and uses that as y=0.
 * Lines above are positive y, lines below are negative y.
 */
export function parseLayout(
  layout: string,
  startX = -8,
): {
  gridData: { [key: string]: FloorType };
  gatePosition: [number, number, number];
  altarPosition: [number, number, number];
  staircasePositions: [number, number, number][];
  pillarPositions: [number, number, number][];
} {
  const lines = layout
    .split("\n")
    .filter((l) => l.trim().length > 0 || l.includes("|"));
  const gridData: { [key: string]: FloorType } = {};
  let gatePosition: [number, number, number] = [0, 1.2, 0];
  let altarPosition: [number, number, number] = [0, 1.3, 0];
  const staircasePositions: [number, number, number][] = [];
  const pillarPositions: [number, number, number][] = [];

  // Find the "floor" line (the one with # or B) to center Y=0
  let floorRow = lines.findIndex(
    (line) => line.includes("#") || line.includes("B"),
  );
  if (floorRow === -1) floorRow = lines.length - 1; // Fallback

  lines.forEach((line, row) => {
    // Current mapping: floor is at y=0, lines above are y=1, 2... lines below are y=-1...
    const y = floorRow - row;

    [...line].forEach((char, col) => {
      const x = startX + col;
      const pos: [number, number, number] = [x, y, 0];

      switch (char) {
        case "#":
          gridData[`${x},${y}`] = "STONE";
          break;
        case "B":
          gridData[`${x},${y}`] = "BONE";
          break;
        case "C":
          gridData[`${x},${y}`] = "SUPPORT";
          break;
        case "G":
          gatePosition = [x, y + 0.1, 0];
          break;
        case "A":
          altarPosition = [x, y + 0.1, 0];
          break;
        case "S":
          staircasePositions.push(pos);
          break;
        case "|":
          pillarPositions.push(pos);
          break;
      }
    });
  });

  return {
    gridData,
    gatePosition,
    altarPosition,
    staircasePositions,
    pillarPositions,
  };
}

export const RITUAL_LEVELS: Level[] = [
  {
    id: "ritual-1",
    name: "Ritual I: The Awakening",
    description: "A simple gap between two stone platforms.",
    ...parseLayout(`
                  
                 S
 G              SCA
#######......#####|
| | | |      | | ||
    `),
    spawnLimit: 15,
    requiredSaved: 10,
    jobQuotas: { BONE_WEAVER: 1, BLOCKER: 1 },
  },
  {
    id: "ritual-2",
    name: "Ritual II: The Divided Path",
    description: "The void has claimed more of the world. Two gaps.",
    ...parseLayout(`
 G                 
###################
| | | |#####| | | |
| | | |#####| | | |
| | | |#####| | | |
       ##A##
    `),
    spawnLimit: 20,
    requiredSaved: 15,
    jobQuotas: { BLOCKER: 2, DIGGER: 1 },
  },
  {
    id: "ritual-3",
    name: "Ritual III: The Abyss",
    description: "A perilous climb across a massive chasm.",
    ...parseLayout(`
           A
         S
       S
 G   S
###..
| |
    `),
    spawnLimit: 25,
    requiredSaved: 20,
    jobQuotas: { BONE_WEAVER: 1, BLOCKER: 1 },
  },
];
