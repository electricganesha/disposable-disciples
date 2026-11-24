import { FloaterHalo } from "./visualComponents";
import type { JobDefinition, JobContext } from "./types";

const SPEED = 1.8;

function tick(ctx: JobContext) {
  const {
    vy,
    dir,
    api,
    targetVxRef,
    isFloating,
    setIsFloating,
  } = ctx;

  const speed = SPEED * ctx.speedMultiplier;

  // Detect falling state
  const falling = vy < -1.8;

  if (falling) {
    if (!isFloating) {
      setIsFloating(true);
    }
    // Dampen fall speed to float gently downward, allow slight steering
    api.velocity.set(dir * speed * 0.6, -1.5, 0);
    targetVxRef.current = dir * speed * 0.6;
  } else {
    if (isFloating) {
      setIsFloating(false);
    }
    // Normal walk
    targetVxRef.current = dir * speed;
    api.velocity.set(dir * speed, vy, 0);
  }
}

export const floaterJob: JobDefinition = {
  id: "FLOATER",
  label: "Float",
  icon: "/images/weaver_icon.png",
  mass: 1,
  visuals: {
    bodyColor: "#5b21b6", // Deep purple
    eyeColor: "#c084fc",  // Glowing light purple
    emissiveIntensity: 0.6,
    ExtraMesh: FloaterHalo,
  },
  onTick: tick,
};
