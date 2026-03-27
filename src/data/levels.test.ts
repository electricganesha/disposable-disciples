import { describe, it, expect } from 'vitest';
import { parseLayout } from './levels';

describe('parseLayout', () => {
  it('identifies floor level (y=0) and parses stone and bone', () => {
    const layout = `
G
#B`;
    // Note: parseLayout filters empty lines, so we need content on the lines
    const result = parseLayout(layout, 0);
    
    // The line with # or B is the floor (y=0 in our parsing logic if it's the first with #/B)
    // Actually, floorRow is lines.findIndex(includes # or B)
    // In this layout: lines[0] = "G", lines[1] = "#B"
    // floorRow = 1.
    // row 0 ("G"): y = 1 - 0 = 1
    // row 1 ("#B"): y = 1 - 1 = 0
    
    expect(result.gridData['0,0']).toBe('STONE');
    expect(result.gridData['1,0']).toBe('BONE');
    expect(result.gatePosition).toEqual([0, 1.1, 0]);
  });

  it('handles empty spaces and multi-level structures', () => {
    const layout = `
A
.
#`;
    const result = parseLayout(layout, 0);
    
    // lines: ["A", ".", "#"]
    // floorRow = 2
    // row 0 ("A"): y = 2 - 0 = 2
    // row 2 ("#"): y = 2 - 2 = 0
    
    expect(result.gridData['0,0']).toBe('STONE');
    expect(result.altarPosition).toEqual([0, 2.1, 0]);
  });

  it('parses stairs and pillars', () => {
    const layout = `
S|
#`;
    const result = parseLayout(layout, 0);
    
    expect(result.staircasePositions[0]).toEqual([0, 1, 0]);
    expect(result.pillarPositions[0]).toEqual([1, 1, 0]);
  });
});
