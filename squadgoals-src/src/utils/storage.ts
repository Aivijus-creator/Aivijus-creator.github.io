import { Habit, CompletionRecord } from '../types';

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

/* ------------------------------------------------------------------ */
/* Account data                                                        */
/* Habits, history and EXP now live in the signed-in user's Supabase   */
/* row. Device preferences (sound, dark mode) stay in localStorage.    */
/* ------------------------------------------------------------------ */

export interface AccountData {
  habits: Habit[];
  history: CompletionRecord;
  /** Raw gamification object; validated with normalizeGamification(). */
  gamification: unknown;
  /** Server timestamp of the saved row, used to detect saves from another device. */
  updatedAt?: string | null;
}

export function sanitizeHabits(raw: unknown): Habit[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (h): h is Habit =>
      !!h && typeof h === 'object' && typeof (h as Habit).id === 'string' && typeof (h as Habit).name === 'string'
  );
}

export function sanitizeHistory(raw: unknown): CompletionRecord {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: CompletionRecord = {};
  for (const [date, ids] of Object.entries(raw as Record<string, unknown>)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Array.isArray(ids)) {
      out[date] = ids.filter((id): id is string => typeof id === 'string');
    }
  }
  return out;
}

/** Starting point for a brand-new account: starter habits, no history, 0 EXP. */
export function starterAccountData(): AccountData {
  const now = new Date().toISOString();
  return {
    habits: DEFAULT_HABITS.map((h) => ({ ...h, createdAt: now })),
    history: {},
    gamification: null,
  };
}

/**
 * Progress saved by the earlier, sign-in-free version of the app (if any).
 * It is moved into the first account that signs in on this browser.
 */
export function readGuestData(): AccountData | null {
  try {
    const habits = localStorage.getItem(HABITS_STORAGE_KEY);
    const history = localStorage.getItem(HISTORY_STORAGE_KEY);
    const gamification = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!habits && !history && !gamification) return null;
    const parsedHabits = sanitizeHabits(habits ? JSON.parse(habits) : null);
    return {
      habits: parsedHabits.length > 0 ? parsedHabits : starterAccountData().habits,
      history: sanitizeHistory(history ? JSON.parse(history) : null),
      gamification: gamification ? JSON.parse(gamification) : null,
    };
  } catch (e) {
    console.error('Failed to read guest data', e);
    return null;
  }
}

export function clearGuestData(): void {
  try {
    localStorage.removeItem(HABITS_STORAGE_KEY);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    localStorage.removeItem(GAMIFICATION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function buildBackupJSON(data: {
  habits: Habit[];
  history: CompletionRecord;
  gamification: unknown;
}): string {
  return JSON.stringify(
    {
      app: 'SquadGoals',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      habits: data.habits,
      history: data.history,
      settings: loadSettings(),
      gamification: data.gamification,
    },
    null,
    2
  );
}

/** Parses a backup file. Returns habits + history, or null if invalid. */
export function parseBackupJSON(
  jsonStr: string
): { habits: Habit[]; history: CompletionRecord } | null {
  try {
    const parsed = JSON.parse(jsonStr);
    const habits = sanitizeHabits(parsed?.habits);
    if (habits.length > 0 && parsed.history && typeof parsed.history === 'object') {
      return { habits, history: sanitizeHistory(parsed.history) };
    }
  } catch (e) {
    console.error('Error importing backup JSON', e);
  }
  return null;
}
