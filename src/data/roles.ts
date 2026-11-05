import type { PlayerId, RoleKind } from './types';

export function roleKind(id: PlayerId): RoleKind {
  if (id === 'S' || id === 'S1' || id === 'S2') return 'setter';
  if (id === 'OH1' || id === 'OH2') return 'oh';
  if (id === 'MB1' || id === 'MB2') return 'mb';
  if (id === 'OPP') return 'opp';
  return 'libero';
}

export const isMiddle = (id: PlayerId) => id === 'MB1' || id === 'MB2';
export const isSetter = (id: PlayerId) => roleKind(id) === 'setter';

/** Role badge colors (section 15.1). */
export const ROLE_BADGE: Record<RoleKind, { bg: string; fg: string; border?: string }> = {
  setter: { bg: '#F2B705', fg: '#16161A' },
  oh: { bg: '#1F3A93', fg: '#FFFFFF' },
  mb: { bg: '#16161A', fg: '#FFFFFF' },
  opp: { bg: '#6B6870', fg: '#FFFFFF' },
  libero: { bg: '#FFFFFF', fg: '#B3122E', border: '#B3122E' },
};
