import { describe, expect, it } from 'vitest';
import { rotateLineup, rotateBackLineup, zonesAt } from '../logic/rotate';
import { LINEUP_51 } from '../data/system51';

describe('rotation', () => {
  it('6 rotations return the original lineup', () => {
    let l = [...LINEUP_51];
    for (let i = 0; i < 6; i++) l = rotateLineup(l);
    expect(l).toEqual(LINEUP_51);
  });
  it('rotate back undoes rotate', () => {
    expect(rotateBackLineup(rotateLineup(LINEUP_51))).toEqual(LINEUP_51);
  });
  it('clockwise: player in zone 2 moves to zone 1', () => {
    const before = zonesAt(LINEUP_51, 0);
    const after = zonesAt(LINEUP_51, 1);
    expect(after[1]).toBe(before[2]);
    expect(after[6]).toBe(before[1]);
    expect(after[2]).toBe(before[3]);
  });
});
