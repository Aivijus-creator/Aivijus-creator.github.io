import type { PlayerId, SystemDef } from './types';
import { makeFormation } from './build';
import { RECEIVE_51, SETTER_ZONE_ORDER } from './system51';
import { mapFormation, MAP_62_FIRST, MAP_62_SECOND } from '../logic/mapping';
import { mod6 } from '../logic/rotate';

export const LINEUP_62: PlayerId[] = ['S1', 'OH1', 'MB1', 'S2', 'OH2', 'MB2'];

/** 6-2 = 5-1 R1/R6/R5 twice, with role mapping (section 7.2). */
export const receive62 = (k: number) => {
  const step = mod6(k);
  const base = RECEIVE_51[SETTER_ZONE_ORDER[step % 3]];
  return mapFormation(base, step < 3 ? MAP_62_FIRST : MAP_62_SECOND);
};

const settingSetter = (k: number): PlayerId => (mod6(k) < 3 ? 'S1' : 'S2');

export const SYSTEM_62: SystemDef = {
  id: '6-2',
  lineup: LINEUP_62,
  hasLibero: true,
  settingSetter,
  formation: makeFormation({ id: '6-2', lineup: LINEUP_62, hasLibero: true, settingSetter, receive: receive62 }),
};
