/**
 * Job Plugin System — Types
 *
 * To add a new job:
 *  1. Create src/jobs/myJob.ts implementing JobDefinition
 *  2. Import and register it in src/jobs/index.ts
 *
 * That's it — no engine files need to be modified.
 */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type * as THREE from "three";

// ── Physics API subset exposed to each job ───────────────────────────────────
export interface PhysicsApi {
  velocity: {
    set: (x: number, y: number, z: number) => void;
  };
}

// ── Context passed to each job's onTick every frame ──────────────────────────
export interface JobContext {
  // Identity
  id: string;

  // Physics position (live, from cannon)
  px: number;
  py: number;
  pz: number;

  // Physics velocity
  vx: number;
  vy: number;
  vz: number;

  // Direction cultist is facing (+1 = right, -1 = left)
  dir: 1 | -1;

  // Frame delta time in seconds
  delta: number;

  // Physics API – set velocity etc.
  api: PhysicsApi;

  // ── Shared state refs (safe to mutate across frames) ──────────────────────
  weavingRef: MutableRefObject<boolean>;
  weaveProgress: MutableRefObject<number>;
  digProgress: MutableRefObject<number>;
  lastFlipTime: MutableRefObject<number>;
  lastFloorRef: MutableRefObject<{ x: number; y: number } | null>;

  /** Write the net horizontal velocity the job WANTS this frame.
   *  The engine reads this after onTick to drive step-up assist. */
  targetVxRef: MutableRefObject<number>;

  isWeaving: boolean;
  setIsWeaving: Dispatch<SetStateAction<boolean>>;
  isDigging: boolean;
  setIsDigging: Dispatch<SetStateAction<boolean>>;
  isFloating: boolean;
  setIsFloating: Dispatch<SetStateAction<boolean>>;

  // ── Store helpers (read-only snapshot for the frame) ──────────────────────
  // Rather than passing the full Zustand store (circular dep risk), we pass
  // the small slice each job actually needs.
  getFloorAt: (x: number, z: number, targetY?: number) => string | undefined;
  isBlockedAt: (x: number, z: number, excludeId: string) => boolean;
  otherCultists: Array<{
    id: string;
    position: [number, number, number];
    job: string;
  }>;
  altarPosition: [number, number, number];
  staircasePositions: Array<[number, number, number]>;
  addFloorCube: (x: number, z: number) => void;
  removeFloorCube: (x: number, y: number) => void;
  flipDirection: () => void;
  addExplosion: (pos: THREE.Vector3) => void;
  addSuccess: (pos: THREE.Vector3) => void;
  addDebris: (pos: THREE.Vector3) => void;
  triggerShake: (intensity: number) => void;
  removeCultist: (id: string, success?: boolean) => void;
  setWeavingCount: (count: number) => void;
  weavingCount: number;
  speedMultiplier: number;
}

// ── Visual descriptor for the job mesh ───────────────────────────────────────
export interface JobVisuals {
  bodyColor: string;
  eyeColor: string;
  emissiveIntensity?: number;
  opacity?: number;
  /** Called inside the CultistMesh group — return extra JSX for the job */
  ExtraMesh?: React.FC<{ isActive: boolean }>;
}

// ── The full plugin contract ──────────────────────────────────────────────────
export interface JobDefinition {
  /** Must be unique. Used as the Job string value. */
  id: string;

  /** Human-readable label shown in the HUD. */
  label: string;

  /** Path to the icon image shown in HUD button. */
  icon: string;

  /** Visual config for the cultist mesh. */
  visuals: JobVisuals;

  /**
   * Physics mass for cultists with this job.
   * 0 = static (immovable), 1 = dynamic.
   */
  mass: number;

  /**
   * Called every frame for each cultist with this job.
   * Responsible for setting velocity via ctx.api.velocity.set(...).
   */
  onTick: (ctx: JobContext) => void;
}
