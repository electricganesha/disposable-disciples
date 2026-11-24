import { parseLayout } from "./parseLayout";
import type { Level } from "./types";

export const ritual3: Level = {
  id: "ritual-3",
  name: "Ritual III: The Abyss",
  description: "A perilous climb across a massive chasm.",
  ...parseLayout(`
                 
                
         S       
       S    A     
 G   S           
###              
| |
    `),
  spawnLimit: 25,
  requiredSaved: 20,
  jobQuotas: { BONE_WEAVER: 1, BLOCKER: 1 },
};
