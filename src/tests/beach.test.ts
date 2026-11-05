import { describe, expect, it } from 'vitest';
import { beachRally, initialBeach, isSideSwitch } from '../logic/beach';

describe('beach', () => {
  it('serving order alternates when the team regains serve', () => {
    let s = initialBeach();
    expect(s.ourServer).toBe('A');
    s = beachRally(s, 'us'); // A keeps serving
    expect(s.ourServer).toBe('A');
    s = beachRally(s, 'them');
    s = beachRally(s, 'us'); // side-out → B
    expect(s.ourServer).toBe('B');
    s = beachRally(s, 'them');
    s = beachRally(s, 'us'); // → A
    expect(s.ourServer).toBe('A');
  });
  it('side switch at multiples of 7 (sets 1–2) and 5 (set 3)', () => {
    expect([7, 14, 21].every((n) => isSideSwitch(n, 1))).toBe(true);
    expect(isSideSwitch(5, 1)).toBe(false);
    expect([5, 10, 15].every((n) => isSideSwitch(n, 3))).toBe(true);
    expect(isSideSwitch(7, 3)).toBe(false);
    expect(isSideSwitch(0, 2)).toBe(false);
  });
});
