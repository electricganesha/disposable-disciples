/**
 * JOB_REGISTRY — Central registry for all job/behavior plugins.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * HOW TO ADD A NEW JOB
 * ──────────────────────────────────────────────────────────────────────────────
 * 1. Create `src/jobs/myJob.ts` (or .tsx if you need JSX for the mesh).
 *    It must export a const that implements `JobDefinition` from `./types`.
 *
 * 2. Import it here and add it to the `jobs` array below.
 *
 * That's it — no changes to the engine, store, or HUD are needed.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import type { JobDefinition } from "./types";
import { noneJob } from "./none";
import { blockerJob } from "./blocker";
import { boneWeaverJob } from "./boneWeaver";
import { diggerJob } from "./digger";
import { berserkerJob } from "./berserker";
import { climberJob } from "./climber";
import { floaterJob } from "./floater";
import { basherJob } from "./basher";

// ── Register all jobs here ───────────────────────────────────────────────────
const jobs: JobDefinition[] = [
  noneJob,
  blockerJob,
  boneWeaverJob,
  diggerJob,
  berserkerJob,
  climberJob,
  floaterJob,
  basherJob,
];

// ── Build lookup map: job id → definition ────────────────────────────────────
export const JOB_REGISTRY = new Map<string, JobDefinition>(
  jobs.map((j) => [j.id, j]),
);

/**
 * Returns all registered jobs in insertion order.
 * The HUD uses this to render job buttons dynamically.
 */
export const getRegisteredJobs = (): JobDefinition[] => jobs;

export type { JobDefinition } from "./types";
export type { JobContext } from "./types";
