export const EXP_PER_HABIT = 20;
export const DAILY_ALL_DONE_BONUS_EXP = 100;

export interface LevelProgress {
  level: number;
  rankTitle: string;
  currentLevelExp: number;
  expForNextLevel: number;
  progressPercentage: number;
  totalExp: number;
}

const RANK_TITLES: string[] = [
  'Habit Sprout',       // Lvl 1
  'Routine Apprentice', // Lvl 2
  'Consistency Seeker', // Lvl 3
  'Momentum Builder',   // Lvl 4
  'Ritual Vanguard',    // Lvl 5
  'Discipline Knight',  // Lvl 6
  'Flow Architect',     // Lvl 7
  'Zenith Champion',    // Lvl 8
  'Habit Grandmaster',  // Lvl 9
  'SquadGoals Legend',  // Lvl 10+
];

/**
 * Exponential EXP scaling:
 * Starts very easy at Level 1 (60 EXP = 3 habits) and scales progressively harder
 * by 1.45x per level.
 */
export function getExpRequiredForLevel(level: number): number {
  const safeLevel = Math.max(1, level);
  return Math.round((60 * Math.pow(1.45, safeLevel - 1)) / 10) * 10;
}

export function getRankTitle(level: number): string {
  const idx = Math.min(RANK_TITLES.length - 1, Math.max(0, level - 1));
  return RANK_TITLES[idx];
}

export function getLevelProgress(totalExp: number): LevelProgress {
  const safeTotal = Math.max(0, Math.floor(totalExp));
  let level = 1;
  let remainingExp = safeTotal;
  let required = getExpRequiredForLevel(level);

  while (remainingExp >= required) {
    remainingExp -= required;
    level++;
    required = getExpRequiredForLevel(level);
  }

  const progressPercentage =
    required > 0 ? Math.min(100, Math.round((remainingExp / required) * 100)) : 0;

  return {
    level,
    rankTitle: getRankTitle(level),
    currentLevelExp: remainingExp,
    expForNextLevel: required,
    progressPercentage,
    totalExp: safeTotal,
  };
}

/* ------------------------------------------------------------------ */
/* Daily EXP claims                                                    */
/* ------------------------------------------------------------------ */

export interface GamificationState {
  /** Lifetime EXP. Only ever goes up from habit check-ins. */
  totalExp: number;
  /** Calendar days (YYYY-MM-DD) on which the full-day sweep bonus was paid. */
  dailyBonusDates: string[];
  /** The calendar day that `claimedHabitIds` and `todayExp` belong to. */
  claimDate: string;
  /** Habits that already paid out their EXP on `claimDate`. */
  claimedHabitIds: string[];
  /** EXP collected on `claimDate` (habits + bonus). */
  todayExp: number;
}

export interface HabitCheckResult {
  state: GamificationState;
  habitExp: number;
  bonusExp: number;
  expGained: number;
  /** True when this habit had already paid out today, so nothing was added. */
  alreadyClaimed: boolean;
}

export function createGamificationState(todayStr: string): GamificationState {
  return {
    totalExp: 0,
    dailyBonusDates: [],
    claimDate: todayStr,
    claimedHabitIds: [],
    todayExp: 0,
  };
}

/** Starts a fresh claim list when the calendar day has changed. */
export function rollToDate(state: GamificationState, todayStr: string): GamificationState {
  if (state.claimDate === todayStr) return state;
  return { ...state, claimDate: todayStr, claimedHabitIds: [], todayExp: 0 };
}

/** EXP collected today; 0 if the stored claims are from an earlier day. */
export function getTodayExp(state: GamificationState, todayStr: string): number {
  return state.claimDate === todayStr ? state.todayExp : 0;
}

export function hasClaimedToday(
  state: GamificationState,
  habitId: string,
  todayStr: string
): boolean {
  return state.claimDate === todayStr && state.claimedHabitIds.includes(habitId);
}

/**
 * Called when a habit is CHECKED today.
 * - A habit pays EXP_PER_HABIT only the first time it is checked on a given day.
 * - The full-day bonus pays once per day, the first time every habit is checked.
 * Unchecking is not handled here on purpose: it never changes EXP.
 */
export function claimHabitCheck(
  current: GamificationState,
  habitId: string,
  todayStr: string,
  allHabitsDone: boolean
): HabitCheckResult {
  const state = rollToDate(current, todayStr);
  const alreadyClaimed = state.claimedHabitIds.includes(habitId);
  const habitExp = alreadyClaimed ? 0 : EXP_PER_HABIT;
  const bonusExp =
    allHabitsDone && !state.dailyBonusDates.includes(todayStr) ? DAILY_ALL_DONE_BONUS_EXP : 0;
  const expGained = habitExp + bonusExp;

  if (expGained === 0) {
    return { state, habitExp, bonusExp, expGained, alreadyClaimed };
  }

  return {
    state: {
      ...state,
      totalExp: state.totalExp + expGained,
      todayExp: state.todayExp + expGained,
      claimedHabitIds: alreadyClaimed ? state.claimedHabitIds : [...state.claimedHabitIds, habitId],
      dailyBonusDates: bonusExp > 0 ? [...state.dailyBonusDates, todayStr] : state.dailyBonusDates,
    },
    habitExp,
    bonusExp,
    expGained,
    alreadyClaimed,
  };
}

/**
 * Validates stored/remote gamification data. Data saved by the earlier version
 * has no claim list: in that case today's already-checked habits count as
 * claimed, because the old version already paid EXP for them.
 */
export function normalizeGamification(
  raw: unknown,
  history: Record<string, string[]>,
  todayStr: string
): GamificationState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
  const strArray = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

  const totalExp = num(r.totalExp);
  const dailyBonusDates = strArray(r.dailyBonusDates);

  if (typeof r.claimDate === 'string') {
    return {
      totalExp,
      dailyBonusDates,
      claimDate: r.claimDate,
      claimedHabitIds: strArray(r.claimedHabitIds),
      todayExp: Math.min(num(r.todayExp), totalExp),
    };
  }

  const claimedHabitIds = [...new Set(history[todayStr] ?? [])];
  const legacyTodayExp =
    claimedHabitIds.length * EXP_PER_HABIT +
    (dailyBonusDates.includes(todayStr) ? DAILY_ALL_DONE_BONUS_EXP : 0);
  return {
    totalExp,
    dailyBonusDates,
    claimDate: todayStr,
    claimedHabitIds,
    todayExp: Math.min(legacyTodayExp, totalExp),
  };
}
