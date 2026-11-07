import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { CompletionRecord, Habit } from '../types';
import {
  AccountData,
  clearGuestData,
  readGuestData,
  sanitizeHabits,
  sanitizeHistory,
  starterAccountData,
} from '../utils/storage';
import type { GamificationState } from '../utils/gamification';

/*
 * Tables (see supabase/schema.sql):
 *   profiles       — public leaderboard row per user. Everyone signed in can read; only the owner can write.
 *   user_progress  — private habits/history/EXP state. Only the owner can read or write.
 */

export interface Account {
  userId: string;
  email: string;
  displayName: string;
}

export interface LeaderboardRow {
  id: string;
  display_name: string;
  total_exp: number;
  today_exp: number;
  exp_date: string | null;
  updated_at: string | null;
}

export function displayNameFor(user: User, profileName?: string | null): string {
  const fromProfile = profileName?.trim();
  if (fromProfile) return fromProfile;
  const fromMeta = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.trim() : '';
  if (fromMeta) return fromMeta.slice(0, 40);
  return (user.email ?? 'Friend').split('@')[0].slice(0, 40) || 'Friend';
}

/**
 * Loads the signed-in user's profile name and saved progress.
 * First sign-in: moves any progress from the earlier local-only version into the
 * account, otherwise starts from the starter habits with 0 EXP.
 */
export async function loadAccount(
  supabase: SupabaseClient,
  user: User
): Promise<{ account: Account; data: AccountData }> {
  const [profileRes, progressRes] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('user_progress')
      .select('habits, history, gamification, updated_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (progressRes.error) throw progressRes.error;

  const account: Account = {
    userId: user.id,
    email: user.email ?? '',
    displayName: displayNameFor(user, profileRes.data?.display_name),
  };

  if (progressRes.data) {
    return { account, data: toAccountData(progressRes.data) };
  }

  const guest = readGuestData();
  const data = guest ?? starterAccountData();
  const { data: saved, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      habits: data.habits,
      history: data.history,
      gamification: data.gamification ?? {},
    })
    .select('updated_at')
    .single();
  if (error) throw error;
  if (guest) clearGuestData();
  return { account, data: { ...data, updatedAt: saved?.updated_at ?? null } };
}

interface ProgressRow {
  habits: unknown;
  history: unknown;
  gamification: unknown;
  updated_at: string | null;
}

function toAccountData(row: ProgressRow): AccountData {
  const habits = sanitizeHabits(row.habits);
  return {
    habits: habits.length > 0 ? habits : starterAccountData().habits,
    history: sanitizeHistory(row.history),
    gamification: row.gamification,
    updatedAt: row.updated_at,
  };
}

/** Saves progress and returns the server's updated_at timestamp. */
export async function saveProgress(
  supabase: SupabaseClient,
  userId: string,
  data: { habits: Habit[]; history: CompletionRecord; gamification: GamificationState }
): Promise<string | null> {
  const { data: saved, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      habits: data.habits,
      history: data.history,
      gamification: data.gamification,
    })
    .select('updated_at')
    .single();
  if (error) throw error;
  return saved?.updated_at ?? null;
}

/** Returns the saved progress if another device saved after `knownUpdatedAt`. */
export async function fetchProgressIfNewer(
  supabase: SupabaseClient,
  userId: string,
  knownUpdatedAt: string | null
): Promise<AccountData | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('habits, history, gamification, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.updated_at) return null;
  if (knownUpdatedAt && Date.parse(data.updated_at) <= Date.parse(knownUpdatedAt)) return null;
  return toAccountData(data as ProgressRow);
}

export async function saveProfile(
  supabase: SupabaseClient,
  account: Account,
  stats: { totalExp: number; todayExp: number; expDate: string }
): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id: account.userId,
    display_name: account.displayName,
    total_exp: stats.totalExp,
    today_exp: stats.todayExp,
    exp_date: stats.expDate,
  });
  if (error) throw error;
}

export async function fetchLeaderboard(supabase: SupabaseClient): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, total_exp, today_exp, exp_date, updated_at')
    .order('total_exp', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}

export type LiveStatus = 'connecting' | 'live' | 'offline';

/** Calls onChange whenever any profile row is inserted, updated or deleted. */
export function subscribeToLeaderboard(
  supabase: SupabaseClient,
  onChange: () => void,
  onStatus: (status: LiveStatus) => void
): () => void {
  const channel = supabase
    .channel('squad-leaderboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => onChange())
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onStatus('live');
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') onStatus('offline');
    });
  return () => {
    supabase.removeChannel(channel);
  };
}
