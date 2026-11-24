import type { JobDefinition, JobContext } from "./types";

const WALK_SPEED = 1.8;
const CLIMB_SPEED = 1.6;

function tick(ctx: JobContext) {
  const {
    px,
    py,
    pz,
    vy,
    dir,
    api,
    targetVxRef,
    getFloorAt,
  } = ctx;

  // Check if there is a wall directly in front at head or chest height
  const blockAhead = getFloorAt(px + dir * 0.7, pz, Math.floor(py) + 1) || 
                     getFloorAt(px + dir * 0.7, pz, Math.floor(py));
  const isWallSolid = blockAhead && blockAhead !== "STAIR";

  if (isWallSolid) {
    // Climb up!
    // Set vertical velocity to climb speed and push slightly into the wall
    api.velocity.set(dir * 0.15, CLIMB_SPEED, 0);
    targetVxRef.current = 0; // Disable horizontal step-up assist while climbing
  } else {
    // Normal walk
    const speed = WALK_SPEED * ctx.speedMultiplier;
    targetVxRef.current = dir * speed;
    api.velocity.set(dir * speed, vy, 0);
  }
}

export const climberJob: JobDefinition = {
  id: "CLIMBER",
  label: "Climb",
  icon: "/images/wanderer_icon.png",
  mass: 1,
  visuals: {
    bodyColor: "#0284c7", // Sky blue
    eyeColor: "#38bdf8",  // Glowing light blue
    emissiveIntensity: 0.8,
  },
  onTick: tick,
};
