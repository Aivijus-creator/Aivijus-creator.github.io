/** Beach 2v2 logic: serving order and side switches. */
export type BeachPlayer = 'A' | 'B';

export interface BeachState {
  us: number;
  them: number;
  serving: 'us' | 'them';
  /** Who serves for our team next time we hold serve. */
  ourServer: BeachPlayer;
  set: 1 | 2 | 3;
}

export const initialBeach = (): BeachState => ({ us: 0, them: 0, serving: 'us', ourServer: 'A', set: 1 });

/** Rally won by us (or them). When we win the serve back, the OTHER partner serves. */
export function beachRally(s: BeachState, winner: 'us' | 'them'): BeachState {
  const next = { ...s };
  if (winner === 'us') {
    next.us++;
    if (s.serving === 'them') {
      next.serving = 'us';
      next.ourServer = s.ourServer === 'A' ? 'B' : 'A';
    }
  } else {
    next.them++;
    next.serving = 'them';
  }
  return next;
}

/** Sides switch every 7 combined points (sets 1–2) or every 5 (set 3). */
export function isSideSwitch(combined: number, set: 1 | 2 | 3): boolean {
  const every = set === 3 ? 5 : 7;
  return combined > 0 && combined % every === 0;
}
