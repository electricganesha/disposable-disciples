import { create } from 'zustand';
import { Vector3 } from 'three';

export type Job = 'NONE' | 'BLOCKER' | 'BONE_WEAVER' | 'DIGGER';
export type FloorType = 'STONE' | 'BONE' | 'SUPPORT';

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

  // Level Management
  currentLevelIndex: number;
  gameStarted: boolean;
  gameWon: boolean;
  gameLost: boolean;

  // World
  grid: Map<string, FloorType>;
  gatePosition: [number, number, number];
  altarPosition: [number, number, number];
  staircasePositions: [number, number, number][];
  pillarPositions: [number, number, number][];
  jobQuotas: { [key: string]: number };

  // Atmosphere (Parameterised)
  environmentType: 'ELDRITCH' | 'VOID' | 'BONE';
  backgroundColor: string;
  ambientColor: string;
  lightIntensity: number;

  // Interaction
  activeJob: Job;
  cultists: CultistData[];
  weavingCount: number;

  // Particle FX
  explosions: ExplosionData[];
  successes: ExplosionData[];

  // Actions
  startGame: () => void;
  loadLevel: (index: number) => void;
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

import { RITUAL_LEVELS, parseLayout } from './data/levels';

// ... (existing types)

export const useStore = create<GameState>((set, get) => ({
  savedCount: 0,
  lostCount: 0,
  lastSavedTime: 0,
  totalSpawned: 0,
  totalSpawningLimit: 20,
  requiredSavedCount: 15,

  currentLevelIndex: 0,
  gameStarted: false,
  gameWon: false,
  gameLost: false,

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

  startGame: () => {
    const params = new URLSearchParams(window.location.search);
    const levelValue = params.get("level");
    const startIndex = levelValue ? parseInt(levelValue, 10) : 0;
    const finalIndex = isNaN(startIndex) ? 0 : startIndex;
    
    get().loadLevel(finalIndex);
    set({ gameStarted: true });
  },

  loadLevel: (index) => {
    const level = RITUAL_LEVELS[index];
    if (!level) return;

    const gridMap = new Map<string, FloorType>();
    if (level.gridData) {
      Object.entries(level.gridData).forEach(([key, val]) => {
        gridMap.set(key, val);
      });
    }

    set({
      currentLevelIndex: index,
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
      cultists: [],
      gameWon: false,
      gameLost: false,
    });
  },

  loadNextLevel: () => {
    const nextIndex = get().currentLevelIndex + 1;
    if (nextIndex < RITUAL_LEVELS.length) {
      get().loadLevel(nextIndex);
    }
  },

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
    set((state) => {
      const newSavedCount = success ? state.savedCount + 1 : state.savedCount;
      const newLostCount = !success ? state.lostCount + 1 : state.lostCount;
      const newCultists = state.cultists.filter((c) => c.id !== id);
      
      const victory = newSavedCount >= state.requiredSavedCount;
      const allSpawned = state.totalSpawned >= state.totalSpawningLimit;
      const defeat = allSpawned && newCultists.length === 0 && newSavedCount < state.requiredSavedCount;

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

  getFloorAt: (x, targetY) => {
    const xRound = Math.round(x);
    const yVal = targetY !== undefined ? targetY : 0;
    
    // Check main grid
    const inGrid = get().grid.get(`${xRound},${yVal}`);
    if (inGrid) return inGrid;

    // Check staircases
    const onStair = get().staircasePositions.some(
      (p) => Math.round(p[0]) === xRound && Math.round(p[1]) === yVal
    );
    if (onStair) return "STONE";

    // Check altar
    const altar = get().altarPosition;
    if (Math.round(altar[0]) === xRound && Math.round(altar[1]) === yVal) {
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
        gridMap.set(key, val);
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
