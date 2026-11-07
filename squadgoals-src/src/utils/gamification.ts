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
