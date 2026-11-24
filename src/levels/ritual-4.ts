import type { Level } from "./types";
import { parseLayout } from "./parseLayout";

const layout = `
.....................
.....................
.....................
...G.................
...####...########...
.......#.#...........
.......#.#....A......
.......###...###.....
.....................
.....................
`;

export const ritual4: Level = {
  id: "ritual-4",
  name: "Ritual IV: The Molten Core",
  description: "A trial by fire. The ritual demands absolute perfection — any soul lost to the abyss will void the pact.",
  
  ...parseLayout(layout),
  
  spawnLimit: 10,
  requiredSaved: 10, // All of them!
  jobQuotas: {
    BERSERKER: 1, // Only one speedster allowed
    BONE_WEAVER: 2,
    BLOCKER: 1,
    DIGGER: 0
  },

  environmentType: "LAVA",
  backgroundColor: "#110000",
  ambientColor: "#f87171",
  lightIntensity: 2.2,

  // Custom victory: must lose ZERO cultists
  winCondition: (state) => {
    if (state.lostCount > 0) return "LOSE";
    if (state.savedCount >= state.requiredSavedCount) return "WIN";
    return "PLAYING";
  }
};
