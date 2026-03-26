import { create } from 'zustand';
import { Vector3 } from 'three';

export type Job = 'NONE' | 'BLOCKER' | 'BONE_WEAVER';
export type FloorType = 'STONE' | 'BONE';

export interface CultistData {
  id: string;
  position: [number, number, number]; // live physics position
  direction: 1 | -1; // +1 = right, -1 = left
  job: Job;
  selected: boolean;
  scale: [number, number, number]; // [x, y, z] body scale for visual variety
  speedMultiplier: number;
  colorHueShift: number;
}

export interface ExplosionData {
  id: string;
  position: Vector3;
  time: number;
}

interface GameState {
  // Stats
  savedCount: number;
  lostCount: number;
  lastSavedTime: number;
  totalSpawned: number;
  totalSpawningLimit: number;
  requiredSavedCount: number;

  // World
  grid: Map<string, FloorType>;
  gatePosition: [number, number, number];
  altarPosition: [number, number, number];

  // Interaction
  activeJob: Job;
  cultists: CultistData[];
  gameStarted: boolean;
  weavingCount: number; // how many bone weavers are actively weaving

  // Particle FX
  explosions: ExplosionData[];
  successes: ExplosionData[];

  // Actions
  startGame: () => void;
  setJob: (job: Job) => void;
  addCultist: () => void;
  updateCultistPosition: (id: string, pos: [number, number, number]) => void;
  updateCultistJob: (id: string, job: Job) => void;
  flipCultistDirection: (id: string) => void;
  selectCultist: (id: string) => void;
  removeCultist: (id: string, success?: boolean) => void;
  addFloorCube: (x: number, z: number) => void;
  getFloorAt: (x: number, z: number) => FloorType | undefined;
  isBlockedAt: (x: number, z: number, excludeId: string) => boolean;

  removeExplosion: (id: string) => void;
  removeSuccess: (id: string) => void;
  addExplosion: (position: Vector3) => void;
  addSuccess: (position: Vector3) => void;
  setWeavingCount: (count: number) => void;
}

// Initial stone floor: left platform [-8..-4] and right platform [4..8]
function buildInitialGrid(): Map<string, FloorType> {
  const grid = new Map<string, FloorType>();
  for (let x = -8; x <= -4; x++) grid.set(`${x},0`, 'STONE');
  for (let x = 4; x <= 8; x++) grid.set(`${x},0`, 'STONE');
  return grid;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export const useStore = create<GameState>((set, get) => ({
  savedCount: 0,
  lostCount: 0,
  lastSavedTime: 0,
  totalSpawned: 0,
  totalSpawningLimit: 20,
  requiredSavedCount: 15,

  grid: buildInitialGrid(),
  gatePosition: [-7, 0.6, 0],
  altarPosition: [7.5, 1.5, 0],

  activeJob: 'NONE',
  cultists: [],
  gameStarted: false,
  weavingCount: 0,
  explosions: [],
  successes: [],

  startGame: () => set({ gameStarted: true }),
  setJob: (job) => set({ activeJob: job }),

  addCultist: () =>
    set((state) => {
      if (state.totalSpawned >= state.totalSpawningLimit) return state;
      const [gx, gy, gz] = state.gatePosition;
      const randRange = (min: number, max: number) => min + Math.random() * (max - min);
      const scaleX = randRange(0.8, 1.25);
      const scaleY = randRange(0.85, 1.2);
      return {
        totalSpawned: state.totalSpawned + 1,
        cultists: [
          ...state.cultists,
          {
            id: uid(),
            position: [gx, gy, gz],
            direction: 1,
            job: 'NONE',
            selected: false,
            scale: [scaleX, scaleY, scaleX] as [number, number, number],
            speedMultiplier: randRange(0.85, 1.3),
            colorHueShift: randRange(-0.05, 0.05),
          },
        ],
      };
    }),

  updateCultistPosition: (id, pos) =>
    set((state) => ({
      cultists: state.cultists.map((c) =>
        c.id === id ? { ...c, position: pos } : c,
      ),
    })),

  updateCultistJob: (id, job) =>
    set((state) => ({
      cultists: state.cultists.map((c) =>
        c.id === id ? { ...c, job } : c,
      ),
    })),

  flipCultistDirection: (id) =>
    set((state) => ({
      cultists: state.cultists.map((c) =>
        c.id === id ? { ...c, direction: c.direction === 1 ? -1 : 1 } : c,
      ),
    })),

  selectCultist: (id) =>
    set((state) => ({
      cultists: state.cultists.map((c) => ({ ...c, selected: c.id === id })),
    })),

  removeCultist: (id, success = false) =>
    set((state) => ({
      savedCount: success ? state.savedCount + 1 : state.savedCount,
      lostCount: !success ? state.lostCount + 1 : state.lostCount,
      lastSavedTime: success ? Date.now() : state.lastSavedTime,
      cultists: state.cultists.filter((c) => c.id !== id),
    })),

  addFloorCube: (x, z) =>
    set((state) => {
      const newGrid = new Map(state.grid);
      newGrid.set(`${Math.round(x)},${Math.round(z)}`, 'BONE');
      return { grid: newGrid };
    }),

  getFloorAt: (x, z) => get().grid.get(`${Math.round(x)},${Math.round(z)}`),

  // A cultist is "blocked" if another cultist with job=BLOCKER is
  // within 1 unit of the given (x,z) position.
  isBlockedAt: (x, z, excludeId) =>
    get().cultists.some(
      (c) =>
        c.id !== excludeId &&
        c.job === 'BLOCKER' &&
        Math.abs(c.position[0] - x) < 1.0 &&
        Math.abs(c.position[2] - z) < 0.8,
    ),

  removeExplosion: (id) =>
    set((state) => ({ explosions: state.explosions.filter((e) => e.id !== id) })),
  removeSuccess: (id) =>
    set((state) => ({ successes: state.successes.filter((s) => s.id !== id) })),
  addExplosion: (position) =>
    set((state) => ({
      explosions: [
        ...state.explosions,
        { id: uid(), position: position.clone(), time: Date.now() },
      ],
    })),
  addSuccess: (position) =>
    set((state) => ({
      successes: [
        ...state.successes,
        { id: uid(), position: position.clone(), time: Date.now() },
      ],
    })),
  setWeavingCount: (count) => set({ weavingCount: count }),
}));
