import type { Zone } from '../data/types';

export interface OverlapPlayer {
  zone: Zone;
  x: number;
  y: number;
}

/** a must be in front of b (smaller y) — or a must be left of b (smaller x). */
export interface OverlapRule {
  a: Zone;
  b: Zone;
  kind: 'frontBack' | 'leftRight';
}

export const OVERLAP_RULES: OverlapRule[] = [
  { a: 4, b: 5, kind: 'frontBack' },
  { a: 3, b: 6, kind: 'frontBack' },
  { a: 2, b: 1, kind: 'frontBack' },
  { a: 4, b: 3, kind: 'leftRight' },
  { a: 3, b: 2, kind: 'leftRight' },
  { a: 5, b: 6, kind: 'leftRight' },
  { a: 6, b: 1, kind: 'leftRight' },
];

export interface RuleResult {
  rule: OverlapRule;
  ok: boolean;
  skipped: boolean; // server exempt
}

export function evaluateOverlap(players: OverlapPlayer[], serverExempt: boolean): RuleResult[] {
  const byZone = new Map<Zone, OverlapPlayer>();
  players.forEach((p) => byZone.set(p.zone, p));
  return OVERLAP_RULES.map((rule) => {
    const pa = byZone.get(rule.a);
    const pb = byZone.get(rule.b);
    const skipped = serverExempt && (rule.a === 1 || rule.b === 1);
    if (!pa || !pb) return { rule, ok: true, skipped: true };
    const ok = rule.kind === 'frontBack' ? pa.y < pb.y : pa.x < pb.x;
    return { rule, ok: skipped ? true : ok, skipped };
  });
}

export type Violation = OverlapRule;

export function checkOverlap(players: OverlapPlayer[], serverExempt: boolean): Violation[] {
  return evaluateOverlap(players, serverExempt)
    .filter((r) => !r.ok && !r.skipped)
    .map((r) => r.rule);
}

/** All overlap partners of a zone. */
export function partnerZones(zone: Zone): Zone[] {
  return OVERLAP_RULES.filter((r) => r.a === zone || r.b === zone)
    .map((r) => (r.a === zone ? r.b : r.a))
    .sort((a, b) => a - b);
}

export function rulesFor(zone: Zone): OverlapRule[] {
  return OVERLAP_RULES.filter((r) => r.a === zone || r.b === zone);
}
