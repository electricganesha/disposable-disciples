import { Vector3 } from "three";
import type { JobDefinition, JobContext } from "./types";

const BASH_TIME = 1.2;
const SPEED = 1.8;

function tick(ctx: JobContext) {
  const {
    px,
    py,
    pz,
    vy,
    dir,
    delta,
    api,
    targetVxRef,
    digProgress,
    isDigging,
    setIsDigging,
    getFloorAt,
    removeFloorCube,
    addDebris,
    triggerShake,
  } = ctx;

  const speed = SPEED * ctx.speedMultiplier;

  // Chest/torso height block directly ahead
  const aheadX = Math.round(px + dir * 0.8);
  const aheadY = Math.floor(py) + 1;

  const blockAhead = getFloorAt(aheadX, pz, aheadY);
  const isWallSolid = blockAhead && blockAhead !== "STAIR";

  if (isWallSolid) {
    // Stop horizontal movement
    api.velocity.set(0, vy, 0);
    targetVxRef.current = 0;

    if (!isDigging) {
      setIsDigging(true);
    }

    digProgress.current += delta;
    if (digProgress.current >= BASH_TIME) {
      digProgress.current = 0;
      removeFloorCube(aheadX, aheadY);
      addDebris(new Vector3(aheadX, aheadY, pz));
      triggerShake(0.1);
    }
  } else {
    // Walk forward
    if (isDigging) {
      setIsDigging(false);
      digProgress.current = 0;
    }
    const vx = dir * speed;
    targetVxRef.current = vx;
    api.velocity.set(vx, vy, 0);
  }
}

export const basherJob: JobDefinition = {
  id: "BASHER",
  label: "Bash",
  icon: "/images/dig_forward.png",
  mass: 1,
  visuals: {
    bodyColor: "#c2410c", // Deep orange / rust
    eyeColor: "#f97316",  // Glowing orange
    emissiveIntensity: 0.8,
  },
  onTick: tick,
};
