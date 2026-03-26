import { create } from 'zustand';

export type VoxelType = 'DIRT' | 'GRASS' | 'ROCK' | 'EMPTY';

export interface Effect {
  id: string;
  x: number;
  y: number;
  z: number;
  type: 'DEBRIS' | 'EXPLOSION';
  color: string;
}

interface VoxelStore {
  voxels: Record<string, VoxelType>;
  effects: Effect[];
  addVoxel: (x: number, y: number, z: number, type: VoxelType) => void;
  removeVoxel: (x: number, y: number, z: number) => void;
  getVoxel: (x: number, y: number, z: number) => VoxelType;
  addEffect: (x: number, y: number, z: number, type: Effect['type'], color?: string) => void;
  removeEffect: (id: string) => void;
  initLevel: () => void;
}

const getVoxelKey = (x: number, y: number, z: number) => `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;

export const useVoxelStore = create<VoxelStore>((set, get) => ({
  voxels: {},
  effects: [],
  addVoxel: (x, y, z, type) => set((state) => ({
    voxels: { ...state.voxels, [getVoxelKey(x, y, z)]: type }
  })),
  removeVoxel: (x, y, z) => {
    const type = get().getVoxel(x, y, z);
    if (type === 'EMPTY') return;
    
    const color = type === 'GRASS' ? '#228B22' : (type === 'ROCK' ? '#808080' : '#8B4513');
    get().addEffect(x, y, z, 'DEBRIS', color);

    set((state) => {
      const newVoxels = { ...state.voxels };
      delete newVoxels[getVoxelKey(x, y, z)];
      return { voxels: newVoxels };
    });
  },
  getVoxel: (x, y, z) => get().voxels[getVoxelKey(x, y, z)] || 'EMPTY',
  addEffect: (x, y, z, type, color = '#ffffff') => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      effects: [...state.effects, { id, x, y, z, type, color }]
    }));
    // Auto-remove after 2 seconds
    setTimeout(() => get().removeEffect(id), 2000);
  },
  removeEffect: (id) => set((state) => ({
    effects: state.effects.filter(e => e.id !== id)
  })),
  initLevel: () => {
    const initialVoxels: Record<string, VoxelType> = {};
    // Create a flat ground
    for (let x = -15; x <= 15; x++) {
      for (let z = -2; z <= 2; z++) {
        initialVoxels[getVoxelKey(x, 0, z)] = (x > 5 && x < 10) ? 'DIRT' : 'GRASS';
        initialVoxels[getVoxelKey(x, -1, z)] = 'DIRT';
      }
    }
    // Add a big wall of dirt to bash through
    for (let x = 6; x <= 8; x++) {
      for (let y = 1; y <= 3; y++) {
        for (let z = -1; z <= 1; z++) {
          initialVoxels[getVoxelKey(x, y, z)] = 'DIRT';
        }
      }
    }
    // Add some rock (unbreakable)
    for (let y = 1; y <= 4; y++) {
      initialVoxels[getVoxelKey(12, y, 0)] = 'ROCK';
      initialVoxels[getVoxelKey(-12, y, 0)] = 'ROCK';
    }
    set({ voxels: initialVoxels });
  }
}));
