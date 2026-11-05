import type { SystemDef, SystemId } from './types';
import { SYSTEM_51 } from './system51';
import { SYSTEM_62 } from './system62';
import { SYSTEM_42 } from './system42';

export const SYSTEMS: Record<SystemId, SystemDef> = { '5-1': SYSTEM_51, '6-2': SYSTEM_62, '4-2': SYSTEM_42 };
export const SYSTEM_IDS: SystemId[] = ['5-1', '6-2', '4-2'];
