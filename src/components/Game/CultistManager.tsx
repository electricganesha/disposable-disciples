import { useRef, useEffect, memo, useState, useMemo } from "react";
import { useFrame, useGraph } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { useSphere } from "@react-three/cannon";
import { useStore, type CultistData } from "../../store";

import { JOB_REGISTRY, type JobContext, getRegisteredJobs } from "../../jobs";
import {
  WeaverStaff,
  FloaterHalo,
  BlockerRing,
} from "../../jobs/visualComponents";

const FALL_THRESHOLD = -4;

// ── Modular cultist character mesh ───────────────────────────────────────────
const CultistMesh = ({
  job,
  selected,
  isWeaving,
  isDigging,
  isFloating,
  scale,
  hueShift,
  hovered,
  isMoving,
  frustumCulled = true,
  isActive = false,
  levelLoading = false,
}: {
  job: string;
  selected: boolean;
  isWeaving: boolean;
  isDigging: boolean;
  isFloating: boolean;
  scale: [number, number, number];
  hueShift: number;
  hovered: boolean;
  isMoving: boolean;
  frustumCulled?: boolean;
  isActive?: boolean;
  levelLoading?: boolean;
}) => {
  const group = useRef<THREE.Group>(null!);

  // Load GLTF model (using the animations-merged version)
  const { scene, animations } = useGLTF(
    "/models/cultist-glb/Meshy_AI_Chibi_Cultist_5__biped_Meshy_AI_Meshy_Merged_Animations.glb",
  );

  // Clone scene so each cultist has its own bones
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  const prewarmedRef = useRef(false);

  // Pre-warm all animations on mount to avoid track-binding CPU spikes during gameplay
  useEffect(() => {
    if (!actions || prewarmedRef.current) return;
    prewarmedRef.current = true;

    const actionList = Object.values(actions).filter(
      Boolean,
    ) as THREE.AnimationAction[];
    if (actionList.length === 0) return;

    const mixer = actionList[0].getMixer();

    // Play all clips to force path resolution and binding
    actionList.forEach((action) => {
      action.play();
    });

    // Tick the mixer once to evaluate all active bindings
    mixer.update(0.001);

    // Immediately stop all animations to reset state
    actionList.forEach((action) => {
      action.stop();
    });
  }, [actions]);

  const jobDef = JOB_REGISTRY.get(job);
  const visuals = jobDef?.visuals || JOB_REGISTRY.get("NONE")!.visuals;

  // Clone the material ONCE per cultist to avoid shader recompilation stutters
  const uniqueMaterial = useMemo(() => {
    if (!materials.Material_1) return new THREE.MeshStandardMaterial();
    return materials.Material_1.clone() as THREE.MeshStandardMaterial;
  }, [materials.Material_1]);

  // Dynamically update material properties in-place (no new material instance is created)
  useEffect(() => {
    if (!uniqueMaterial || !visuals) return;

    const finalColor = new THREE.Color(visuals.bodyColor);
    if (hueShift !== 0) {
      finalColor.offsetHSL(hueShift, 0, 0);
    }
    uniqueMaterial.color.copy(finalColor);

    const eyeColor = new THREE.Color(visuals.eyeColor || visuals.bodyColor);
    uniqueMaterial.emissive.copy(eyeColor);
    // eslint-disable-next-line react-hooks/immutability
    uniqueMaterial.emissiveIntensity = hovered
      ? 1.5
      : visuals.emissiveIntensity || 0.3;
  }, [uniqueMaterial, visuals, hueShift, hovered]);

  // Determine active animation based on action state and job
  const animName = useMemo(() => {
    if (job === "BLOCKER") return "Alert";
    if (job === "BERSERKER") return "Running";
    if (isWeaving || isDigging) return "Skill_03";
    if (isFloating) return "Unsteady_Walk";
    return isMoving ? "Walking" : "Alert";
  }, [job, isWeaving, isDigging, isFloating, isMoving]);

  useEffect(() => {
    const action = actions[animName];
    if (action) {
      action.reset().fadeIn(0.15).play();
      return () => {
        action.fadeOut(0.15);
      };
    }
  }, [animName, actions]);

  // Pause the animation mixer when inactive to avoid wasting CPU without unbinding tracks
  useEffect(() => {
    const mixer = actions[Object.keys(actions)[0] || ""]?.getMixer();
    if (mixer) {
      mixer.timeScale = isActive || levelLoading ? 1 : 0;
    }
  }, [isActive, levelLoading, actions]);

  const hoverScale = 1.0;

  const finalScale = useMemo(() => {
    if (!isActive && !levelLoading)
      return [0, 0, 0] as [number, number, number];
    return [
      scale[0] * hoverScale * 0.5,
      scale[1] * hoverScale * 0.5,
      scale[2] * hoverScale * 0.5,
    ] as [number, number, number];
  }, [isActive, levelLoading, scale, hoverScale]);

  return (
    <group ref={group} scale={finalScale} visible={isActive || levelLoading}>
      {/* Selection/Hover glow point light */}
      <pointLight
        position={[0, 0.8, 0]}
        intensity={selected ? 2 : hovered ? 1.5 : 0}
        color={selected ? "#e9d5ff" : visuals.eyeColor || "#ffffff"}
        distance={2.5}
      />

      {/* Skinned character model */}
      <group name="Scene">
        <group
          name="Armature"
          scale={0.012}
          position={[0, -0.55 / (scale[1] * hoverScale * 0.5), 0]}
        >
          <primitive object={nodes.Hips} />
          <skinnedMesh
            name="char1"
            geometry={(nodes.char1 as THREE.SkinnedMesh).geometry}
            material={uniqueMaterial}
            skeleton={(nodes.char1 as THREE.SkinnedMesh).skeleton}
            castShadow
            receiveShadow
            frustumCulled={frustumCulled}
          />
        </group>
      </group>

      {/* Job-Specific Extra Meshes always mounted, visibility controlled */}
      <WeaverStaff
        isActive={
          job === "BONE_WEAVER" && (isWeaving || isDigging || isFloating)
        }
        frustumCulled={frustumCulled}
      />
      <FloaterHalo
        isActive={job === "FLOATER" && (isWeaving || isDigging || isFloating)}
        frustumCulled={frustumCulled}
      />
      <BlockerRing isActive={job === "BLOCKER"} frustumCulled={frustumCulled} />

      {/* Job visual rings */}
      <JobEffectRing
        visible={isWeaving}
        color="#c084fc"
        emissive="#9333ea"
        frustumCulled={frustumCulled}
      />
      <JobEffectRing
        visible={isDigging}
        color="#ef4444"
        emissive="#b91c1c"
        frustumCulled={frustumCulled}
      />
    </group>
  );
};

const JobEffectRing = ({
  color,
  emissive,
  visible,
  frustumCulled = true,
}: {
  color: string;
  emissive: string;
  visible: boolean;
  frustumCulled?: boolean;
}) => {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (ref.current && visible) ref.current.rotation.y += 0.06;
  });
  return (
    <mesh
      ref={ref}
      position={[0, 0.3, 0]}
      visible={visible}
      frustumCulled={frustumCulled}
    >
      <torusGeometry args={[0.3, 0.025, 8, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={4}
      />
    </mesh>
  );
};

// ── Single cultist with physics (Pre-Allocated Level-Load Array) ─────────────
const Cultist = memo(
  ({ index, activeCultist }: { index: number; activeCultist: CultistData }) => {
    interface PhysicsUserData {
      isCultist?: boolean;
      id?: string;
      isFloor?: boolean;
      x?: number;
      y?: number;
    }

    const groupRef = useRef<THREE.Group>(null!);
    const posRef = useRef<[number, number, number]>([0, -100 - index, 0]);
    const velRef = useRef<[number, number, number]>([0, 0, 0]);
    const dirRef = useRef<1 | -1>(1);

    // Logic refs passed to plugin context
    const weavingRef = useRef(false);
    const weaveProgress = useRef(0);
    const digProgress = useRef(0);
    const lastFlipTime = useRef(0);
    const lastStepTime = useRef(0);
    const lastFloorRef = useRef<{ x: number; y: number } | null>(null);
    const targetVxRef = useRef(0);

    const removedRef = useRef(false);
    const justActivatedRef = useRef(0);
    const [isMoving, setIsMoving] = useState(false);
    const [isWeaving, setIsWeaving] = useState(false);
    const [isDigging, setIsDigging] = useState(false);
    const [isFloating, setIsFloating] = useState(false);
    const [hovered, setHovered] = useState(false);

    const activeId = activeCultist.id;
    const isActive = activeCultist.active;


    // Reset local animation states when a cultist becomes active.
    // Deferred with queueMicrotask so they don't fire synchronously inside the
    // effect body (avoids the react-hooks/set-state-in-effect lint error and
    // prevents cascading render cycles).
    useEffect(() => {
      if (!isActive) return;
      queueMicrotask(() => {
        setIsMoving(false);
        setIsWeaving(false);
        setIsDigging(false);
        setIsFloating(false);
        setHovered(false);
      });
    }, [isActive, activeId]);

    const levelLoading = useStore((s) => s.levelLoading);
    const job = activeCultist.job;
    const jobDef = JOB_REGISTRY.get(job) || JOB_REGISTRY.get("NONE")!;

    // Sync direction from store dynamically when active
    useEffect(() => {
      if (isActive) {
        dirRef.current = activeCultist.direction;
      }
    }, [activeId, isActive, activeCultist.direction]);

    const [, api] = useSphere<THREE.Mesh>(() => ({
      mass: 1, // Start as dynamic to ensure DYNAMIC body type in Cannon-es
      position: [0, -100 - index, 0],
      args: [0.35],
      fixedRotation: true,
      linearDamping: 0.05,
      angularDamping: 1,
      collisionFilterGroup: 2,
      collisionFilterMask: 1,
      userData: { isCultist: true },
      onCollide: (e) => {
        if (!isActive) return;
        const other = e.body?.userData as PhysicsUserData;
        if (other?.isFloor) {
          lastFloorRef.current = { x: other.x!, y: other.y! };
        }
      },
    }));

    // Sync activation, deactivation and teleportation
    useEffect(() => {
      if (isActive) {
        removedRef.current = false;
        justActivatedRef.current = 5; // Skip first 5 worker physics tick packets to let teleport settle

        weavingRef.current = false;
        weaveProgress.current = 0;
        digProgress.current = 0;
        lastFlipTime.current = 0;
        lastStepTime.current = 0;
        lastFloorRef.current = null;
        targetVxRef.current = 0;
        dirRef.current = activeCultist.direction;

        // Initialize position on main thread immediately to prevent off-screen race condition
        posRef.current = [
          activeCultist.position[0],
          activeCultist.position[1] + 0.4,
          activeCultist.position[2],
        ];
        velRef.current = [0, 0, 0];

        // Teleport in physics simulation and wake up (no dynamic mass toggling to avoid Cannon worker re-build stutter)
        api.position.set(
          activeCultist.position[0],
          activeCultist.position[1] + 0.4,
          activeCultist.position[2],
        );
        api.velocity.set(0, 0, 0);
        api.wakeUp();
      } else {
        // Deactivate, move off-screen, and sleep
        api.position.set(0, -100 - index, 0);
        api.velocity.set(0, 0, 0);
        api.sleep();
        posRef.current = [0, -100 - index, 0];
        velRef.current = [0, 0, 0];
        justActivatedRef.current = 0;
        if (groupRef.current) {
          if (levelLoading) {
            groupRef.current.position.set(0, 0, 0);
          } else {
            groupRef.current.position.set(0, -100 - index, 0);
          }
        }
      }
    }, [isActive, activeId, index, api, levelLoading]);

    // Update mass if job changes while active
    useEffect(() => {
      if (isActive) {
        api.mass.set(jobDef.mass);
      }
    }, [job, isActive, activeId, api, jobDef.mass]);

    // Subscribe to physics position / velocity
    useEffect(() => {
      const unP = api.position.subscribe((p) => {
        if (justActivatedRef.current > 0) return;
        posRef.current = p;
      });
      const unV = api.velocity.subscribe((v) => {
        if (justActivatedRef.current > 0) return;
        velRef.current = v;
      });
      return () => {
        unP();
        unV();
      };
    }, [api]);

    useFrame((_state, delta) => {
      if (!isActive || removedRef.current) {
        if (groupRef.current) {
          if (levelLoading) {
            groupRef.current.position.set(0, 0, 0);
          } else {
            groupRef.current.position.set(0, -100 - index, 0);
          }
        }
        return;
      }

      if (justActivatedRef.current > 0) {
        justActivatedRef.current--;
        // Lock visual group position during initialization frames to prevent flash
        if (groupRef.current) {
          groupRef.current.position.set(
            activeCultist.position[0],
            activeCultist.position[1] + 0.15,
            activeCultist.position[2],
          );
        }
        return;
      }

      const store = useStore.getState();

      const cultist = store.cultists.find((c) => c.id === activeId);
      if (!cultist) return;
      dirRef.current = cultist.direction;

      const [px, py, pz] = posRef.current;
      const [, vy] = velRef.current;
      const dir = dirRef.current;

      // Update cultist position in store in-place (only if valid gameplay position) to avoid massive React re-render spikes
      if (py > -90 && cultist) {
        cultist.position[0] = px;
        cultist.position[1] = py;
        cultist.position[2] = pz;
      }

      // ── Fall detection ──────────────────────────────────────────────────────
      if (py < FALL_THRESHOLD && py > -90) {
        removedRef.current = true;
        store.addExplosion(new THREE.Vector3(px, py, pz));
        store.triggerShake(0.35);
        store.removeCultist(activeId, false);
        return;
      }

      // ── Altar goal detection ────────────────────────────────────────────────
      const [ax, ay, az] = store.altarPosition;
      const xzDist = Math.sqrt((px - ax) ** 2 + (pz - az) ** 2);
      if (xzDist < 0.4 && py > ay - 0.5 && py < ay + 2) {
        removedRef.current = true;
        store.addSuccess(new THREE.Vector3(px, py, pz));
        store.removeCultist(activeId, true);
        return;
      }

      // ── Job Plugin Dispatch ─────────────────────────────────────────────────
      const ctx: JobContext = {
        id: activeId,
        px,
        py,
        pz,
        vx: velRef.current[0],
        vy,
        vz: velRef.current[2],
        dir,
        delta,
        api,
        weavingRef,
        weaveProgress,
        digProgress,
        lastFlipTime,
        lastFloorRef,
        targetVxRef,
        isWeaving,
        setIsWeaving,
        isDigging,
        setIsDigging,
        isFloating,
        setIsFloating,
        getFloorAt: store.getFloorAt,
        isBlockedAt: store.isBlockedAt,
        otherCultists: store.cultists.filter(
          (c) => c.active && c.id !== activeId,
        ),
        altarPosition: store.altarPosition,
        staircasePositions: store.staircasePositions,
        addFloorCube: store.addFloorCube,
        removeFloorCube: store.removeFloorCube,
        flipDirection: () => store.flipCultistDirection(activeId),
        addExplosion: store.addExplosion,
        addSuccess: store.addSuccess,
        addDebris: store.addDebris,
        triggerShake: store.triggerShake,
        removeCultist: store.removeCultist,
        setWeavingCount: store.setWeavingCount,
        weavingCount: store.weavingCount,
        speedMultiplier: activeCultist.speedMultiplier,
      };

      jobDef.onTick(ctx);

      // ── Step-up assist ───────────────────────────────────────────────────────
      const targetVx = targetVxRef.current;
      if (jobDef.mass > 0 && !weavingRef.current) {
        const vx = velRef.current[0];
        const wantsToMove = Math.abs(targetVx) > 0.5;
        const nextX = px + dir * 0.7;

        const yFloor = Math.floor(py);
        const yBelow = yFloor - 1;
        const floorTileY = store.getFloorAt(px, pz, yFloor);
        const floorTileBelow = store.getFloorAt(px, pz, yBelow);

        let groundedTileY: number | null = null;
        if (floorTileY !== undefined && floorTileY !== null) {
          groundedTileY = yFloor;
        } else if (floorTileBelow !== undefined && floorTileBelow !== null) {
          groundedTileY = yBelow;
        }

        const isGrounded =
          groundedTileY !== null &&
          py - 0.35 <= groundedTileY + 0.1 &&
          Math.abs(vy) < 1.0;

        const isStuck = wantsToMove && isGrounded && Math.abs(vx) < 0.8;
        // Only trigger step-up for a tile that is ABOVE the cultist's current level
        // (i.e. an actual wall or step), not for flat floor at the same Y.
        const obstacleAhead = store.getFloorAt(nextX, pz, Math.floor(py) + 1);
        const now = Date.now();

        if (isStuck && obstacleAhead && now - lastStepTime.current > 400) {
          lastStepTime.current = now;
          api.velocity.set(targetVx, 6, 0);
        }
      }

      if (groupRef.current) {
        groupRef.current.position.set(px, py + 0.15, pz);
        groupRef.current.rotation.y = dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      }

      const moving = Math.abs(velRef.current[0]) > 0.2;
      if (moving !== isMoving) {
        setIsMoving(moving);
      }
    });

    return (
      <group
        ref={groupRef}
        position={
          isActive
            ? [
                activeCultist.position[0],
                activeCultist.position[1] + 0.55,
                activeCultist.position[2],
              ]
            : levelLoading
              ? [0, 0, 0]
              : [0, -100 - index, 0]
        }
        visible={isActive || levelLoading}
        onPointerOver={(e) => {
          if (!isActive) return;
          e.stopPropagation();
          setHovered(true);
          (e.nativeEvent.target as HTMLElement).style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          if (!isActive) return;
          e.stopPropagation();
          setHovered(false);
          (e.nativeEvent.target as HTMLElement).style.cursor = "";
        }}
        onClick={(e) => {
          if (!isActive) return;
          e.stopPropagation();
          const state = useStore.getState();
          state.updateCultistJob(activeId, state.activeJob);
          state.selectCultist(activeId);
        }}
      >
        {/* Invisible Hitbox for reliable raycasting and click detection */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.6, 1.1, 0.6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <CultistMesh
          job={job}
          selected={activeCultist.selected}
          isWeaving={isWeaving}
          isDigging={isDigging}
          isFloating={isFloating}
          scale={activeCultist.scale}
          hueShift={activeCultist.colorHueShift}
          hovered={hovered}
          isMoving={isMoving}
          frustumCulled={levelLoading ? false : true}
          isActive={isActive}
          levelLoading={levelLoading}
        />
      </group>
    );
  },
);

// ── Spawn manager ─────────────────────────────────────────────────────────────
export const CultistManager = () => {
  const cultists = useStore((s) => s.cultists);
  const levelLoading = useStore((s) => s.levelLoading);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      if (
        state.gameStarted &&
        !state.levelLoading &&
        state.totalSpawned < state.totalSpawningLimit
      ) {
        state.addCultist();
      }
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Warm-up group: Off-screen and visible, but frustumCulled={false} so it compiles immediately. */}
      {levelLoading && (
        <group position={[0, -100, 0]} visible={true}>
          {getRegisteredJobs().map((j) => (
            <CultistMesh
              key={j.id}
              job={j.id}
              selected={true}
              isWeaving={true}
              isDigging={true}
              isFloating={true}
              scale={[1, 1, 1]}
              hueShift={0}
              hovered={true}
              isMoving={true}
              frustumCulled={false}
              isActive={true}
              levelLoading={true}
            />
          ))}
        </group>
      )}

      {cultists.map((activeCultist, index) => {
        return (
          <Cultist
            key={activeCultist.id}
            index={index}
            activeCultist={activeCultist}
          />
        );
      })}
    </>
  );
};

useGLTF.preload(
  "/models/cultist-glb/Meshy_AI_Chibi_Cultist_5__biped_Meshy_AI_Meshy_Merged_Animations.glb",
);
