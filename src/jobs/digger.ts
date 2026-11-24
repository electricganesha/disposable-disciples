import { Vector3 } from "three";
import type { JobDefinition, JobContext } from "./types";

const DIG_TIME = 0.8;
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
    lastFlipTime,
    digProgress,
    lastFloorRef,
    isDigging,
    setIsDigging,
    isBlockedAt,
    getFloorAt,
    removeFloorCube,
    addDebris,
  } = ctx;

  const speed = SPEED * ctx.speedMultiplier;

  // Latch to the floor column we last touched
  const targetX = lastFloorRef.current ? lastFloorRef.current.x : Math.round(px);
  const targetY = lastFloorRef.current ? lastFloorRef.current.y : Math.floor(py);

  const floorBelow = getFloorAt(targetX, pz, targetY);

  if (floorBelow) {
    api.velocity.set(0, vy, 0);
    targetVxRef.current = 0;

    if (!isDigging) {
      setIsDigging(true);
    }

    digProgress.current += delta;
    if (digProgress.current >= DIG_TIME) {
      digProgress.current = 0;
      removeFloorCube(targetX, targetY);
      addDebris(new Vector3(targetX, targetY, pz));
    }
  } else {
    const isFalling = Math.abs(vy) > 0.1;

    if (isFalling || isDigging) {
      api.velocity.set(0, vy, 0);
      targetVxRef.current = 0;
    } else {
      // Walk until we find another block to dig
      const aheadX = px + dir * 0.6;
      const blocked = isBlockedAt(aheadX, pz, ctx.id);
      const vx = blocked ? 0 : dir * speed;
      targetVxRef.current = vx;
      api.velocity.set(vx, vy, 0);

      // Flip on blocker
      if (blocked) {
        const now = Date.now();
        if (now - lastFlipTime.current > 500) {
          lastFlipTime.current = now;
          ctx.flipDirection();
        }
      }
    }

    if (isDigging && !isFalling) {
      setIsDigging(false);
    }
  }
}

export const diggerJob: JobDefinition = {
  id: "DIGGER",
  label: "Dig",
  icon: "/images/dig_down.png",
  mass: 1,
  visuals: {
    bodyColor: "#2f4f4f",
    eyeColor: "#ef4444",
    emissiveIntensity: 0,
    opacity: 1.0,
  },
  onTick: tick,
};
