export type Zone = 1 | 2 | 3 | 4 | 5 | 6;
export type PlayerId = 'S' | 'S1' | 'S2' | 'OH1' | 'OH2' | 'MB1' | 'MB2' | 'OPP' | 'L';
export type RoleKind = 'setter' | 'oh' | 'mb' | 'opp' | 'libero';
export type SystemId = '5-1' | '6-2' | '4-2';
export type Phase = 'receive' | 'attack' | 'serve' | 'defense';
export type Side = 'left' | 'middle' | 'right';
export type SetterMode = 'international' | 'traditional';

/** Primary job of a player in one formation (drives icons, poses and "Why here?" texts). */
export type Tag =
  | 'passer'
  | 'hidden'
  | 'netWaiting'
  | 'frontSetter'
  | 'penetratingSetter'
  | 'setting'
  | 'server'
  | 'blocker'
  | 'backDefender'
  | 'attacker'
  | 'cover';

export type AttackKind = 'left' | 'middle' | 'right' | 'pipe' | 'backRight' | 'dump';

export type Pose = 'ready' | 'pass' | 'set' | 'attack' | 'block' | 'serve' | 'run' | 'wait';

export interface Spot {
  x: number;
  y: number;
}

export interface Placed extends Spot {
  id: PlayerId;
  zone: Zone;
  tag: Tag;
  /** Overlap partner a hidden player stands behind/beside. */
  partner?: PlayerId;
  /** Libero: the middle blocker it replaces. */
  replaces?: PlayerId;
  attackKind?: AttackKind;
  /** Middle serving instead of the libero (FIVB). */
  middleServes?: boolean;
}

export type Formation = Placed[];

export interface SystemDef {
  id: SystemId;
  lineup: PlayerId[]; // zone 1 → 6 at rotation step 0
  hasLibero: boolean;
  /** Rotation step k (0..5) → formation in a phase. */
  formation: (k: number, phase: Phase, mode?: SetterMode) => Formation;
  /** The setter who sets in rotation step k. */
  settingSetter: (k: number) => PlayerId;
}
