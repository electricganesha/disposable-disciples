import { useRef, useEffect, memo, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBox } from "@react-three/cannon";
import { useStore, type Job } from "../store";

const SPEED = 1.8;
const WEAVE_TIME = 1.4; // seconds to build one floor tile
const FALL_THRESHOLD = -4;

// ── Procedural cultist character mesh ────────────────────────────────────────
// A hooded robe figure: cylinder body + cone hood + two emissive eyes
const CultistMesh = ({
  job,
  selected,
  isWeaving,
  walkPhase,
  scale,
  texture,
  hueShift,
}: {
  job: Job;
  selected: boolean;
  isWeaving: boolean;
  walkPhase: number; // 0..2π, drives sway
  scale: [number, number, number];
  texture?: THREE.Texture;
  hueShift: number;
}) => {
  const bodyColor =
    job === "BLOCKER"
      ? "#8b0000"
      : job === "BONE_WEAVER"
        ? "#5a3a7f"
        : "#3d2b4d";
  const eyeColor =
    job === "BLOCKER"
      ? "#ff3333"
      : job === "BONE_WEAVER"
        ? "#c084fc"
        : "#22c55e";
  const emissiveI = job === "BONE_WEAVER" ? 0.5 : 0;
  const opacity = job === "BLOCKER" ? 0.95 : 1.0;
  const isBlocker = job === "BLOCKER";
  const isWeaver = job === "BONE_WEAVER";

  const finalBodyColor = useMemo(() => {
    const c = new THREE.Color(bodyColor);
    return c.offsetHSL(hueShift, 0, 0);
  }, [bodyColor, hueShift]);

  const sway = Math.sin(walkPhase) * 0.14;

  return (
    <group scale={scale}>
      {/* Selection glow */}
      {selected && (
        <pointLight
          position={[0, 0.8, 0]}
          intensity={2}
          color="#e9d5ff"
          distance={2.5}
        />
      )}

      {/* Robe - Upper Body */}
      <mesh
        position={[0, 0.25, 0]}
        rotation={[sway * 0.2, 0, sway * 0.4]}
        castShadow
      >
        <cylinderGeometry args={[0.18, 0.24, 0.55, 32]} />
        <meshStandardMaterial
          map={texture}
          color={finalBodyColor}
          emissive={finalBodyColor}
          emissiveIntensity={emissiveI * 0.4}
          roughness={0.9}
          transparent={isBlocker}
          opacity={opacity}
        />
      </mesh>

      {/* Robe - Lower Skirt (Flared) */}
      <mesh
        position={[0, -0.22, 0]}
        rotation={[sway * 0.1, 0, sway * 0.2]}
        castShadow
      >
        <cylinderGeometry args={[0.24, 0.38, 0.6, 32]} />
        <meshStandardMaterial
          map={texture}
          color={finalBodyColor}
          emissive={finalBodyColor}
          emissiveIntensity={emissiveI * 0.4}
          roughness={0.9}
          transparent={isBlocker}
          opacity={opacity}
        />
      </mesh>

      {/* Belt */}
      <mesh position={[0, -0.05, 0]} rotation={[sway * 0.15, 0, sway * 0.3]}>
        <torusGeometry args={[0.25, 0.03, 12, 32]} />
        <meshStandardMaterial color="#1a1221" roughness={0.5} />
      </mesh>

      {/* Hood */}
      <mesh
        position={[0, 0.68, 0.05]}
        rotation={[sway * 0.08 + 0.15, 0, sway * 0.2]}
        castShadow
      >
        <coneGeometry args={[0.22, 0.55, 32]} />
        <meshStandardMaterial
          map={texture}
          color={finalBodyColor}
          emissive={finalBodyColor}
          emissiveIntensity={emissiveI * 0.4}
          roughness={0.9}
          transparent={isBlocker}
          opacity={opacity}
        />
      </mesh>

      {/* Job-Specific: Blocker Base Ring */}
      {isBlocker && (
        <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.02, 8, 32]} />
          <meshStandardMaterial
            color="#ff0000"
            emissive="#ff0000"
            emissiveIntensity={5}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Job-Specific: Bone Weaver Staff (when weaving) */}
      {isWeaver && isWeaving && (
        <group position={[0.4, 0.2, 0.3]} rotation={[0.4, 0, -0.2]}>
          {/* Staff handle */}
          <mesh castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
            <meshStandardMaterial color="#3d2b4d" roughness={0.9} />
          </mesh>
          {/* Staff head (Bone) */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.7} />
          </mesh>
          <pointLight intensity={1.5} color="#c084fc" distance={2} />
        </group>
      )}

      {/* Eyes */}
      <group rotation={[sway * 0.1, 0, sway * 0.3]} position={[0, 0.25, 0]}>
        <mesh position={[-0.08, 0.23, 0.18]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial
            color={eyeColor}
            emissive={eyeColor}
            emissiveIntensity={6}
          />
        </mesh>
        <mesh position={[0.08, 0.23, 0.18]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial
            color={eyeColor}
            emissive={eyeColor}
            emissiveIntensity={6}
          />
        </mesh>
      </group>

      {/* Weaving particle ring */}
      {isWeaving && <WeavingRing />}
    </group>
  );
};

const WeavingRing = () => {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.06;
  });
  return (
    <mesh ref={ref} position={[0, 0.3, 0]}>
      <torusGeometry args={[0.3, 0.025, 8, 24]} />
      <meshStandardMaterial
        color="#c084fc"
        emissive="#9333ea"
        emissiveIntensity={4}
      />
    </mesh>
  );
};

// ── Single cultist with physics ──────────────────────────────────────────────
const Cultist = memo(
  ({
    id,
    initialPos,
    job,
    selected,
    scale,
    texture,
    speedMultiplier,
    hueShift,
  }: {
    id: string;
    initialPos: [number, number, number];
    job: Job;
    selected: boolean;
    scale: [number, number, number];
    texture?: THREE.Texture;
    speedMultiplier: number;
    hueShift: number;
  }) => {
    const groupRef = useRef<THREE.Group>(null!);
    const posRef = useRef<[number, number, number]>(initialPos);
    const velRef = useRef<[number, number, number]>([0, 0, 0]);
    const dirRef = useRef<1 | -1>(1);
    const weavingRef = useRef(false);
    const weaveProgress = useRef(0);
    const lastFlipTime = useRef(0);
    const lastStepTime = useRef(0);
    const removedRef = useRef(false);
    const [walkPhase, setWalkPhase] = useState(0);
    const [isWeaving, setIsWeaving] = useState(false);

    // Sync direction from store on mount and whenever job changes
    useEffect(() => {
      const state = useStore.getState();
      const c = state.cultists.find((x) => x.id === id);
      if (c) dirRef.current = c.direction;
    }, [id]);

    const mass = job === "BLOCKER" ? 0 : 1;

    const [, api] = useBox<THREE.Mesh>(() => ({
      mass,
      position: [initialPos[0], initialPos[1] + 0.6, initialPos[2]],
      args: [0.45, 1.1, 0.45],
      fixedRotation: true,
      linearDamping: 0.05,
      angularDamping: 1,
      collisionFilterGroup: 2,
      collisionFilterMask: 1 | 2,
      userData: { id, isCultist: true },
      onCollide: (e) => {
        // Don't flip direction if this cultist is actively weaving
        if (weavingRef.current) return;
        const other = e.body?.userData as
          | { isCultist?: boolean; id?: string }
          | undefined;
        if (other?.isCultist && other.id !== id) {
          const now = Date.now();
          if (now - lastFlipTime.current > 500) {
            lastFlipTime.current = now;
            dirRef.current = (dirRef.current * -1) as 1 | -1;
            useStore.getState().flipCultistDirection(id);
          }
        }
      },
    }));

    // Subscribe to physics position / velocity
    useEffect(() => {
      const unP = api.position.subscribe((p) => {
        posRef.current = p;
      });
      const unV = api.velocity.subscribe((v) => {
        velRef.current = v;
      });
      return () => {
        unP();
        unV();
      };
    }, [api]);

    useFrame((_state, delta) => {
      if (removedRef.current) return;
      const store = useStore.getState();

      // Get latest direction from store (updated by flipCultistDirection)
      const cultist = store.cultists.find((c) => c.id === id);
      if (!cultist) return;
      dirRef.current = cultist.direction;

      const [px, py, pz] = posRef.current;
      const [, vy] = velRef.current;
      const dir = dirRef.current;
      const speed = SPEED * speedMultiplier;

      // Update cultist position in store (for isBlockedAt resolution)
      store.updateCultistPosition(id, posRef.current);

      // ── Fall detection ──────────────────────────────────────────────────────
      if (py < FALL_THRESHOLD) {
        removedRef.current = true;
        store.addExplosion(new THREE.Vector3(px, py, pz));
        store.removeCultist(id, false);
        return;
      }

      // ── Altar goal detection ────────────────────────────────────────────────
      const [ax, ay, az] = store.altarPosition;
      const xzDist = Math.sqrt((px - ax) ** 2 + (pz - az) ** 2);
      if (xzDist < 1.3 && py > ay - 0.5) {
        removedRef.current = true;
        store.addSuccess(new THREE.Vector3(px, py, pz));
        store.removeCultist(id, true);
        return;
      }

      // ── Movement ────────────────────────────────────────────────────────────
      let targetVx = 0;

      if (job === "BLOCKER") {
        // Static — physics mass=0 handles it, just zero velocity to be safe
        api.velocity.set(0, 0, 0);
      } else if (job === "NONE") {
        const aheadX = px + dir * 0.6;
        const blocked = store.isBlockedAt(aheadX, pz, id);
        if (blocked) {
          // Flip on blocker
          const now = Date.now();
          if (now - lastFlipTime.current > 500) {
            lastFlipTime.current = now;
            dirRef.current = (dir * -1) as 1 | -1;
            store.flipCultistDirection(id);
          }
          targetVx = 0;
        } else {
          // Separation: flip if another cultist is too close directly ahead
          const tooClose = store.cultists.some(
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
              dirRef.current = (dir * -1) as 1 | -1;
              store.flipCultistDirection(id);
            }
            targetVx = 0;
          } else {
            targetVx = dir * speed;
          }
        }
        api.velocity.set(targetVx, vy, 0);
      } else if (job === "BONE_WEAVER") {
        const aheadX = px + dir * 0.3; // Closer look-ahead so they walk nearer to the edge
        const hasFloor = store.getFloorAt(aheadX, pz);

        if (!hasFloor) {
          // Stop and weave
          api.velocity.set(0, vy, 0);
          if (!weavingRef.current) {
            weavingRef.current = true;
            setIsWeaving(true);
            // Count active weavers for audio
            const s = useStore.getState();
            s.setWeavingCount(s.weavingCount + 1);
          }
          weaveProgress.current += delta;
          if (weaveProgress.current >= WEAVE_TIME) {
            weaveProgress.current = 0;
            store.addFloorCube(Math.round(px + dir * 1.0), Math.round(pz));
          }
        } else {
          const blocked = store.isBlockedAt(px + dir * 0.6, pz, id);
          targetVx = blocked ? 0 : dir * speed;
          api.velocity.set(targetVx, vy, 0);
          if (weavingRef.current) {
            weavingRef.current = false;
            setIsWeaving(false);
            // Count active weavers for audio
            const s = useStore.getState();
            s.setWeavingCount(Math.max(0, s.weavingCount - 1));
          }
        }
      }

      // ── Step-up assist ───────────────────────────────────────────────────────
      // If the cultist wants to move but is horizontally stuck, and there IS a
      // floor tile ahead (a step, not a void), pop them upward to climb it.
      if (job !== "BLOCKER" && !weavingRef.current) {
        const vx = velRef.current[0];
        const wantsToMove = Math.abs(targetVx) > 0.5;
        const isGrounded = Math.abs(vy) < 1.5; // don't hop mid-air
        const isStuck = wantsToMove && isGrounded && Math.abs(vx) < 0.6;
        const floorAhead = store.getFloorAt(px + dir * 0.7, pz);
        const now = Date.now();
        if (isStuck && floorAhead && now - lastStepTime.current > 400) {
          lastStepTime.current = now;
          api.velocity.set(targetVx, 5, 0); // short upward pop
        }
      }

      // ── Visual sync ─────────────────────────────────────────────────────────
      if (groupRef.current) {
        groupRef.current.position.set(px, py - 0.05, pz);
        // Face direction: +X direction = rotate PI/2, -X = rotate -PI/2,
        // but eyes face +Z, so we need 0 for right and PI for left
        groupRef.current.rotation.y = dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      }

      // Walk sway animation
      const isMoving = Math.abs(velRef.current[0]) > 0.2;
      if (isMoving) {
        setWalkPhase((p) => p + delta * 8 * speedMultiplier);
      }
    });

    return (
      <group ref={groupRef}>
        <CultistMesh
          job={job}
          selected={selected}
          isWeaving={isWeaving}
          walkPhase={walkPhase}
          scale={scale}
          texture={texture}
          hueShift={hueShift}
        />
      </group>
    );
  },
);

// ── Spawn manager ─────────────────────────────────────────────────────────────
export const CultistManager = () => {
  const cultists = useStore((s) => s.cultists);

  const clothTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const t = loader.load("/textures/cloth.jpg");
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(50, 50);
    return t;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      if (state.totalSpawned < state.totalSpawningLimit) {
        state.addCultist();
      } else {
        clearInterval(interval);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {cultists.map((c) => (
        <group
          key={c.id}
          onClick={(e) => {
            e.stopPropagation();
            const state = useStore.getState();
            if (state.activeJob !== "NONE") {
              state.updateCultistJob(c.id, state.activeJob);
            }
            state.selectCultist(c.id);
          }}
        >
          <Cultist
            id={c.id}
            initialPos={c.position}
            job={c.job}
            selected={c.selected}
            scale={c.scale}
            texture={clothTexture}
            speedMultiplier={c.speedMultiplier}
            hueShift={c.colorHueShift}
          />
        </group>
      ))}
    </>
  );
};
