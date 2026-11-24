import { BlockerRing } from "./visualComponents";
import type { JobDefinition, JobContext } from "./types";

function tick(ctx: JobContext) {
  // Blockers are static — cannon mass=0 handles it, just zero velocity
  ctx.api.velocity.set(0, 0, 0);
  ctx.targetVxRef.current = 0;
}

export const blockerJob: JobDefinition = {
  id: "BLOCKER",
  label: "Halt",
  icon: "/images/blocker_icon.png",
  mass: 0,
  visuals: {
    bodyColor: "#8b0000",
    eyeColor: "#ff3333",
    emissiveIntensity: 0,
    opacity: 0.95,
    ExtraMesh: BlockerRing,
  },
  onTick: tick,
};
