import type { JobDefinition, JobContext } from "./types";

const SPEED = 4.5; // Very fast!

export const berserkerJob: JobDefinition = {
  id: "BERSERKER",
  label: "Berserk",
  icon: "/images/dig_forward.png", // We can use an existing icon or a placeholder
  mass: 1,
  visuals: {
    bodyColor: "#7f1d1d", // Dark blood red
    eyeColor: "#ef4444",  // Glowing bright red
    emissiveIntensity: 2.5,
  },
  onTick: (ctx: JobContext) => {
    const {
      id,
      px,
      pz,
      dir,
      api,
      targetVxRef,
      isBlockedAt,
      flipDirection,
      speedMultiplier,
      triggerShake,
    } = ctx;

    const speed = SPEED * speedMultiplier;
    const aheadX = px + dir * 0.6;
    const blocked = isBlockedAt(aheadX, pz, id);

    let targetVx = 0;
    if (blocked) {
      // Berserkers flip immediately upon hitting a wall
      flipDirection();
      triggerShake(0.15);
    } else {
      targetVx = dir * speed;
    }

    targetVxRef.current = targetVx;
    api.velocity.set(targetVx, ctx.vy, 0);
  },
};
