import { Habit, CompletionRecord } from '../types';
import { formatDateKey } from './date';

const HABITS_STORAGE_KEY = 'squadgoals_habits_v1';
const HISTORY_STORAGE_KEY = 'squadgoals_history_v1';
const SETTINGS_STORAGE_KEY = 'squadgoals_settings_v1';
const GAMIFICATION_STORAGE_KEY = 'squadgoals_gamification_v1';

export interface UserSettings {
  soundEnabled: boolean;
  confettiEnabled: boolean;
  darkMode: boolean;
  userName: string;
}

export interface GamificationState {
  totalExp: number;
  dailyBonusDates: string[];
}

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-water',
    name: 'Drink 2L Water',
    description: 'Keep a full water bottle by your desk',
    category: 'health',
    icon: '💧',
    color: '#0EA5E9',
    targetDaysPerWeek: 7,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'habit-workout',
    name: 'Workout or Stretch (20m)',
    description: 'Brisk walk, bodyweight gym, or yoga',
    category: 'fitness',
    icon: '🏃',
    color: '#FF5757',
    targetDaysPerWeek: 5,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'habit-read',
    name: 'Read 15 Pages',
    description: 'Non-fiction book or inspiring essay',
    category: 'mind',
    icon: '📖',
    color: '#FF7A00',
    targetDaysPerWeek: 7,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'habit-focus',
    name: 'Deep Work Sprint',
    description: '45 minutes uninterrupted focus without notifications',
    category: 'productivity',
    icon: '🎯',
    color: '#8B5CF6',
    targetDaysPerWeek: 5,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'habit-sleep',
    name: 'Unwind & Sleep by 11 PM',
    description: 'Screen-free bedtime routine with herbal tea',
    category: 'lifestyle',
    icon: '🌙',
    color: '#F59E0B',
    targetDaysPerWeek: 7,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

export function getInitialHistory(): CompletionRecord {
  const history: CompletionRecord = {};
  const today = new Date();

  // Seed completions for previous 3 days to provide a nice initial 3-day streak feeling!
  for (let i = 3; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = formatDateKey(d);
    // 3 or 4 habits completed on those days
    history[dateKey] = ['habit-water', 'habit-workout', 'habit-read'];
    if (i === 2) {
      history[dateKey].push('habit-focus');
    }
  }

  // Today starts with 1 habit already checked to encourage completion
  const todayKey = formatDateKey(today);
  history[todayKey] = ['habit-water'];

  return history;
}

export function loadHabits(): Habit[] {
  try {
    const stored = localStorage.getItem(HABITS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load habits from localStorage', e);
  }
  return DEFAULT_HABITS;
}

export function saveHabits(habits: Habit[]): void {
  try {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  } catch (e) {
    console.error('Failed to save habits to localStorage', e);
  }
}

export function loadHistory(): CompletionRecord {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load history from localStorage', e);
  }
  const initial = getInitialHistory();
  saveHistory(initial);
  return initial;
}

export function saveHistory(history: CompletionRecord): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save history to localStorage', e);
  }
}

export function loadSettings(): UserSettings {
  const defaultSettings: UserSettings = {
    soundEnabled: true,
    confettiEnabled: true,
    darkMode: false,
    userName: 'Friend',
  };
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadGamification(): GamificationState {
  const defaultGamification: GamificationState = {
    // Starts at Level 1 with 40 / 60 EXP so completing just 1 habit (+20 EXP) triggers the first Level-Up!
    totalExp: 40,
    dailyBonusDates: [],
  };
  try {
    const stored = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        totalExp: typeof parsed.totalExp === 'number' ? Math.max(0, parsed.totalExp) : 40,
        dailyBonusDates: Array.isArray(parsed.dailyBonusDates) ? parsed.dailyBonusDates : [],
      };
    }
  } catch (e) {
    console.error('Failed to load gamification state', e);
  }
  return defaultGamification;
}

export function saveGamification(state: GamificationState): void {
  try {
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save gamification state', e);
  }
}

export function exportBackupJSON(): string {
  const habits = loadHabits();
  const history = loadHistory();
  const settings = loadSettings();
  const gamification = loadGamification();
  const backup = {
    app: 'SquadGoals',
    version: '1.1',
    exportedAt: new Date().toISOString(),
    habits,
    history,
    settings,
    gamification,
  };
  return JSON.stringify(backup, null, 2);
}

export function importBackupJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.habits && Array.isArray(parsed.habits) && parsed.history) {
      saveHabits(parsed.habits);
      saveHistory(parsed.history);
      if (parsed.settings) {
        saveSettings(parsed.settings);
      }
      if (parsed.gamification) {
        saveGamification(parsed.gamification);
      }
      return true;
    }
  } catch (e) {
    console.error('Error importing backup JSON', e);
  }
  return false;
}

export function resetAllData(): void {
  localStorage.removeItem(HABITS_STORAGE_KEY);
  localStorage.removeItem(HISTORY_STORAGE_KEY);
  localStorage.removeItem(SETTINGS_STORAGE_KEY);
  localStorage.removeItem(GAMIFICATION_STORAGE_KEY);
}
