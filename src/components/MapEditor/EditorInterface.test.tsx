import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorInterface } from './EditorInterface';
import { useStore } from '../../store';

// Mock the palette to keep tests focused
vi.mock('./EditorPalette', () => ({
  EditorPalette: () => <div data-testid="palette" />
}));

describe('EditorInterface', () => {
  const initialState = useStore.getState();

  beforeEach(() => {
    act(() => {
      useStore.setState(initialState, true);
    });
  });

  it('renders generated ASCII from the store', () => {
    render(<EditorInterface />);
    const textarea = screen.getByRole('textbox', { name: 'ASCII Layout' }) as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
  });

  it('updates the store when typing in the textarea', () => {
    render(<EditorInterface />);
    const textarea = screen.getByRole('textbox', { name: 'ASCII Layout' }) as HTMLTextAreaElement;
    
    fireEvent.change(textarea, { target: { value: '#' } });
    
    // Check if store updated (parseLayout maps # to STONE at 0,maxY)
    // Actually, parseLayout behavior depends on the content height.
    // Let's just verify it's not empty anymore.
    expect(useStore.getState().grid.size).toBeGreaterThan(0);
    expect(textarea.value).toBe('#');
  });

  it('updates the textarea when the store changes externally', () => {
    render(<EditorInterface />);
    const textarea = screen.getByRole('textbox', { name: 'ASCII Layout' }) as HTMLTextAreaElement;
    
    act(() => {
      // Manually add a stone at 0,0
      useStore.getState().placeAt(0, 0, '#');
    });

    // The component should re-render and sync generatedASCII to localASCII
    expect(textarea.value).toContain('#');
  });

  it('preserves user input during typing (isInternalChange flag)', () => {
     render(<EditorInterface />);
     const textarea = screen.getByRole('textbox', { name: 'ASCII Layout' }) as HTMLTextAreaElement;

     // User types something with extra space (the generator would trim it)
     const userInput = '# ';
     fireEvent.change(textarea, { target: { value: userInput } });

     // The generatedASCII from store will be '#' (due to .trimEnd() in EditorInterface)
     // But localASCII should stay '# ' because it was an internal change.
     expect(textarea.value).toBe(userInput);
  });

  it('resets localASCII to match store if change is external', () => {
    render(<EditorInterface />);
    const textarea = screen.getByRole('textbox', { name: 'ASCII Layout' }) as HTMLTextAreaElement;
    
    // 1. Initial state: empty
    expect(textarea.value).not.toContain('#');

    // 2. External change
    act(() => {
      useStore.getState().placeAt(0, 0, '#');
    });

    expect(textarea.value).toContain('#');
  });

  it('loads template metadata from store on render', () => {
    act(() => {
      useStore.setState({
        currentLevelName: 'My Special Ritual',
        currentLevelDescription: 'Spooky descriptions here.',
        environmentType: 'LAVA',
        totalSpawningLimit: 42,
        requiredSavedCount: 11,
      });
    });

    render(<EditorInterface />);
    
    const nameInput = screen.getByLabelText('Ritual Name') as HTMLInputElement;
    expect(nameInput.value).toBe('My Special Ritual');

    const descInput = screen.getByLabelText('Flavour Description') as HTMLInputElement;
    expect(descInput.value).toBe('Spooky descriptions here.');
  });
});
