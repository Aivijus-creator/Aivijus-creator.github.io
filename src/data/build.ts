/** Generic builders for the phases that are computed from rules (attack, our serve, defense). */
import type { Formation, Phase, Placed, PlayerId, SetterMode, SystemDef, Zone } from './types';
import { ATTACK_SPOT, BACK_ZONES, COVER_SPOTS, DEFENSE_SPOT, SERVER_SPOT, SETTER_TARGET, SETTER_TARGET_TRADITIONAL, ZONE_CENTER, isFront } from './zones';
import { isMiddle, roleKind } from './roles';
import { zonesAt } from '../logic/rotate';

export interface BuildCtx {
  id: SystemDef['id'];
  lineup: PlayerId[];
  hasLibero: boolean;
  settingSetter: (k: number) => PlayerId;
  receive: (k: number) => Formation;
}

/** Players on court when OUR team serves: libero replaces the back-row middle unless that middle is serving. */
export function servingCourt(ctx: BuildCtx, k: number): Placed[] {
  const zs = zonesAt(ctx.lineup, k);
  const out: Placed[] = [];
  for (let z = 1 as Zone; z <= 6; z = (z + 1) as Zone) {
    const id = zs[z];
    const c = z === 1 ? SERVER_SPOT : ZONE_CENTER[z];
    const tag = z === 1 ? 'server' : isFront(z) ? 'blocker' : 'backDefender';
    if (ctx.hasLibero && isMiddle(id) && BACK_ZONES.includes(z) && z !== 1) {
      out.push({ id: 'L', zone: z, x: c.x, y: c.y, tag, replaces: id });
    } else {
      out.push({ id, zone: z, x: c.x, y: c.y, tag, middleServes: z === 1 && ctx.hasLibero && isMiddle(id) ? true : undefined });
    }
  }
  return out;
}

function assignCovers(players: Placed[], usedXs: number[]): void {
  const free = COVER_SPOTS.filter((c) => usedXs.every((x) => Math.abs(x - c.x) > 1.6));
  const pool = free.length >= players.length ? free : COVER_SPOTS;
  const sorted = [...players].sort((a, b) => a.x - b.x);
  // spread players across the pool by x order
  sorted.forEach((p, i) => {
    const idx = pool.length === sorted.length ? i : Math.round((i * (pool.length - 1)) / Math.max(1, sorted.length - 1));
    const c = sorted.length === 1 ? nearest(pool, p) : pool[idx];
    p.x = c.x;
    p.y = c.y;
    p.tag = 'cover';
  });
}

function nearest(pool: { x: number; y: number }[], p: { x: number; y: number }) {
  return pool.reduce((best, c) => (Math.hypot(c.x - p.x, c.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y) ? c : best));
}

/** Receive → attack (switch). */
export function attackFormation(ctx: BuildCtx, k: number, mode: SetterMode = 'international'): Formation {
  const recv = ctx.receive(k).map((p) => ({ ...p }));
  const setter = ctx.settingSetter(k);
  const target = ctx.id === '4-2' && mode === 'traditional' ? SETTER_TARGET_TRADITIONAL : SETTER_TARGET;
  const backAttackXs: number[] = [];
  const covers: Placed[] = [];
  const front = recv.filter((p) => isFront(p.zone) && p.id !== setter);
  for (const p of recv) {
    p.partner = undefined;
    if (p.id === setter) {
      Object.assign(p, target, { tag: 'setting', attackKind: isFront(p.zone) && ctx.id === '5-1' ? 'dump' : undefined });
      continue;
    }
    if (isFront(p.zone)) {
      let kind: 'left' | 'middle' | 'right';
      if (ctx.id === '4-2') {
        const oh = front.find((f) => roleKind(f.id) === 'oh') ?? front[0];
        kind = p.id === oh.id ? 'left' : mode === 'traditional' ? 'right' : 'middle';
      } else {
        const r = roleKind(p.id);
        kind = r === 'oh' ? 'left' : r === 'mb' ? 'middle' : 'right';
      }
      Object.assign(p, ATTACK_SPOT[kind], { tag: 'attacker', attackKind: kind });
      continue;
    }
    // back row
    const r = roleKind(p.id);
    if (ctx.id !== '4-2' && r === 'oh') {
      Object.assign(p, ATTACK_SPOT.pipe, { tag: 'attacker', attackKind: 'pipe' });
      backAttackXs.push(ATTACK_SPOT.pipe.x);
    } else if (ctx.id === '5-1' && r === 'opp') {
      Object.assign(p, ATTACK_SPOT.backRight, { tag: 'attacker', attackKind: 'backRight' });
      backAttackXs.push(ATTACK_SPOT.backRight.x);
    } else {
      covers.push(p);
    }
  }
  assignCovers(covers, backAttackXs);
  return recv;
}

/** Defense base (perimeter), in the "after our serve" context. */
export function defenseFormation(ctx: BuildCtx, k: number): Formation {
  const court = servingCourt(ctx, k).map((p) => ({ ...p }));
  const setter = ctx.settingSetter(k);
  for (const p of court) {
    const r = roleKind(p.id);
    if (isFront(p.zone)) {
      p.tag = 'blocker';
      let spot;
      if (ctx.id === '4-2') {
        spot = p.id === setter ? DEFENSE_SPOT.frontRight : r === 'oh' ? DEFENSE_SPOT.frontLeft : DEFENSE_SPOT.frontMiddle;
      } else {
        spot = r === 'oh' ? DEFENSE_SPOT.frontLeft : r === 'mb' ? DEFENSE_SPOT.frontMiddle : DEFENSE_SPOT.frontRight;
      }
      Object.assign(p, spot);
    } else {
      p.tag = 'backDefender';
      let spot;
      if (ctx.id === '4-2') {
        spot = p.zone === 5 ? DEFENSE_SPOT.backLeft : p.zone === 6 ? DEFENSE_SPOT.backMiddle : DEFENSE_SPOT.backRight;
      } else {
        spot = r === 'oh' ? DEFENSE_SPOT.backLeft : r === 'libero' || r === 'mb' ? DEFENSE_SPOT.backMiddle : DEFENSE_SPOT.backRight;
      }
      Object.assign(p, spot);
    }
  }
  return court;
}

export function makeFormation(ctx: BuildCtx) {
  return (k: number, phase: Phase, mode?: SetterMode): Formation => {
    switch (phase) {
      case 'receive':
        return ctx.receive(k).map((p) => ({ ...p }));
      case 'attack':
        return attackFormation(ctx, k, mode);
      case 'serve':
        return servingCourt(ctx, k);
      case 'defense':
        return defenseFormation(ctx, k);
    }
  };
}
