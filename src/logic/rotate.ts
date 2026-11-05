import type { PlayerId, Zone } from '../data/types';

/** Clockwise rotation: zone 2 → 1, 1 → 6, 6 → 5, 5 → 4, 4 → 3, 3 → 2. Lineup is ordered zone 1 → 6. */
export function rotateLineup<T>(lineup: T[]): T[] {
  return [...lineup.slice(1), lineup[0]];
}

export function rotateBackLineup<T>(lineup: T[]): T[] {
  return [lineup[lineup.length - 1], ...lineup.slice(0, -1)];
}

export const mod6 = (k: number) => ((k % 6) + 6) % 6;

/** Zone → player after k clockwise rotations of the starting lineup. */
export function zonesAt(lineup: PlayerId[], k: number): Record<Zone, PlayerId> {
  const out = {} as Record<Zone, PlayerId>;
  for (let z = 1 as Zone; z <= 6; z = (z + 1) as Zone) {
    out[z] = lineup[(z - 1 + mod6(k)) % 6];
  }
  return out;
}

export function zoneOf(lineup: PlayerId[], k: number, id: PlayerId): Zone {
  const zs = zonesAt(lineup, k);
  return (Number(Object.keys(zs).find((z) => zs[Number(z) as Zone] === id)) || 1) as Zone;
}

/** The zone a player moves to after one clockwise rotation. */
export const nextZone = (z: Zone): Zone => (z === 1 ? 6 : ((z - 1) as Zone));
