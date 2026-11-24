import { WeaverStaff } from "./visualComponents";
import type { JobDefinition, JobContext } from "./types";

const WEAVE_TIME = 1.4; // seconds to build one floor tile
const SPEED = 1.8;

function tick(ctx: JobContext) {
  const {
    id,
    px,
    py,
    pz,
    vy,
    dir,
    delta,
    api,
    targetVxRef,
    weavingRef,
    weaveProgress,
    setIsWeaving,
    isBlockedAt,
    getFloorAt,
    addFloorCube,
    setWeavingCount,
    weavingCount,
    staircasePositions,
    altarPosition,
  } = ctx;

  const speed = SPEED * ctx.speedMultiplier;
  // Use round(py - 0.35) so the Y is stable even when the cultist is fractionally
  // above a tile edge (prevents targetY from dropping a full level when py=0.99).
  const targetY = Math.round(py - 0.35);

  // We only care about gaps within reach: Math.round(px) or Math.round(px) + dir
  const currentX = Math.round(px);
  const nextX = currentX + dir;

  // Helper to check if a column is occupied by a floor/altar/staircase
  const isFloorAt = (xCol: number) => {
    if (getFloorAt(xCol, pz, targetY)) return true;
    // Altar is ~2 units wide; use <= 1.0 to cover both side columns.
    const isAltarColumn = Math.abs(xCol - altarPosition[0]) <= 1.0;
    const isStairColumn = staircasePositions.some(
      (p) => Math.round(p[0]) === xCol
    );
    return isAltarColumn || isStairColumn;
  };

  let firstGapX: number | null = null;
  if (!isFloorAt(currentX)) {
    firstGapX = currentX;
  } else if (!isFloorAt(nextX)) {
    firstGapX = nextX;
  }

  // Do not build bridges if a staircase exists in the target column
  const isUnderStairs = firstGapX !== null && staircasePositions.some(
    (p) => Math.round(p[0]) === firstGapX
  );

  const withinReach = firstGapX !== null && Math.abs(firstGapX - px) <= 1.2;

  if (withinReach && !isUnderStairs && firstGapX !== null) {
    // Stop and weave
    api.velocity.set(0, vy, 0);
    targetVxRef.current = 0;

    if (!weavingRef.current) {
      weavingRef.current = true;
      setIsWeaving(true);
      setWeavingCount(weavingCount + 1);
    }

    weaveProgress.current += delta;
    if (weaveProgress.current >= WEAVE_TIME) {
      weaveProgress.current = 0;
      addFloorCube(firstGapX, targetY);
    }
  } else {
    const blocked = isBlockedAt(px + dir * 0.6, pz, id);
    const vx = blocked ? 0 : dir * speed;
    targetVxRef.current = vx;
    api.velocity.set(vx, vy, 0);

    if (weavingRef.current) {
      weavingRef.current = false;
      setIsWeaving(false);
      setWeavingCount(Math.max(0, weavingCount - 1));
    }
  }
}

export const boneWeaverJob: JobDefinition = {
  id: "BONE_WEAVER",
  label: "Weave",
  icon: "/images/weaver_icon.png",
  mass: 1,
  visuals: {
    bodyColor: "#5a3a7f",
    eyeColor: "#c084fc",
    emissiveIntensity: 0.5,
    opacity: 1.0,
    ExtraMesh: WeaverStaff,
  },
  onTick: tick,
};
