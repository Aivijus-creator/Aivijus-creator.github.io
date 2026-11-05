/** Builds the texts of the info panel and the "Why here?" panel. Pure functions → testable. */
import type { Dict } from '../i18n/en';
import type { Formation, Phase, Placed, PlayerId, SetterMode, SystemId, Zone } from '../data/types';
import { roleKind } from '../data/roles';
import { SYSTEMS } from '../data/systems';
import { SETTER_ZONE_ORDER } from '../data/system51';
import { isFront, sideOfX } from '../data/zones';
import { evaluateOverlap, rulesFor } from './overlap';
import { mod6 } from './rotate';
import { fmt } from './fmt';

export const NEXT_PHASE: Record<Phase, Phase | null> = { receive: 'attack', serve: 'defense', attack: 'defense', defense: null };

/** Rotation label: named by zone of S (5-1) or S1 (6-2, 4-2). */
export const rotationName = (k: number) => `R${SETTER_ZONE_ORDER[mod6(k)]}`;

/** Role "kind" for texts: 6-2 front setter = setter-hitter; 4-2 non-setters = hitters. */
export function displayRole(sys: SystemId, k: number, p: { id: PlayerId; zone: Zone }): keyof Dict['roleName'] {
  const r = roleKind(p.id);
  if (sys === '6-2' && r === 'setter' && p.id !== SYSTEMS['6-2'].settingSetter(k)) return 'setterHitter';
  if (sys === '4-2' && r !== 'setter') return 'hitter';
  return r;
}

export function whyHere(t: Dict, sys: SystemId, k: number, phase: Phase, p: Placed): string {
  const code = t.code[p.id];
  if (sys === '5-1' && phase === 'receive') {
    const txt = t.why51[SETTER_ZONE_ORDER[mod6(k)]]?.[p.id];
    if (txt) return txt;
  }
  const side = t.side[sideOfX(p.x)];
  let s: string;
  switch (p.tag) {
    case 'passer':
      s = fmt(t.tpl.passer, { role: code, side });
      break;
    case 'hidden':
    case 'penetratingSetter': {
      if (p.tag === 'penetratingSetter') {
        s = fmt(t.tpl.penetratingSetter, { role: code });
      } else {
        const rel = p.partner ? t.tpl.behind : t.tpl.beside;
        s = fmt(t.tpl.hidden, { role: code, rel, partner: p.partner ? t.code[p.partner] : '' });
      }
      break;
    }
    case 'backDefender': {
      const r = roleKind(p.id);
      const side4 = sideOfX(p.x);
      const reason =
        sys === '4-2'
          ? side4 === 'left' ? t.defReason.oh : side4 === 'middle' ? t.defReason.libero : t.defReason.opp
          : t.defReason[r];
      s = fmt(t.tpl.backDefender, { role: code, spot: t.backSpot[sideOfX(p.x)], reason });
      if (p.zone === 1 && phase === 'serve') s = fmt(t.tpl.server, { role: code });
      break;
    }
    case 'attacker':
      s = fmt(t.tpl.attacker, { role: code, kind: t.attackKind[p.attackKind ?? 'left'] });
      break;
    case 'blocker':
      s = fmt(t.tpl.blocker, { role: code, side });
      break;
    default:
      s = fmt(t.tpl[p.tag], { role: code });
  }
  if (p.middleServes) s += ' ' + t.middleServes;
  const dr = displayRole(sys, k, p);
  if (dr === 'setterHitter') s += ' ' + t.extra62;
  if (sys === '4-2' && p.tag === 'frontSetter') s += ' ' + t.extra42;
  return s;
}

export interface ConstraintItem {
  text: string;
  rule: string;
  ok: boolean;
  partnerId: PlayerId;
  partnerZone: Zone;
}

/** Auto-generated overlap constraints for the selected player (14.3 b). */
export function constraintsFor(t: Dict, formation: Formation, p: Placed, serverExempt: boolean): ConstraintItem[] {
  const results = evaluateOverlap(formation, serverExempt);
  return rulesFor(p.zone).map((rule) => {
    const res = results.find((r) => r.rule === rule)!;
    const otherZone = rule.a === p.zone ? rule.b : rule.a;
    const other = formation.find((q) => q.zone === otherZone)!;
    const iAmA = rule.a === p.zone;
    const key = rule.kind === 'frontBack' ? (iAmA ? 'frontOf' : 'behind') : iAmA ? 'leftOf' : 'rightOf';
    const ruleText = fmt(rule.kind === 'frontBack' ? t.constraint.ruleFB : t.constraint.ruleLR, { a: rule.a, b: rule.b });
    return {
      text: fmt(t.constraint[key], { p: t.code[other.id], z: otherZone }),
      rule: ruleText,
      ok: res.ok,
      partnerId: other.id,
      partnerZone: otherZone,
    };
  });
}

/** Where the player goes next (14.3 #3). */
export function nextMove(t: Dict, sys: SystemId, k: number, phase: Phase, p: Placed, mode?: SetterMode): { text: string; to?: { x: number; y: number } } {
  const np = NEXT_PHASE[phase];
  if (!np) return { text: t.next.stays };
  const f = SYSTEMS[sys].formation(k, np, mode);
  const q = f.find((x) => x.id === p.id);
  if (!q || Math.hypot(q.x - p.x, q.y - p.y) < 0.3) return { text: t.next.stays };
  let where: string;
  if (q.tag === 'setting') where = t.next.target;
  else if (q.tag === 'attacker') where = fmt(t.next.attackSpot, { kind: t.attackKind[q.attackKind ?? 'left'] });
  else if (q.tag === 'cover') where = t.next.cover;
  else where = fmt(t.next.defenseSpot, { where: isFront(q.zone) ? t.side[sideOfX(q.x)] : t.backSpot[sideOfX(q.x)] });
  return { text: fmt(t.next.toSpot, { where }), to: { x: q.x, y: q.y } };
}

export interface RotationInfo {
  front: string[];
  back: string[];
  passers: string[];
  hidden: string[];
  attackers: number;
  setterPath: string;
  libero: string;
  risk: string;
}

export function rotationInfo(t: Dict, sys: SystemId, k: number, mode?: SetterMode): RotationInfo {
  const S = SYSTEMS[sys];
  const recv = S.formation(k, 'receive', mode);
  const att = S.formation(k, 'attack', mode);
  const byZone = (zs: Zone[]) => zs.map((z) => recv.find((p) => p.zone === z)!).map((p) => t.code[p.id]);
  const setter = S.settingSetter(k);
  const sR = recv.find((p) => p.id === setter)!;
  const sA = att.find((p) => p.id === setter)!;
  const dist = Math.hypot(sA.x - sR.x, sA.y - sR.y).toFixed(1);
  const lib = recv.find((p) => p.id === 'L');
  const hiddenP = recv.filter((p) => p.tag === 'hidden' || p.tag === 'penetratingSetter');
  let risk = hiddenP.filter((p) => p.partner).map((p) => `${t.code[p.id]} ↔ ${t.code[p.partner!]}`);
  if (!risk.length) {
    const fs = recv.find((p) => p.tag === 'frontSetter');
    if (fs) {
      const behind = recv.find((p) => p.zone === ({ 4: 5, 3: 6, 2: 1 } as Record<number, Zone>)[fs.zone]);
      if (behind) risk = [`${t.code[fs.id]} ↔ ${t.code[behind.id]}`];
    }
  }
  return {
    front: byZone([4, 3, 2]),
    back: byZone([5, 6, 1]),
    passers: recv.filter((p) => p.tag === 'passer').map((p) => t.code[p.id]),
    hidden: hiddenP.map((p) => t.code[p.id]),
    attackers: att.filter((p) => isFront(p.zone) && p.tag === 'attacker').length,
    setterPath: `${t.code[setter]}: ${t.ui.zone} ${sR.zone} → ${t.next.target.replace(/^\S+\s/, '')} · ${dist} ${t.ui.meters}`,
    libero: lib ? fmt(t.toast.liberoSwap, { mb: t.code[lib.replaces!] }) : t.ui.none,
    risk: risk.join(', ') || t.ui.none,
  };
}
