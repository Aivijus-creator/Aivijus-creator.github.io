export type HabitCategory = 'health' | 'fitness' | 'mind' | 'productivity' | 'lifestyle' | 'creativity';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: HabitCategory;
  icon: string;
  color: string; // Hex color code
  targetDaysPerWeek: number;
  createdAt: string;
}

export type CompletionRecord = Record<string, string[]>; // dateStr (YYYY-MM-DD) -> Array of completed habitIds

export interface DayProgress {
  date: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue, etc.
  dayNumber: number; // 1-31
  isToday: boolean;
  isFuture: boolean;
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRateThisWeek: number;
  daysActiveThisMonth: number;
}
