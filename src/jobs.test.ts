import { describe, it, expect, vi } from "vitest";
import { noneJob } from "./jobs/none";
import { climberJob } from "./jobs/climber";
import { floaterJob } from "./jobs/floater";
import { basherJob } from "./jobs/basher";
import type { JobContext, PhysicsApi } from "./jobs/types";

function createMockContext(overrides: Partial<JobContext> = {}): JobContext {
  const velocitySet = vi.fn();
  const api: PhysicsApi = {
    velocity: {
      set: velocitySet,
    },
  };

  return {
    id: "test-cultist",
    px: 0,
    py: 0,
    pz: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    dir: 1,
    delta: 0.1,
    api,
    weavingRef: { current: false },
    weaveProgress: { current: 0 },
    digProgress: { current: 0 },
    lastFlipTime: { current: 0 },
    lastFloorRef: { current: null },
    targetVxRef: { current: 0 },
    isWeaving: false,
    setIsWeaving: vi.fn(),
    isDigging: false,
    setIsDigging: vi.fn(),
    isFloating: false,
    setIsFloating: vi.fn(),
    getFloorAt: vi.fn(() => undefined),
    isBlockedAt: vi.fn(() => false),
    otherCultists: [],
    altarPosition: [10, 0, 0],
    staircasePositions: [],
    addFloorCube: vi.fn(),
    removeFloorCube: vi.fn(),
    flipDirection: vi.fn(),
    addExplosion: vi.fn(),
    addSuccess: vi.fn(),
    addDebris: vi.fn(),
    triggerShake: vi.fn(),
    removeCultist: vi.fn(),
    setWeavingCount: vi.fn(),
    weavingCount: 0,
    speedMultiplier: 1,
    ...overrides,
  };
}

describe("Job Plugins Behavior", () => {
  describe("Climber Job", () => {
    it("walks forward when no wall is ahead", () => {
      const ctx = createMockContext();
      climberJob.onTick(ctx);
      expect(ctx.targetVxRef.current).toBe(1.8);
      expect(ctx.api.velocity.set).toHaveBeenCalledWith(1.8, 0, 0);
    });

    it("climbs up when a wall is detected ahead", () => {
      const ctx = createMockContext({
        getFloorAt: vi.fn((x, _z, targetY) => {
          // Mock wall ahead at Math.floor(py) + 1 (height 1)
          if (x > 0.5 && targetY === 1) return "STONE";
          return undefined;
        }),
      });
      climberJob.onTick(ctx);
      expect(ctx.targetVxRef.current).toBe(0); // step-up assist disabled
      expect(ctx.api.velocity.set).toHaveBeenCalledWith(0.15, 1.6, 0); // Climb speed upward
    });

    it("does not climb when a staircase is ahead", () => {
      const ctx = createMockContext({
        getFloorAt: vi.fn((x, _z, targetY) => {
          if (x > 0.5 && targetY === 1) return "STAIR";
          return undefined;
        }),
      });
      climberJob.onTick(ctx);
      expect(ctx.targetVxRef.current).toBe(1.8);
      expect(ctx.api.velocity.set).toHaveBeenCalledWith(1.8, 0, 0);
    });
  });

  describe("Floater Job", () => {
    it("walks normally when not falling", () => {
      const ctx = createMockContext({ vy: 0 });
      floaterJob.onTick(ctx);
      expect(ctx.targetVxRef.current).toBe(1.8);
      expect(ctx.api.velocity.set).toHaveBeenCalledWith(1.8, 0, 0);
      expect(ctx.setIsFloating).not.toHaveBeenCalledWith(true);
    });

    it("caps fall speed and sets floating flag when falling fast", () => {
      const ctx = createMockContext({ vy: -3.0 });
      floaterJob.onTick(ctx);
      expect(ctx.setIsFloating).toHaveBeenCalledWith(true);
      expect(ctx.api.velocity.set).toHaveBeenCalledWith(1.08, -1.5, 0); // 1.8 * 0.6 = 1.08 horizontal velocity, -1.5 capped fall velocity
    });
  });

  describe("Basher Job", () => {
    it("walks forward when no block is ahead", () => {
      const ctx = createMockContext();
      basherJob.onTick(ctx);
      expect(ctx.targetVxRef.current).toBe(1.8);
      expect(ctx.api.velocity.set).toHaveBeenCalledWith(1.8, 0, 0);
    });

    it("stops and starts bashing when a block is ahead at torso-height", () => {
      const ctx = createMockContext({
        getFloorAt: vi.fn((x, _z, targetY) => {
          if (x === 1 && targetY === 1) return "STONE";
          return undefined;
        }),
      });

      basherJob.onTick(ctx);
      expect(ctx.targetVxRef.current).toBe(0);
      expect(ctx.setIsDigging).toHaveBeenCalledWith(true);
      expect(ctx.digProgress.current).toBe(0.1);
    });

    it("removes block and triggers debris and screen shake when bashing completes", () => {
      const ctx = createMockContext({
        getFloorAt: vi.fn((x, _z, targetY) => {
          if (x === 1 && targetY === 1) return "STONE";
          return undefined;
        }),
        digProgress: { current: 1.15 }, // 1.2s required
      });

      basherJob.onTick(ctx);
      expect(ctx.removeFloorCube).toHaveBeenCalledWith(1, 1);
      expect(ctx.addDebris).toHaveBeenCalled();
      expect(ctx.triggerShake).toHaveBeenCalledWith(0.1);
      expect(ctx.digProgress.current).toBe(0); // progress reset
    });

    it("does not bash when a staircase is ahead", () => {
      const ctx = createMockContext({
        getFloorAt: vi.fn((x, _z, targetY) => {
          if (x === 1 && targetY === 1) return "STAIR";
          return undefined;
        }),
      });
      basherJob.onTick(ctx);
      expect(ctx.targetVxRef.current).toBe(1.8);
      expect(ctx.api.velocity.set).toHaveBeenCalledWith(1.8, 0, 0);
    });
  });

  describe("Wanderer (none) Job", () => {
    it("walks forward and does not flip when a staircase is ahead", () => {
      const ctx = createMockContext({
        getFloorAt: vi.fn((x, _z, targetY) => {
          if (x > 0.5 && targetY === 1) return "STAIR";
          return undefined;
        }),
      });
      noneJob.onTick(ctx);
      expect(ctx.targetVxRef.current).toBe(1.8);
      expect(ctx.api.velocity.set).toHaveBeenCalledWith(1.8, 0, 0);
      expect(ctx.flipDirection).not.toHaveBeenCalled();
    });

    it("flips direction when a solid wall is ahead", () => {
      const ctx = createMockContext({
        getFloorAt: vi.fn((x, _z, targetY) => {
          if (x > 0.5 && targetY === 1) return "STONE";
          return undefined;
        }),
      });
      noneJob.onTick(ctx);
      expect(ctx.targetVxRef.current).toBe(0);
      expect(ctx.flipDirection).toHaveBeenCalled();
    });
  });
});
