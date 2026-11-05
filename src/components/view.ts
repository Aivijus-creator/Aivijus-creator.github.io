import type { Dict } from '../i18n/en';
import type { Phase, Placed, PlayerId, Pose, SystemId, Tag } from '../data/types';
import { roleKind } from '../data/roles';
import { displayRole } from '../logic/explain';
import type { CourtPlayer } from './Court';

export type LabelMode = 'role' | 'zone' | 'jersey' | 'name';

export interface PlayersMeta {
  jersey: Partial<Record<PlayerId, string>>;
  name: Partial<Record<PlayerId, string>>;
}

export const DEFAULT_META: PlayersMeta = {
  jersey: { S: '7', S1: '7', S2: '3', OH1: '10', OH2: '14', MB1: '5', MB2: '12', OPP: '9', L: '1' },
  name: {},
};

export function poseFor(tag: Tag, phase: Phase): Pose {
  switch (tag) {
    case 'passer':
      return 'pass';
    case 'hidden':
    case 'penetratingSetter':
      return 'wait';
    case 'setting':
      return 'set';
    case 'server':
      return 'serve';
    case 'blocker':
      return phase === 'defense' ? 'block' : 'ready';
    default:
      return 'ready';
  }
}

export const ICON: Partial<Record<Tag, string>> = {
  passer: '🏐',
  hidden: '👻',
  penetratingSetter: '👻',
  attacker: '⚡',
  setting: '🎯',
  frontSetter: '🎯',
  blocker: '✋',
};

export const kindCode = (code: string) => code.replace(/\d+$/, '');

export interface ViewOpts {
  t: Dict;
  sys: SystemId;
  k: number;
  phase: Phase;
  labelMode: LabelMode;
  meta: PlayersMeta;
  showIcons: boolean;
  selectedId?: PlayerId | null;
  highlightRole?: string | null;
  focusId?: PlayerId | null;
}

export function toCourtPlayer(p: Placed & { gone?: boolean; path?: CourtPlayer['path']; pose?: Pose }, o: ViewOpts): CourtPlayer {
  const { t } = o;
  const code = t.code[p.id];
  const dr = displayRole(o.sys, o.k, p);
  let label = code;
  let small = false;
  if (o.labelMode === 'zone') label = String(p.zone);
  if (o.labelMode === 'jersey') label = o.meta.jersey[p.id] || code;
  if (o.labelMode === 'name') {
    label = (o.meta.name[p.id] || code).slice(0, 7);
    small = label.length > 3;
  }
  const kind = roleKind(p.id);
  return {
    id: p.id,
    zone: p.zone,
    x: p.x,
    y: p.y,
    pose: p.pose ?? poseFor(p.tag, o.phase),
    label,
    labelSmall: small,
    badge: kindCode(code),
    kind: dr === 'setterHitter' ? 'opp' : kind,
    icon: o.showIcons ? ICON[p.tag] : undefined,
    selected: o.selectedId === p.id,
    highlight: (!!o.highlightRole && o.highlightRole === dr) || o.focusId === p.id,
    gone: p.gone,
    path: p.path,
    ariaLabel: `${t.roleName[dr]} ${code}, ${t.ui.zone.toLowerCase()} ${p.zone}`,
  };
}
