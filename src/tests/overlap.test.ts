import { describe, expect, it } from 'vitest';
import { checkOverlap, partnerZones } from '../logic/overlap';
import { ZONE_CENTER, SERVER_SPOT } from '../data/zones';
import type { Zone } from '../data/types';

const centers = () => ([1, 2, 3, 4, 5, 6] as Zone[]).map((z) => ({ zone: z, ...ZONE_CENTER[z] }));

describe('checkOverlap', () => {
  it('zone centers are legal', () => {
    expect(checkOverlap(centers(), false)).toHaveLength(0);
  });
  it('detects front/back fault (2 behind 1)', () => {
    const p = centers().map((q) => (q.zone === 2 ? { ...q, y: 7 } : q));
    const v = checkOverlap(p, false);
    expect(v).toContainEqual({ a: 2, b: 1, kind: 'frontBack' });
  });
  it('detects left/right fault (5 right of 6)', () => {
    const p = centers().map((q) => (q.zone === 5 ? { ...q, x: 5 } : q));
    expect(checkOverlap(p, false)).toContainEqual({ a: 5, b: 6, kind: 'leftRight' });
  });
  it('server is exempt', () => {
    const p = centers().map((q) => (q.zone === 1 ? { ...q, x: 0.5, ...{ y: SERVER_SPOT.y } } : q));
    expect(checkOverlap(p, false).length).toBeGreaterThan(0);
    expect(checkOverlap(p, true)).toHaveLength(0);
  });
  it('4 and 2 are never compared', () => {
    const p = centers().map((q) => (q.zone === 4 ? { ...q, x: 3.6 } : q.zone === 3 ? { ...q, x: 3.8 } : q));
    expect(checkOverlap(p, false)).toHaveLength(0);
  });
  it('partner lists (14.7)', () => {
    expect(partnerZones(1)).toEqual([2, 6]);
    expect(partnerZones(2)).toEqual([1, 3]);
    expect(partnerZones(3)).toEqual([2, 4, 6]);
    expect(partnerZones(4)).toEqual([3, 5]);
    expect(partnerZones(5)).toEqual([4, 6]);
    expect(partnerZones(6)).toEqual([1, 3, 5]);
  });
});
