import type { Formation, PlayerId } from '../data/types';

export type RoleMap = Partial<Record<PlayerId, PlayerId>>;

export const mapId = (id: PlayerId, map: RoleMap): PlayerId => map[id] ?? id;

/** Rename players in a formation (used to derive 6-2 / 4-2 rotations from base tables). */
export function mapFormation(f: Formation, map: RoleMap): Formation {
  return f.map((p) => ({
    ...p,
    id: mapId(p.id, map),
    partner: p.partner ? mapId(p.partner, map) : undefined,
    replaces: p.replaces ? mapId(p.replaces, map) : undefined,
  }));
}

export const MAP_62_FIRST: RoleMap = { S: 'S1', OPP: 'S2' };
export const MAP_62_SECOND: RoleMap = { S: 'S2', OPP: 'S1', OH1: 'OH2', OH2: 'OH1', MB1: 'MB2', MB2: 'MB1' };
export const MAP_42_SWAP: RoleMap = { S1: 'S2', S2: 'S1', OH1: 'OH2', OH2: 'OH1', MB1: 'MB2', MB2: 'MB1' };
