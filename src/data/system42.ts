import type { Formation, PlayerId, SystemDef } from './types';
import { makeFormation } from './build';
import { mapFormation, MAP_42_SWAP } from '../logic/mapping';
import { mod6 } from '../logic/rotate';

export const LINEUP_42: PlayerId[] = ['S1', 'OH1', 'MB1', 'S2', 'OH2', 'MB2'];

/** Section 8.1 — Case A/B/C: S1 in zone 1/6/5, S2 (front row) sets. 5 passers. */
export const RECEIVE_42: Formation[] = [
  [
    { id: 'S2', zone: 4, x: 1.0, y: 0.8, tag: 'frontSetter' },
    { id: 'MB1', zone: 3, x: 4.0, y: 4.0, tag: 'passer' },
    { id: 'OH1', zone: 2, x: 7.0, y: 4.0, tag: 'passer' },
    { id: 'OH2', zone: 5, x: 1.5, y: 6.5, tag: 'passer' },
    { id: 'MB2', zone: 6, x: 4.5, y: 7.0, tag: 'passer' },
    { id: 'S1', zone: 1, x: 7.5, y: 6.5, tag: 'passer' },
  ],
  [
    { id: 'OH2', zone: 4, x: 1.5, y: 4.0, tag: 'passer' },
    { id: 'S2', zone: 3, x: 4.5, y: 0.8, tag: 'frontSetter' },
    { id: 'MB1', zone: 2, x: 7.5, y: 4.0, tag: 'passer' },
    { id: 'MB2', zone: 5, x: 1.5, y: 6.5, tag: 'passer' },
    { id: 'S1', zone: 6, x: 4.5, y: 6.5, tag: 'passer' },
    { id: 'OH1', zone: 1, x: 7.5, y: 6.5, tag: 'passer' },
  ],
  [
    { id: 'MB2', zone: 4, x: 1.5, y: 4.0, tag: 'passer' },
    { id: 'OH2', zone: 3, x: 4.5, y: 4.0, tag: 'passer' },
    { id: 'S2', zone: 2, x: 8.0, y: 0.8, tag: 'frontSetter' },
    { id: 'S1', zone: 5, x: 1.5, y: 6.5, tag: 'passer' },
    { id: 'OH1', zone: 6, x: 4.5, y: 6.5, tag: 'passer' },
    { id: 'MB1', zone: 1, x: 7.5, y: 6.5, tag: 'passer' },
  ],
];

export const receive42 = (k: number) => {
  const step = mod6(k);
  const base = RECEIVE_42[step % 3];
  return step < 3 ? base.map((p) => ({ ...p })) : mapFormation(base, MAP_42_SWAP);
};

/** In a 4-2 the FRONT-row setter sets. */
const settingSetter = (k: number): PlayerId => (mod6(k) < 3 ? 'S2' : 'S1');

export const SYSTEM_42: SystemDef = {
  id: '4-2',
  lineup: LINEUP_42,
  hasLibero: false,
  settingSetter,
  formation: makeFormation({ id: '4-2', lineup: LINEUP_42, hasLibero: false, settingSetter, receive: receive42 }),
};
