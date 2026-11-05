import { describe, expect, it } from 'vitest';
import { SYSTEMS, SYSTEM_IDS } from '../data/systems';
import { checkOverlap } from '../logic/overlap';
import { zonesAt } from '../logic/rotate';
import { LINEUP_51, SETTER_ZONE_ORDER } from '../data/system51';
import { LINEUP_62 } from '../data/system62';
import { isMiddle } from '../data/roles';
import type { Phase, SetterMode, Zone } from '../data/types';
import { whyHere } from '../logic/explain';
import { en } from '../i18n/en';
import { lt } from '../i18n/lt';

const PHASES: Phase[] = ['receive', 'attack', 'serve', 'defense'];
const MODES: SetterMode[] = ['international', 'traditional'];

describe('serve-receive formations are legal', () => {
  for (const id of SYSTEM_IDS) {
    for (const mode of id === '4-2' ? MODES : (['international'] as SetterMode[])) {
      for (let k = 0; k < 6; k++) {
        it(`${id} ${mode} step ${k}`, () => {
          const f = SYSTEMS[id].formation(k, 'receive', mode);
          expect(f).toHaveLength(6);
          expect(checkOverlap(f, false)).toEqual([]);
        });
      }
    }
  }
  it('our-serve formations are legal (server exempt)', () => {
    for (const id of SYSTEM_IDS) for (let k = 0; k < 6; k++) expect(checkOverlap(SYSTEMS[id].formation(k, 'serve'), true)).toEqual([]);
  });
});

describe('formations match the rotation table', () => {
  it('every receive formation puts each player in its rotational zone', () => {
    for (const id of SYSTEM_IDS) {
      const sys = SYSTEMS[id];
      for (let k = 0; k < 6; k++) {
        const zs = zonesAt(sys.lineup, k);
        for (const p of sys.formation(k, 'receive')) {
          if (p.id === 'L') {
            expect(isMiddle(zs[p.zone])).toBe(true);
            expect(p.replaces).toBe(zs[p.zone]);
          } else expect(zs[p.zone]).toBe(p.id);
        }
      }
    }
  });
});

describe('5-1', () => {
  it('setter and OPP are always 3 zones apart', () => {
    for (let k = 0; k < 6; k++) {
      const zs = zonesAt(LINEUP_51, k);
      const zone = (pid: string) => Number(Object.entries(zs).find(([, v]) => v === pid)![0]);
      const d = Math.abs(zone('S') - zone('OPP'));
      expect(Math.min(d, 6 - d)).toBe(3);
    }
  });
  it('rotations are named by setter zone in play order 1,6,5,4,3,2', () => {
    for (let k = 0; k < 6; k++) expect(zonesAt(LINEUP_51, k)[SETTER_ZONE_ORDER[k]]).toBe('S');
  });
});

describe('libero', () => {
  it('is never in zones 2, 3 or 4 in any phase, after any rotation', () => {
    for (const id of SYSTEM_IDS)
      for (let k = 0; k < 12; k++)
        for (const ph of PHASES)
          for (const p of SYSTEMS[id].formation(k, ph)) if (p.id === 'L') expect([1, 5, 6]).toContain(p.zone);
  });
  it('middle serves when in zone 1 on our serve', () => {
    const f = SYSTEMS['5-1'].formation(2, 'serve'); // R5: MB1 in zone 1
    expect(f.find((p) => p.zone === 1)!.id).toBe('MB1');
    expect(f.some((p) => p.id === 'L')).toBe(false);
  });
  it('4-2 has no libero', () => {
    for (let k = 0; k < 6; k++) for (const ph of PHASES) expect(SYSTEMS['4-2'].formation(k, ph).some((p) => p.id === 'L')).toBe(false);
  });
});

describe('6-2 mapping', () => {
  const table: Record<number, string[]> = {
    // S1 zone → zones 1..6 (section 7.1)
    1: ['S1', 'OH1', 'MB1', 'S2', 'OH2', 'MB2'],
    6: ['OH1', 'MB1', 'S2', 'OH2', 'MB2', 'S1'],
    5: ['MB1', 'S2', 'OH2', 'MB2', 'S1', 'OH1'],
    4: ['S2', 'OH2', 'MB2', 'S1', 'OH1', 'MB1'],
    3: ['OH2', 'MB2', 'S1', 'OH1', 'MB1', 'S2'],
    2: ['MB2', 'S1', 'OH1', 'MB1', 'S2', 'OH2'],
  };
  it('mapped receive formations produce the 7.1 zone table', () => {
    for (let k = 0; k < 6; k++) {
      const expected = table[SETTER_ZONE_ORDER[k]];
      const zs = zonesAt(LINEUP_62, k);
      expect(([1, 2, 3, 4, 5, 6] as Zone[]).map((z) => zs[z])).toEqual(expected);
      const f = SYSTEMS['6-2'].formation(k, 'receive');
      for (const p of f) {
        const who = p.id === 'L' ? p.replaces! : p.id;
        expect(expected[p.zone - 1]).toBe(who);
      }
    }
  });
  it('back-row setter sets; always 3 front attackers', () => {
    for (let k = 0; k < 6; k++) {
      const att = SYSTEMS['6-2'].formation(k, 'attack').filter((p) => [2, 3, 4].includes(p.zone) && p.tag === 'attacker');
      expect(att).toHaveLength(3);
    }
  });
});

describe('rotate cycle (14.7)', () => {
  it('6 rotations return every player to its start zone and formation', () => {
    for (const id of SYSTEM_IDS)
      for (const ph of PHASES) expect(SYSTEMS[id].formation(6, ph)).toEqual(SYSTEMS[id].formation(0, ph));
  });
});

describe('why here texts', () => {
  it('every player in every formation has a non-empty text (both languages)', () => {
    for (const dict of [en, lt])
      for (const id of SYSTEM_IDS)
        for (let k = 0; k < 6; k++)
          for (const ph of PHASES)
            for (const p of SYSTEMS[id].formation(k, ph)) {
              const w = whyHere(dict, id, k, ph, p);
              expect(w.length).toBeGreaterThan(10);
              expect(w).not.toMatch(/undefined|\{/);
            }
  });
});
