import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useStore } from './store';

describe('GameState Store', () => {
  const initialState = { ...useStore.getState() };

  beforeEach(() => {
    act(() => {
      // Create a fresh map for grid to avoid sharing references
      useStore.setState({
        ...initialState,
        grid: new Map(),
        cultists: [],
      }, true);
    });
  });

  it('loads a level correctly', () => {
    act(() => {
      useStore.getState().loadLevel(0);
    });
    
    const state = useStore.getState();
    expect(state.currentLevelIndex).toBe(0);
    expect(state.grid.size).toBeGreaterThan(0);
    expect(state.totalSpawningLimit).toBeGreaterThan(0);
  });

  it('adds cultists up to the spawn limit', () => {
    act(() => {
      // Use a custom state for test stability
      useStore.setState({
        totalSpawningLimit: 5,
        totalSpawned: 0,
        cultists: [],
        gatePosition: [0, 0, 0]
      });
    });

    act(() => {
      for (let i = 0; i < 10; i++) {
        useStore.getState().addCultist();
      }
    });

    expect(useStore.getState().cultists.length).toBe(5);
    expect(useStore.getState().totalSpawned).toBe(5);
  });

  it('handles win condition when required saved count is reached', () => {
     act(() => {
       useStore.setState({
         requiredSavedCount: 1,
         savedCount: 0,
         cultists: [{ id: '1', position: [0,0,0], direction: 1, job: 'NONE', selected: false, scale: [1,1,1], speedMultiplier: 1, colorHueShift: 0 }],
         gameWon: false
       });
     });

     act(() => {
       useStore.getState().removeCultist('1', true);
     });

     expect(useStore.getState().savedCount).toBe(1);
     expect(useStore.getState().gameWon).toBe(true);
  });

  it('handles lose condition when all spawned cultists are lost and requirements not met', () => {
    act(() => {
      useStore.setState({
        totalSpawned: 10,
        totalSpawningLimit: 10,
        requiredSavedCount: 5,
        savedCount: 0,
        lostCount: 0,
        cultists: [{ id: '1', position: [0,0,0], direction: 1, job: 'NONE', selected: false, scale: [1,1,1], speedMultiplier: 1, colorHueShift: 0 }],
        gameLost: false
      });
    });

    act(() => {
      useStore.getState().removeCultist('1', false);
    });

    expect(useStore.getState().gameLost).toBe(true);
    expect(useStore.getState().lostCount).toBe(1);
  });

  it('updates level structure from ASCII', () => {
    act(() => {
      useStore.getState().updateLevelFromASCII('#');
    });

    const state = useStore.getState();
    expect(state.grid.size).toBeGreaterThan(0);
    // parseLayout ensures gate and altar exist even if not in ASCII (with defaults)
    expect(state.gatePosition).toBeDefined();
    expect(state.altarPosition).toBeDefined();
  });
});
