import { parseLayout } from "./parseLayout";
import type { Level } from "./types";

export const ritual2: Level = {
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
};
