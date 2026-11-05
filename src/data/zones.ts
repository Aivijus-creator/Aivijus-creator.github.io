import type { Spot, Zone } from './types';

export const ZONE_CENTER: Record<Zone, Spot> = {
  4: { x: 1.5, y: 1.5 },
  3: { x: 4.5, y: 1.5 },
  2: { x: 7.5, y: 1.5 },
  5: { x: 1.5, y: 6.5 },
  6: { x: 4.5, y: 6.5 },
  1: { x: 7.5, y: 6.5 },
};

export const SERVER_SPOT: Spot = { x: 7.5, y: 9.8 };
export const SETTER_TARGET: Spot = { x: 6.0, y: 0.8 };
export const SETTER_TARGET_TRADITIONAL: Spot = { x: 4.5, y: 0.8 };

/** Approach start spots (section 6.3). */
export const ATTACK_SPOT = {
  left: { x: 0.5, y: 3.5 },
  middle: { x: 4.5, y: 2.5 },
  right: { x: 8.5, y: 3.5 },
  pipe: { x: 4.5, y: 5.5 },
  backRight: { x: 7.5, y: 5.5 },
} as const;

/** Where the attacker contacts the ball (used by the ball-flight animation). */
export const HIT_SPOT = {
  left: { x: 1.2, y: 0.6 },
  middle: { x: 5.0, y: 0.6 },
  right: { x: 8.0, y: 0.6 },
  pipe: { x: 4.5, y: 3.2 },
  backRight: { x: 7.5, y: 3.2 },
  dump: { x: 6.0, y: 0.6 },
} as const;

export const COVER_SPOTS: Spot[] = [
  { x: 1.5, y: 6.0 },
  { x: 4.5, y: 7.0 },
  { x: 7.5, y: 6.0 },
];

export const DEFENSE_SPOT = {
  frontLeft: { x: 1.0, y: 0.7 },
  frontMiddle: { x: 4.5, y: 0.7 },
  frontRight: { x: 8.0, y: 0.7 },
  backLeft: { x: 1.0, y: 6.5 },
  backMiddle: { x: 4.5, y: 8.0 },
  backRight: { x: 8.0, y: 6.5 },
} as const;

export const FRONT_ZONES: Zone[] = [4, 3, 2];
export const BACK_ZONES: Zone[] = [5, 6, 1];
export const isFront = (z: Zone) => z === 2 || z === 3 || z === 4;
export const sideOfX = (x: number) => (x < 3 ? 'left' : x < 6 ? 'middle' : 'right');
