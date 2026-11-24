import type { Level } from "./types";
import { ritual1 } from "./ritual-1";
import { ritual2 } from "./ritual-2";
import { ritual3 } from "./ritual-3";
import { ritual4 } from "./ritual-4";

/**
 * LEVEL_REGISTRY — Central registry for all game levels.
 * 
 * To add a new level:
 * 1. Create a new file like `src/levels/my-ritual.ts`.
 * 2. Import it here and add it to the LEVEL_REGISTRY array.
 */
export const LEVEL_REGISTRY: Level[] = [
  ritual1,
  ritual2,
  ritual3,
  ritual4,
];

export type { Level } from "./types";
export { parseLayout } from "./parseLayout";
