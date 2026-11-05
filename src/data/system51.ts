import type { Formation, PlayerId, SystemDef, Zone } from './types';
import { makeFormation } from './build';
import { zonesAt, mod6 } from '../logic/rotate';

export const LINEUP_51: PlayerId[] = ['S', 'OH1', 'MB1', 'OPP', 'OH2', 'MB2'];

/** Play order of 5-1 rotations, named by the setter's zone. Step k → setter zone. */
export const SETTER_ZONE_ORDER: Zone[] = [1, 6, 5, 4, 3, 2];

/** Serve-receive tables (section 6.2), keyed by setter zone. All verified legal by tests. */
export const RECEIVE_51: Record<Zone, Formation> = {
  1: [
    { id: 'OPP', zone: 4, x: 1.0, y: 1.0, tag: 'netWaiting' },
    { id: 'MB1', zone: 3, x: 4.0, y: 1.0, tag: 'netWaiting' },
    { id: 'OH1', zone: 2, x: 7.0, y: 5.5, tag: 'passer' },
    { id: 'OH2', zone: 5, x: 1.5, y: 6.0, tag: 'passer' },
    { id: 'L', zone: 6, x: 4.5, y: 6.5, tag: 'passer', replaces: 'MB2' },
    { id: 'S', zone: 1, x: 8.5, y: 6.5, tag: 'penetratingSetter', partner: 'OH1' },
  ],
  6: [
    { id: 'OH2', zone: 4, x: 1.5, y: 5.5, tag: 'passer' },
    { id: 'OPP', zone: 3, x: 4.5, y: 1.0, tag: 'netWaiting' },
    { id: 'MB1', zone: 2, x: 8.0, y: 1.0, tag: 'netWaiting' },
    { id: 'L', zone: 5, x: 3.5, y: 6.5, tag: 'passer', replaces: 'MB2' },
    { id: 'S', zone: 6, x: 5.5, y: 2.0, tag: 'penetratingSetter', partner: 'OPP' },
    { id: 'OH1', zone: 1, x: 7.5, y: 6.0, tag: 'passer' },
  ],
  5: [
    { id: 'MB2', zone: 4, x: 1.0, y: 0.8, tag: 'netWaiting' },
    { id: 'OH2', zone: 3, x: 2.5, y: 5.0, tag: 'passer' },
    { id: 'OPP', zone: 2, x: 8.0, y: 1.0, tag: 'netWaiting' },
    { id: 'S', zone: 5, x: 1.5, y: 2.0, tag: 'penetratingSetter', partner: 'MB2' },
    { id: 'OH1', zone: 6, x: 4.5, y: 6.0, tag: 'passer' },
    { id: 'L', zone: 1, x: 7.5, y: 6.0, tag: 'passer', replaces: 'MB1' },
  ],
  4: [
    { id: 'S', zone: 4, x: 1.5, y: 0.8, tag: 'frontSetter' },
    { id: 'MB2', zone: 3, x: 3.5, y: 1.0, tag: 'netWaiting' },
    { id: 'OH2', zone: 2, x: 7.0, y: 5.5, tag: 'passer' },
    { id: 'OH1', zone: 5, x: 1.5, y: 5.5, tag: 'passer' },
    { id: 'L', zone: 6, x: 4.5, y: 6.5, tag: 'passer', replaces: 'MB1' },
    { id: 'OPP', zone: 1, x: 8.5, y: 7.0, tag: 'hidden', partner: 'OH2' },
  ],
  3: [
    { id: 'OH1', zone: 4, x: 1.5, y: 5.0, tag: 'passer' },
    { id: 'S', zone: 3, x: 5.0, y: 1.0, tag: 'frontSetter' },
    { id: 'MB2', zone: 2, x: 8.0, y: 1.0, tag: 'netWaiting' },
    { id: 'L', zone: 5, x: 4.0, y: 6.5, tag: 'passer', replaces: 'MB1' },
    { id: 'OPP', zone: 6, x: 5.5, y: 2.5, tag: 'hidden', partner: 'S' },
    { id: 'OH2', zone: 1, x: 7.5, y: 6.0, tag: 'passer' },
  ],
  2: [
    { id: 'MB1', zone: 4, x: 1.0, y: 0.8, tag: 'netWaiting' },
    { id: 'OH1', zone: 3, x: 2.5, y: 5.0, tag: 'passer' },
    { id: 'S', zone: 2, x: 8.0, y: 0.8, tag: 'frontSetter' },
    { id: 'OPP', zone: 5, x: 1.5, y: 2.0, tag: 'hidden', partner: 'MB1' },
    { id: 'OH2', zone: 6, x: 5.0, y: 6.0, tag: 'passer' },
    { id: 'L', zone: 1, x: 7.5, y: 6.0, tag: 'passer', replaces: 'MB2' },
  ],
};

export const setterZone51 = (k: number): Zone => SETTER_ZONE_ORDER[mod6(k)];

const receive = (k: number) => RECEIVE_51[setterZone51(k)];

export const SYSTEM_51: SystemDef = {
  id: '5-1',
  lineup: LINEUP_51,
  hasLibero: true,
  settingSetter: () => 'S',
  formation: makeFormation({ id: '5-1', lineup: LINEUP_51, hasLibero: true, settingSetter: () => 'S', receive }),
};

/** Sanity helper used in tests: zone table of a rotation step. */
export const zones51 = (k: number) => zonesAt(LINEUP_51, k);
