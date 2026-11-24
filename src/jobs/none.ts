import type { JobDefinition, JobContext } from "./types";

const SPEED = 1.8;

function tick(ctx: JobContext) {
  const {
    px,
    py,
    pz,
    vy,
    dir,
    id,
    api,
    targetVxRef,
    lastFlipTime,
    isBlockedAt,
    otherCultists,
    flipDirection,
    getFloorAt,
  } = ctx;

  const speed = SPEED * ctx.speedMultiplier;

  const { altarPosition } = ctx;

  const aheadX = px + dir * 0.6;
  const blocked = isBlockedAt(aheadX, pz, id);

  // Don't treat the altar pedestal as a solid wall — it's the destination.
  const aheadIsAltarColumn = Math.abs((px + dir * 0.7) - altarPosition[0]) <= 1.0;
  const wallAhead = !aheadIsAltarColumn && getFloorAt(px + dir * 0.7, pz, Math.floor(py) + 1);
  const isWallSolid = wallAhead && wallAhead !== "STAIR";

  if (blocked || isWallSolid) {
    const now = Date.now();
    if (now - lastFlipTime.current > 500) {
      lastFlipTime.current = now;
      flipDirection();
    }
    targetVxRef.current = 0;
    api.velocity.set(0, vy, 0);
    return;
  }

  // Separation: flip if another cultist is too close ahead
  const tooClose = otherCultists.some(
    (other) =>
      other.id !== id &&
      other.job !== "BLOCKER" &&
      Math.abs(other.position[2] - pz) < 0.5 &&
      Math.sign(other.position[0] - px) === dir &&
      Math.abs(other.position[0] - px) < 0.75,
  );

  if (tooClose) {
    const now = Date.now();
    if (now - lastFlipTime.current > 600) {
      lastFlipTime.current = now;
      flipDirection();
    }
    targetVxRef.current = 0;
    api.velocity.set(0, vy, 0);
    return;
  }

  targetVxRef.current = dir * speed;
  api.velocity.set(dir * speed, vy, 0);
}

export const noneJob: JobDefinition = {
  id: "NONE",
  label: "Wander",
  icon: "/images/wanderer_icon.png",
  mass: 1,
  visuals: {
    bodyColor: "#3d2b4d",
    eyeColor: "#c5af22",
    emissiveIntensity: 0,
    opacity: 1.0,
  },
  onTick: tick,
};
