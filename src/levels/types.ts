export type FloorType = 'STONE' | 'BONE' | 'SUPPORT' | 'STAIR';

// ── Environment identifiers ──────────────────────────────────────────────────
export type EnvironmentType = string;

// ── Level definition ─────────────────────────────────────────────────────────
export interface Level {
  /** Unique slug, e.g. "ritual-1" */
  id: string;

  /** Displayed in the start/victory screen */
  name: string;

  /** Flavour text shown on the level-select or loading screen */
  description: string;

  // ── World geometry ─────────────────────────────────────────────────────────
  gridData: { [key: string]: FloorType };
  gatePosition: [number, number, number];
  altarPosition: [number, number, number];
  staircasePositions?: [number, number, number][];
  pillarPositions?: [number, number, number][];

  // ── Gameplay parameters ────────────────────────────────────────────────────
  /** Total cultists that will spawn through the gate */
  spawnLimit: number;

  /** Minimum cultists who must reach the altar to win */
  requiredSaved: number;

  /**
   * Maximum number of cultists with each job allowed at one time.
   * e.g. { BONE_WEAVER: 2, BLOCKER: 1 }
   */
  jobQuotas: { [jobId: string]: number };

  // ── Environment theming ────────────────────────────────────────────────────
  environmentType?: EnvironmentType;
  backgroundColor?: string;
  fogColor?: string;
  ambientColor?: string;
  lightIntensity?: number;

  /**
   * Optional custom win/loss logic.
   * Return 'WIN', 'LOSE', or 'PLAYING'.
   *
   * If omitted the default rule applies:
   *   WIN  → savedCount >= requiredSaved
   *   LOSE → all spawned, none left, savedCount < requiredSaved
   */
  winCondition?: (state: {
    savedCount: number;
    lostCount: number;
    totalSpawned: number;
    totalSpawningLimit: number;
    activeCultistCount: number;
    requiredSavedCount: number;
  }) => "WIN" | "LOSE" | "PLAYING";
}
