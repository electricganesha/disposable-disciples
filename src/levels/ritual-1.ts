import { parseLayout } from "./parseLayout";
import type { Level } from "./types";

export const ritual1: Level = {
  id: "ritual-1",
  name: "Ritual I: The Awakening",
  description: "A simple gap between two stone platforms.",
  ...parseLayout(`
              
                S   
 G             SCA  
########      #####|
 | | | |      | | ||
  `),
  spawnLimit: 15,
  requiredSaved: 10,
  jobQuotas: { BONE_WEAVER: 1, BLOCKER: 1 },
};
