import { create } from 'zustand';
import { Vector3 } from 'three';
import type { FloorType, Level } from './levels/types';

export type Job = string;

export interface CultistData {
  id: string;
  position: [number, number, number]; // live physics position
  direction: 1 | -1; // +1 = right, -1 = left
  job: Job;
  selected: boolean;
  scale: [number, number, number]; // [x, y, z] body scale for visual variety
  speedMultiplier: number;
  colorHueShift: number;
  active: boolean;
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

  // Level Management
  currentLevelIndex: number;
  currentLevelName: string;
  currentLevelDescription: string;
  gameStarted: boolean;
  gameWon: boolean;
  gameLost: boolean;
  levelLoading: boolean;

  // World
  grid: Map<string, FloorType>;
  gatePosition: [number, number, number];
  altarPosition: [number, number, number];
  staircasePositions: [number, number, number][];
  pillarPositions: [number, number, number][];
  jobQuotas: { [key: string]: number };

  // Atmosphere (Parameterised)
  environmentType: string;
  backgroundColor: string;
  ambientColor: string;
  lightIntensity: number;

  // Interaction
  activeJob: Job;
  cultists: CultistData[];
  weavingCount: number;

  // Particle FX + Shakes
  explosions: ExplosionData[];
  successes: ExplosionData[];
  debris: ExplosionData[];
  shakeIntensity: number;

  // Actions
  startGame: () => void;
  loadLevel: (index: number) => void;
  loadLevelObject: (level: Level) => void;
  loadNextLevel: () => void;
  setJob: (job: Job) => void;
  addCultist: () => void;
  updateCultistPosition: (id: string, pos: [number, number, number]) => void;
  updateCultistJob: (id: string, job: Job) => void;
  flipCultistDirection: (id: string) => void;
  selectCultist: (id: string) => void;
  removeCultist: (id: string, success?: boolean) => void;
  addFloorCube: (x: number, z: number) => void;
  getFloorAt: (x: number, z: number, targetY?: number) => FloorType | undefined;
  isBlockedAt: (x: number, z: number, excludeId: string) => boolean;

  removeExplosion: (id: string) => void;
  removeSuccess: (id: string) => void;
  addExplosion: (position: Vector3) => void;
  addSuccess: (position: Vector3) => void;
  setWeavingCount: (count: number) => void;
  addDebris: (position: Vector3) => void;
  removeDebris: (id: string) => void;
  triggerShake: (intensity: number) => void;
  decayShake: () => void;

  // Editor
  view: 'GAME' | 'EDITOR';
  setView: (view: 'GAME' | 'EDITOR') => void;
  selectedPaletteItem: string;
  setSelectedPaletteItem: (item: string) => void;
  updateLevelFromASCII: (ascii: string) => void;
  placeAt: (x: number, y: number, item: string) => void;
  removeAt: (x: number, y: number) => void;
  removeFloorCube: (x: number, y: number) => void;
}

// ... (existing types)

const uid = () => Math.random().toString(36).slice(2, 9);

const createInitialCultists = (spawnLimit: number): CultistData[] => {
  const randRange = (min: number, max: number) => min + Math.random() * (max - min);
  return Array.from({ length: spawnLimit }).map((_, idx) => {
    const scaleX = randRange(0.8, 1.25);
    const scaleY = randRange(0.85, 1.2);
    return {
      id: `cultist_${idx}_${uid()}`,
      position: [0, -100 - idx, 0] as [number, number, number],
      direction: 1,
      job: 'NONE',
      selected: false,
      scale: [scaleX, scaleY, scaleX] as [number, number, number],
      speedMultiplier: randRange(0.85, 1.3),
      colorHueShift: randRange(-0.05, 0.05),
      active: false,
    };
  });
};

import { LEVEL_REGISTRY, parseLayout } from './levels/registry';

// ... (existing types)

export const useStore = create<GameState>((set, get) => ({
  savedCount: 0,
  lostCount: 0,
  lastSavedTime: 0,
  totalSpawned: 0,
  totalSpawningLimit: 20,
  requiredSavedCount: 15,

  currentLevelIndex: 0,
  currentLevelName: '',
  currentLevelDescription: '',
  gameStarted: false,
  gameWon: false,
  gameLost: false,
  levelLoading: false,

  grid: new Map(),
  gatePosition: [-7, 0.6, 0],
  altarPosition: [7.5, 1.5, 0],
  staircasePositions: [],
  pillarPositions: [],
  jobQuotas: {},

  environmentType: 'ELDRITCH',
  backgroundColor: '#050208',
  ambientColor: '#c4b5fd',
  lightIntensity: 1.2,

  activeJob: 'NONE',
  cultists: [],
  weavingCount: 0,
  explosions: [],
  successes: [],
  debris: [],
  shakeIntensity: 0,

  startGame: () => {
    if (!get().currentLevelName) {
      const params = new URLSearchParams(window.location.search);
      const levelValue = params.get("level");
      const startIndex = levelValue ? parseInt(levelValue, 10) : 0;
      const finalIndex = isNaN(startIndex) ? 0 : startIndex;
      
      get().loadLevel(finalIndex);
    }
    set({ gameStarted: true });
  },

  loadLevel: (index) => {
    const level = LEVEL_REGISTRY[index];
    if (!level) return;

    const gridMap = new Map<string, FloorType>();
    if (level.gridData) {
      Object.entries(level.gridData).forEach(([key, val]) => {
        gridMap.set(key, val);
      });
    }

    set({
      currentLevelIndex: index,
      currentLevelName: level.name,
      currentLevelDescription: level.description,
      savedCount: 0,
      lostCount: 0,
      totalSpawned: 0,
      totalSpawningLimit: level.spawnLimit,
      requiredSavedCount: level.requiredSaved,
      grid: gridMap,
      gatePosition: level.gatePosition,
      altarPosition: level.altarPosition,
      staircasePositions: level.staircasePositions || [],
      pillarPositions: level.pillarPositions || [],
      jobQuotas: level.jobQuotas,
      environmentType: level.environmentType || 'ELDRITCH',
      backgroundColor: level.backgroundColor || '#050208',
      ambientColor: level.ambientColor || '#c4b5fd',
      lightIntensity: level.lightIntensity ?? 1.2,
      cultists: createInitialCultists(level.spawnLimit),
      gameWon: false,
      gameLost: false,
      debris: [],
      shakeIntensity: 0,
      levelLoading: true,
    });

    setTimeout(() => {
      set({ levelLoading: false });
    }, 1500);
  },

  loadLevelObject: (level) => {
    const gridMap = new Map<string, FloorType>();
    if (level.gridData) {
      Object.entries(level.gridData).forEach(([key, val]) => {
        gridMap.set(key, val);
      });
    }

    set({
      currentLevelIndex: -1,
      currentLevelName: level.name,
      currentLevelDescription: level.description,
      savedCount: 0,
      lostCount: 0,
      totalSpawned: 0,
      totalSpawningLimit: level.spawnLimit,
      requiredSavedCount: level.requiredSaved,
      grid: gridMap,
      gatePosition: level.gatePosition,
      altarPosition: level.altarPosition,
      staircasePositions: level.staircasePositions || [],
      pillarPositions: level.pillarPositions || [],
      jobQuotas: level.jobQuotas,
      environmentType: level.environmentType || 'ELDRITCH',
      backgroundColor: level.backgroundColor || '#050208',
      ambientColor: level.ambientColor || '#c4b5fd',
      lightIntensity: level.lightIntensity ?? 1.2,
      cultists: createInitialCultists(level.spawnLimit),
      gameWon: false,
      gameLost: false,
      debris: [],
      shakeIntensity: 0,
      levelLoading: true,
    });

    setTimeout(() => {
      set({ levelLoading: false });
    }, 1500);
  },

  loadNextLevel: () => {
    const nextIndex = get().currentLevelIndex + 1;
    if (nextIndex < LEVEL_REGISTRY.length) {
      get().loadLevel(nextIndex);
    }
  },

  setJob: (job) => set({ activeJob: job }),

  addCultist: () =>
    set((state) => {
      if (state.totalSpawned >= state.totalSpawningLimit) return state;
      const nextInactive = state.cultists.find((c) => !c.active);
      if (!nextInactive) return state;
      const [gx, gy, gz] = state.gatePosition;
      return {
        totalSpawned: state.totalSpawned + 1,
        cultists: state.cultists.map((c) =>
          c.id === nextInactive.id
            ? { ...c, active: true, position: [gx, gy, gz] }
            : c
        ),
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
    set((state) => {
      const newSavedCount = success ? state.savedCount + 1 : state.savedCount;
      const newLostCount = !success ? state.lostCount + 1 : state.lostCount;
      
      const newCultists = state.cultists.map((c) =>
        c.id === id ? { ...c, active: false, position: [0, -100, 0] as [number, number, number] } : c
      );
      
      const levelDef = LEVEL_REGISTRY[state.currentLevelIndex];
      
      let victory = newSavedCount >= state.requiredSavedCount;
      const allSpawned = state.totalSpawned >= state.totalSpawningLimit;
      const activeCount = newCultists.filter((c) => c.active).length;
      let defeat = allSpawned && activeCount === 0 && newSavedCount < state.requiredSavedCount;

      // Handle custom win condition hook
      if (levelDef?.winCondition) {
        const status = levelDef.winCondition({
          savedCount: newSavedCount,
          lostCount: newLostCount,
          totalSpawned: state.totalSpawned,
          totalSpawningLimit: state.totalSpawningLimit,
          activeCultistCount: activeCount,
          requiredSavedCount: state.requiredSavedCount,
        });

        if (status === "WIN") victory = true;
        if (status === "LOSE") {
          victory = false;
          defeat = true;
        }
        if (status === "PLAYING") {
          victory = false;
          defeat = false;
        }
      }

      return {
        savedCount: newSavedCount,
        lostCount: newLostCount,
        lastSavedTime: success ? Date.now() : state.lastSavedTime,
        cultists: newCultists,
        gameWon: victory,
        gameLost: defeat,
      };
    }),

  addFloorCube: (x, z) =>
    set((state) => {
      const newGrid = new Map(state.grid);
      newGrid.set(`${Math.round(x)},${Math.round(z)}`, 'BONE');
      return { grid: newGrid };
    }),

  getFloorAt: (x, z, targetY) => {
    const xRound = Math.round(x);
    const yVal = targetY !== undefined ? targetY : (z !== undefined ? z : 0);
    
    // Check main grid
    const inGrid = get().grid.get(`${xRound},${yVal}`);
    if (inGrid) return inGrid;

    // Check staircases
    const onStair = get().staircasePositions.some(
      (p) => Math.round(p[0]) === xRound && Math.round(p[1]) === yVal
    );
    if (onStair) return "STAIR";

    // Check altar (altar is 2 units wide, covering columns [altar[0]-1, altar[0]+1] and Y surface at Math.floor(altar[1] + 1.2))
    const altar = get().altarPosition;
    if (Math.abs(xRound - altar[0]) < 1.0 && Math.floor(altar[1] + 1.2) === yVal) {
      return "STONE";
    }

    return undefined;
  },


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
  addDebris: (position) =>
    set((state) => ({
      debris: [
        ...state.debris,
        { id: uid(), position: position.clone(), time: Date.now() },
      ],
    })),
  removeDebris: (id) =>
    set((state) => ({ debris: state.debris.filter((d) => d.id !== id) })),
  triggerShake: (intensity) =>
    set((state) => ({
      shakeIntensity: Math.max(state.shakeIntensity, intensity),
    })),
  decayShake: () =>
    set((state) => ({
      shakeIntensity: state.shakeIntensity * 0.88,
    })),

  // Editor
  view: 'GAME',
  setView: (view) => set({ view }),
  selectedPaletteItem: '#',
  setSelectedPaletteItem: (selectedPaletteItem) => set({ selectedPaletteItem }),
  updateLevelFromASCII: (ascii) => {
    const levelData = parseLayout(ascii);
    const gridMap = new Map<string, FloorType>();
    if (levelData.gridData) {
      Object.entries(levelData.gridData).forEach(([key, val]) => {
        gridMap.set(key, val as FloorType);
      });
    }

    set({
      grid: gridMap,
      gatePosition: levelData.gatePosition as [number, number, number],
      altarPosition: levelData.altarPosition as [number, number, number],
      staircasePositions: levelData.staircasePositions || [],
      pillarPositions: levelData.pillarPositions || [],
      cultists: [],
    });
  },
  placeAt: (x, y, item) => set((state) => {
    // This is more complex because we need to update the correct arrays
    const newGrid = new Map(state.grid);
    const newStairs = [...state.staircasePositions];
    const newPillars = [...state.pillarPositions];
    let newGate = [...state.gatePosition] as [number, number, number];
    let newAltar = [...state.altarPosition] as [number, number, number];

    // Remove existing at this coord if needed? 
    // For simplicity, we just add.
    const xRound = Math.round(x);
    const yRound = Math.round(y);

    switch(item) {
      case '#': newGrid.set(`${xRound},${yRound}`, 'STONE'); break;
      case 'B': newGrid.set(`${xRound},${yRound}`, 'BONE'); break;
      case 'C': newGrid.set(`${xRound},${yRound}`, 'SUPPORT'); break;
      case 'S': newStairs.push([xRound, yRound, 0]); break;
      case '|': newPillars.push([xRound, yRound, 0]); break;
      case 'G': newGate = [xRound, yRound + 0.1, 0]; break;
      case 'A': newAltar = [xRound, yRound + 0.1, 0]; break;
    }

    return {
      grid: newGrid,
      staircasePositions: newStairs,
      pillarPositions: newPillars,
      gatePosition: newGate,
      altarPosition: newAltar
    };
  }),
  removeAt: (x, y) => set((state) => {
    const xRound = Math.round(x);
    const yRound = Math.round(y);
    const newGrid = new Map(state.grid);
    newGrid.delete(`${xRound},${yRound}`);

    // Check if we are removing the gate or altar
    const isGate = Math.round(state.gatePosition[0]) === xRound && Math.floor(state.gatePosition[1]) === yRound;
    const isAltar = Math.round(state.altarPosition[0]) === xRound && Math.floor(state.altarPosition[1]) === yRound;

    return {
      grid: newGrid,
      staircasePositions: state.staircasePositions.filter(p => Math.round(p[0]) !== xRound || Math.round(p[1]) !== yRound),
      pillarPositions: state.pillarPositions.filter(p => Math.round(p[0]) !== xRound || Math.round(p[1]) !== yRound),
      gatePosition: isGate ? [999, 999, 0] : state.gatePosition,
      altarPosition: isAltar ? [999, 999, 0] : state.altarPosition,
    };
  }),
  removeFloorCube: (x, y) => set((state) => {
    const xRound = Math.round(x);
    const yRound = Math.round(y);
    const newGrid = new Map(state.grid);
    newGrid.delete(`${xRound},${yRound}`);
    return { grid: newGrid };
  }),
}));
