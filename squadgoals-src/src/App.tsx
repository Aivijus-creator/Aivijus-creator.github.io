import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Plus,
  BarChart3,
  CheckSquare,
  Lock,
  X,
  CloudOff,
} from 'lucide-react';
import { Habit, CompletionRecord } from './types';
import {
  loadSettings,
  saveSettings,
  UserSettings,
  AccountData,
  starterAccountData,
  buildBackupJSON,
  parseBackupJSON,
} from './utils/storage';
import {
  formatDateKey,
  formatFriendlyDate,
  calculateStreakStats,
  getTimeUntilMidnight,
} from './utils/date';
import {
  playCheckSound,
  playUncheckSound,
  playCelebrationSound,
  playLevelUpSound,
} from './utils/audio';
import {
  EXP_PER_HABIT,
  DAILY_ALL_DONE_BONUS_EXP,
  getLevelProgress,
  GamificationState,
  claimHabitCheck,
  getTodayExp,
  normalizeGamification,
  rollToDate,
} from './utils/gamification';
import { Account, fetchProgressIfNewer, saveProfile, saveProgress } from './lib/cloud';

import { Header } from './components/Header';
import { QuoteBanner } from './components/QuoteBanner';
import { DateStrip } from './components/DateStrip';
import { ProgressCard } from './components/ProgressCard';
import { StreakWidget } from './components/StreakWidget';
import { HabitChecklist } from './components/HabitChecklist';
import { HabitModal } from './components/HabitModal';
import { DataBackupModal } from './components/DataBackupModal';
import { InsightsView } from './components/InsightsView';
import { LevelUpModal } from './components/LevelUpModal';
import { Leaderboard } from './components/Leaderboard';

const LAST_ACTIVE_DATE_KEY_PREFIX = 'squadgoals_last_active_date_v1';
const SAVE_DEBOUNCE_MS = 600;
const SAVE_RETRY_MS = 10000;

interface AppProps {
  supabase: SupabaseClient;
  account: Account;
  initialData: AccountData;
  onSignedOut: () => Promise<void> | void;
}

export default function App({ supabase, account, initialData, onSignedOut }: AppProps) {
  const LAST_ACTIVE_DATE_KEY = `${LAST_ACTIVE_DATE_KEY_PREFIX}:${account.userId}`;

  // Core State (loaded from the signed-in user's Supabase row)
  const [habits, setHabits] = useState<Habit[]>(() => initialData.habits);
  const [history, setHistory] = useState<CompletionRecord>(() => initialData.history);
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [gamification, setGamification] = useState<GamificationState>(() =>
    normalizeGamification(initialData.gamification, initialData.history, formatDateKey(new Date()))
  );
  const [todayStr, setTodayStr] = useState<string>(() => formatDateKey(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  const [activeView, setActiveView] = useState<'tracker' | 'insights'>('tracker');
  const [midnightCountdown, setMidnightCountdown] = useState<string>(
    () => getTimeUntilMidnight().formattedCountdown
  );
  const [midnightResetNotice, setMidnightResetNotice] = useState<string | null>(null);

  // Gamification UI notifications
  const [recentExpGain, setRecentExpGain] = useState<{
    id: number;
    amount: number;
    label?: string;
  } | null>(null);
  const [levelUpData, setLevelUpData] = useState<{
    previousLevel: number;
    newLevel: number;
    totalExp: number;
  } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const [syncState, setSyncState] = useState<'saving' | 'saved' | 'error'>('saved');
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Device preferences stay in this browser
  useEffect(() => {
    saveSettings(settings);
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings]);

  /* ---------------- Cloud sync (Supabase) ----------------
   * Progress (habits, history, EXP state) is saved to the private user_progress row.
   * The public leaderboard row (profiles) is updated only when the EXP numbers change.
   * Saves are debounced and run one at a time, always sending the latest state. */
  const latestRef = useRef({ habits, history, gamification, todayStr: formatDateKey(new Date()) });
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const saveTimerRef = useRef<number | null>(null);
  const lastProfileJsonRef = useRef('');
  const knownUpdatedAtRef = useRef<string | null>(initialData.updatedAt ?? null);
  const inFlightRef = useRef(0);
  const adoptedRef = useRef<{ habits: Habit[]; history: CompletionRecord; gamification: GamificationState } | null>(
    null
  );
  const pullingRef = useRef(false);

  const runSync = useCallback((): Promise<boolean> => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setSyncState('saving');
    inFlightRef.current += 1;
    const run = saveChainRef.current.then(async () => {
      const snap = latestRef.current;
      try {
        knownUpdatedAtRef.current = await saveProgress(supabase, account.userId, snap);
        const stats = {
          totalExp: snap.gamification.totalExp,
          todayExp: getTodayExp(snap.gamification, snap.todayStr),
          expDate: snap.todayStr,
        };
        const json = JSON.stringify(stats);
        if (json !== lastProfileJsonRef.current) {
          await saveProfile(supabase, account, stats);
          lastProfileJsonRef.current = json;
        }
        setSyncState('saved');
        return true;
      } catch (e) {
        console.error('Cloud save failed', e);
        setSyncState('error');
        return false;
      } finally {
        inFlightRef.current -= 1;
      }
    });
    saveChainRef.current = run.then(() => undefined);
    return run;
  }, [supabase, account]);

  latestRef.current = { habits, history, gamification, todayStr };

  // Debounced save whenever progress changes (and once on load, so the
  // leaderboard row is current for today).
  useEffect(() => {
    const adopted = adoptedRef.current;
    if (
      adopted &&
      adopted.habits === habits &&
      adopted.history === history &&
      adopted.gamification === gamification
    ) {
      // State was just replaced by a newer save from another device: nothing to write back.
      return;
    }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void runSync();
    }, SAVE_DEBOUNCE_MS);
  }, [habits, history, gamification, todayStr, runSync]);

  // When this tab comes back into view, pick up progress saved on another
  // device in the meantime (so a stale tab never overwrites newer EXP).
  useEffect(() => {
    const pullIfNewer = async () => {
      if (document.visibilityState !== 'visible') return;
      if (pullingRef.current || saveTimerRef.current || inFlightRef.current > 0) return;
      pullingRef.current = true;
      try {
        const remote = await fetchProgressIfNewer(supabase, account.userId, knownUpdatedAtRef.current);
        if (!remote || saveTimerRef.current || inFlightRef.current > 0) return;
        const today = formatDateKey(new Date());
        const adopted = {
          habits: remote.habits,
          history: remote.history,
          gamification: normalizeGamification(remote.gamification, remote.history, today),
        };
        knownUpdatedAtRef.current = remote.updatedAt ?? null;
        adoptedRef.current = adopted;
        setHabits(adopted.habits);
        setHistory(adopted.history);
        setGamification(adopted.gamification);
      } catch (e) {
        console.warn('Could not check for newer progress', e);
      } finally {
        pullingRef.current = false;
      }
    };
    document.addEventListener('visibilitychange', pullIfNewer);
    window.addEventListener('focus', pullIfNewer);
    return () => {
      document.removeEventListener('visibilitychange', pullIfNewer);
      window.removeEventListener('focus', pullIfNewer);
    };
  }, [supabase, account.userId]);

  // Retry failed saves, and flush pending ones when the tab is hidden.
  useEffect(() => {
    if (syncState !== 'error') return;
    const retry = window.setTimeout(() => void runSync(), SAVE_RETRY_MS);
    const onOnline = () => void runSync();
    window.addEventListener('online', onOnline);
    return () => {
      window.clearTimeout(retry);
      window.removeEventListener('online', onOnline);
    };
  }, [syncState, runSync]);

  useEffect(() => {
    const flushIfPending = () => {
      if (document.visibilityState === 'hidden' && saveTimerRef.current) void runSync();
    };
    const warnIfUnsaved = (e: BeforeUnloadEvent) => {
      if (saveTimerRef.current) {
        void runSync();
        e.preventDefault();
      }
    };
    document.addEventListener('visibilitychange', flushIfPending);
    window.addEventListener('beforeunload', warnIfUnsaved);
    return () => {
      document.removeEventListener('visibilitychange', flushIfPending);
      window.removeEventListener('beforeunload', warnIfUnsaved);
    };
  }, [runSync]);

  // Clear floating +EXP toast after 2.2 seconds
  useEffect(() => {
    if (!recentExpGain) return;
    const timer = window.setTimeout(() => {
      setRecentExpGain(null);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [recentExpGain]);

  // Automated Daily Reset at Midnight (00:00)
  useEffect(() => {
    const storedLastDate = localStorage.getItem(LAST_ACTIVE_DATE_KEY);
    const currentRealToday = formatDateKey(new Date());

    if (storedLastDate && storedLastDate !== currentRealToday) {
      // Finalize previous day in history & start fresh for the new day
      setHistory((prev) => ({
        ...prev,
        [storedLastDate]: prev[storedLastDate] || [],
        [currentRealToday]: prev[currentRealToday] || [],
      }));
      setTodayStr(currentRealToday);
      setSelectedDate(currentRealToday);
      setMidnightResetNotice(
        `Daily 00:00 reset completed — ${storedLastDate} is now finalized and permanently locked in history.`
      );
    }
    localStorage.setItem(LAST_ACTIVE_DATE_KEY, currentRealToday);

    const checkMidnightRollover = () => {
      const now = new Date();
      const latestToday = formatDateKey(now);
      setMidnightCountdown(getTimeUntilMidnight(now).formattedCountdown);

      setTodayStr((prevToday) => {
        if (latestToday !== prevToday) {
          // Midnight (00:00) reached! Finalize previous day and advance to new day
          setHistory((prevHistory) => ({
            ...prevHistory,
            [prevToday]: prevHistory[prevToday] || [],
            [latestToday]: prevHistory[latestToday] || [],
          }));
          setSelectedDate((prevSelected) =>
            prevSelected === prevToday ? latestToday : prevSelected
          );
          localStorage.setItem(LAST_ACTIVE_DATE_KEY, latestToday);
          setMidnightResetNotice(
            `00:00 Midnight Reset: ${prevToday}'s completions are now finalized and locked into history.`
          );
          return latestToday;
        }
        return prevToday;
      });
    };

    // Update countdown and verify midnight rollover every second
    const intervalId = window.setInterval(checkMidnightRollover, 1000);

    // Schedule exact timeout for 00:00:00
    const { msRemaining } = getTimeUntilMidnight();
    const midnightTimeoutId = window.setTimeout(
      checkMidnightRollover,
      msRemaining + 150
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkMidnightRollover();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(midnightTimeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Derived calculations
  const isSelectedDateToday = selectedDate === todayStr;
  const completedHabitIdsForSelectedDate = useMemo(
    () => history[selectedDate] || [],
    [history, selectedDate]
  );

  const streakStats = useMemo(
    () => calculateStreakStats(habits, history),
    [habits, history]
  );

  const levelProgress = useMemo(
    () => getLevelProgress(gamification.totalExp),
    [gamification.totalExp]
  );

  // Rule 1 & 2 + Gamification EXP Progression
  // - Each habit pays EXP once per calendar day, on its first check.
  // - Unchecking (misclick protection) never removes EXP or levels.
  // - Re-checking a habit that already paid today adds nothing.
  const handleToggleHabit = useCallback(
    (habitId: string) => {
      // Rule 2: Permanent Past-Day Locking — never allow altering past dates
      if (selectedDate !== todayStr) {
        return;
      }

      const currentList = history[selectedDate] || [];
      const isAlreadyCompleted = currentList.includes(habitId);
      const updatedList = isAlreadyCompleted
        ? currentList.filter((id) => id !== habitId)
        : [...currentList, habitId];

      setHistory((prev) => ({
        ...prev,
        [selectedDate]: updatedList,
      }));

      if (isAlreadyCompleted) {
        // Unchecked: EXP and level stay exactly as they are.
        if (settings.soundEnabled) playUncheckSound();
        return;
      }

      const allHabitsNowDone =
        habits.length > 0 && habits.every((h) => updatedList.includes(h.id));
      const result = claimHabitCheck(gamification, habitId, todayStr, allHabitsNowDone);

      if (result.state !== gamification) {
        setGamification(result.state);
      }

      setRecentExpGain({
        id: Date.now(),
        amount: result.expGained,
        label:
          result.bonusExp > 0
            ? 'Daily Sweep Bonus!'
            : result.alreadyClaimed
            ? 'Already claimed today'
            : undefined,
      });

      const prevLevel = getLevelProgress(gamification.totalExp).level;
      const newLevel = getLevelProgress(result.state.totalExp).level;
      if (newLevel > prevLevel) {
        setLevelUpData({
          previousLevel: prevLevel,
          newLevel,
          totalExp: result.state.totalExp,
        });
        if (settings.soundEnabled) playLevelUpSound();
      } else if (settings.soundEnabled) {
        playCheckSound();
      }
    },
    [selectedDate, todayStr, history, habits, gamification, settings.soundEnabled]
  );

  // Add or Edit Habit
  const handleSaveHabit = (
    habitData: Omit<Habit, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setHabits((prev) =>
        prev.map((h) => (h.id === existingId ? { ...h, ...habitData } : h))
      );
    } else {
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        ...habitData,
        createdAt: new Date().toISOString(),
      };
      setHabits((prev) => [...prev, newHabit]);
    }
  };

  // Delete Habit (only remove from today's active checklist; keep past locked records untouched)
  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setHistory((prev) => {
      if (!prev[todayStr]) return prev;
      return {
        ...prev,
        [todayStr]: prev[todayStr].filter((id) => id !== habitId),
      };
    });
  };

  // Sound toggle
  const handleToggleSound = () => {
    setSettings((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  // Dark Mode toggle
  const handleToggleDarkMode = () => {
    setSettings((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  };

  // Backup: export current account data
  const handleExportBackup = () => buildBackupJSON({ habits, history, gamification });

  // Backup: restore habits & history. EXP stays tied to the account, so an
  // imported file cannot inflate the leaderboard.
  const handleImportBackup = (json: string): boolean => {
    const parsed = parseBackupJSON(json);
    if (!parsed) return false;
    setHabits(parsed.habits);
    setHistory(parsed.history);
    return true;
  };

  // Reset to starter habits with 0 EXP. Today's claims are kept, so starter
  // habits re-checked today do not pay out a second time.
  const handleResetData = () => {
    const starter = starterAccountData();
    setHabits(starter.habits);
    setHistory({});
    setGamification((prev) => ({ ...rollToDate(prev, todayStr), totalExp: 0, todayExp: 0 }));
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const saved = await runSync();
    if (!saved && !window.confirm('Some changes have not been saved to the cloud yet. Log out anyway?')) {
      setIsSigningOut(false);
      return;
    }
    await onSignedOut();
  };

  const todayExp = getTodayExp(gamification, todayStr);
  const claimedHabitIdsToday = gamification.claimDate === todayStr ? gamification.claimedHabitIds : [];
  const bonusClaimedToday = gamification.dailyBonusDates.includes(todayStr);

  return (
    <div
      id="top"
      className="min-h-screen bg-[#FDFBF7] dark:bg-[#11100F] text-[#2C2C2C] dark:text-[#F5F2EB] flex flex-col font-sans pb-20 lg:pb-12 transition-colors duration-300"
    >
      {/* Top Bar with Level & EXP Header Bar and Dark Mode Toggle */}
      <Header
        onOpenAddModal={() => {
          setEditingHabit(null);
          setIsAddModalOpen(true);
        }}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        darkMode={settings.darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        activeView={activeView}
        onChangeView={setActiveView}
        levelProgress={levelProgress}
        recentExpGain={recentExpGain}
        account={account}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Automated Midnight Reset Notification Banner (if a 00:00 rollover occurred) */}
        {/* Cloud save problem banner */}
        <AnimatePresence>
          {syncState === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              role="status"
              className="rounded-2xl bg-[#FFEBEB] dark:bg-[#2D1618] border border-[#FFCCD0] dark:border-[#FF5757]/30 px-4 py-3 flex items-center justify-between gap-3 text-xs text-[#D93D3D] dark:text-[#FF8A8A] shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <CloudOff className="w-4 h-4 shrink-0" />
                <span className="font-medium">
                  Couldn’t save to the cloud. Your progress is safe on this page and will retry automatically.
                </span>
              </div>
              <button
                onClick={() => void runSync()}
                className="font-bold underline shrink-0 cursor-pointer"
              >
                Retry now
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {midnightResetNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="rounded-2xl bg-white/90 dark:bg-[#1A1816]/90 backdrop-blur-md border border-[#FADCC0] dark:border-[#FF7A00]/30 px-4 py-3 flex items-center justify-between gap-3 text-xs text-[#2C2C2C] dark:text-[#F5F2EB] shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-[#FF7A00] shrink-0" />
                <span className="font-medium">{midnightResetNotice}</span>
              </div>
              <button
                onClick={() => setMidnightResetNotice(null)}
                className="text-[#9B9386] dark:text-[#A39B8F] hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB] transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Core Feature 6: Motivational Encouragement Banner */}
        <QuoteBanner />

        {/* Seamless View Switching Transition */}
        <AnimatePresence mode="wait">
          {activeView === 'tracker' ? (
            <motion.div
              key="view-tracker"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {/* 7-Day Horizontal Date Scroller */}
              <DateStrip
                selectedDate={selectedDate}
                todayStr={todayStr}
                midnightCountdown={midnightCountdown}
                onSelectDate={setSelectedDate}
                history={history}
                habits={habits}
              />

              {/* Desktop 2-Column Responsive Dashboard Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Progress Card & Habit Checklist (7 cols on lg) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Core Feature 2: Visual Progress Bar & Real-Time Percentage */}
                  <ProgressCard
                    completedCount={completedHabitIdsForSelectedDate.length}
                    totalCount={habits.length}
                    selectedDateFormatted={formatFriendlyDate(selectedDate)}
                    isToday={isSelectedDateToday}
                    bonusClaimedToday={bonusClaimedToday}
                    onCelebrationSound={
                      settings.soundEnabled ? playCelebrationSound : undefined
                    }
                  />

                  {/* Core Feature 1: Interactive Habit Checklist */}
                  <HabitChecklist
                    habits={habits}
                    completedHabitIds={completedHabitIdsForSelectedDate}
                    onToggleHabit={handleToggleHabit}
                    onEditHabit={(h) => {
                      setEditingHabit(h);
                      setIsAddModalOpen(true);
                    }}
                    onDeleteHabit={handleDeleteHabit}
                    onOpenAddModal={() => {
                      setEditingHabit(null);
                      setIsAddModalOpen(true);
                    }}
                    selectedDateFormatted={formatFriendlyDate(selectedDate)}
                    todayStr={todayStr}
                    isToday={isSelectedDateToday}
                    historyMap={history}
                    claimedHabitIds={claimedHabitIdsToday}
                  />
                </div>

                {/* Right Column: Streak Widget & Quick Actions (5 cols on lg) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Shared Team Leaderboard (live via Supabase Realtime) */}
                  <Leaderboard
                    supabase={supabase}
                    account={account}
                    todayStr={todayStr}
                    myTotalExp={gamification.totalExp}
                    myTodayExp={todayExp}
                  />

                  {/* Core Feature 3: Streak Counter Widget */}
                  <StreakWidget
                    stats={streakStats}
                    history={history}
                    habits={habits}
                    todayStr={todayStr}
                    onOpenDetails={() => setActiveView('insights')}
                  />

                  {/* Cozy Habit Tips & Advice Card */}
                  <div className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#1A1816]/90 backdrop-blur-md border border-[#EDE6D8] dark:border-[#2C2825] p-5 sm:p-6 shadow-md shadow-[#2C2C2C]/[0.04] dark:shadow-black/30 space-y-3.5 transition-colors duration-300">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#FFF5EB] dark:bg-[#261B12] border border-[#FADCC0] dark:border-[#FF7A00]/30 text-[#FF7A00] flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB]">
                          Cozy Habit & EXP Formula
                        </h4>
                        <p className="text-[11px] text-[#736C61] dark:text-[#A39B8F]">
                          +{EXP_PER_HABIT} EXP per habit, once a day · +{DAILY_ALL_DONE_BONUS_EXP} EXP daily sweep
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-[#736C61] dark:text-[#A39B8F] leading-relaxed">
                      Attach a new habit to an anchor you already do every day.
                      For example:{' '}
                      <span className="font-semibold text-[#2C2C2C] dark:text-[#F5F2EB]">
                        "After I pour my morning coffee, I will drink 1 full glass of water."
                      </span>
                    </p>

                    <p className="text-xs text-[#736C61] dark:text-[#A39B8F] leading-relaxed">
                      Clicked by mistake? Unchecking never costs EXP, and
                      re-checking the same habit won’t pay twice in one day.
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#F2ECE1] dark:border-[#262320] text-xs">
                      <span className="text-[#736C61] dark:text-[#A39B8F]">
                        Need another habit?
                      </span>
                      <button
                        onClick={() => {
                          setEditingHabit(null);
                          setIsAddModalOpen(true);
                        }}
                        className="font-bold text-[#FF7A00] hover:text-[#FF5757] transition-colors cursor-pointer"
                      >
                        + Add Habit Form
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Streaks & Insights View */
            <motion.div
              key="view-insights"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <InsightsView
                habits={habits}
                history={history}
                stats={streakStats}
                todayStr={todayStr}
                levelProgress={levelProgress}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Sticky Ergonomic Bottom Action Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1A1816]/95 backdrop-blur-md border-t border-[#EDE6D8] dark:border-[#2C2825] px-4 py-2 flex items-center justify-around shadow-lg transition-colors duration-300">
        <button
          onClick={() => setActiveView('tracker')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-h-[44px] transition-colors ${
            activeView === 'tracker'
              ? 'text-[#FF7A00] font-bold'
              : 'text-[#736C61] dark:text-[#A39B8F]'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Checklist</span>
        </button>

        {/* Center Primary Action CTA */}
        <button
          onClick={() => {
            setEditingHabit(null);
            setIsAddModalOpen(true);
          }}
          className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF5757] text-white flex items-center justify-center shadow-md shadow-[#FF7A00]/30 active:scale-95 transition-transform"
          aria-label="Add new habit"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveView('insights')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-h-[44px] transition-colors ${
            activeView === 'insights'
              ? 'text-[#FF7A00] font-bold'
              : 'text-[#736C61] dark:text-[#A39B8F]'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Analytics</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#EDE6D8] dark:border-[#2C2825] bg-[#FAF7F0] dark:bg-[#161412] py-6 px-4 text-center text-xs text-[#736C61] dark:text-[#A39B8F] transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-['Outfit'] font-bold text-[#2C2C2C] dark:text-[#F5F2EB]">
              SquadGoals
            </span>
            <span>·</span>
            <span>
              Lvl {levelProgress.level} ({levelProgress.rankTitle})
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB] transition-colors cursor-pointer"
            >
              Backup & Reset
            </button>
            <span>·</span>
            <span className="truncate max-w-[16rem]" title={account.email}>
              {syncState === 'saving'
                ? 'Saving…'
                : syncState === 'error'
                ? 'Not saved yet'
                : `Synced to ${account.displayName}’s account`}
            </span>
          </div>
        </div>
      </footer>

      {/* Core Feature 4: Habit Manager Modal (Add / Edit) */}
      <HabitModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        initialHabit={editingHabit}
      />

      {/* Core Feature 5: Local Storage & Backup Management Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        habitsCount={habits.length}
        historyDaysCount={Object.keys(history).length}
        onExport={handleExportBackup}
        onImport={handleImportBackup}
        onReset={handleResetData}
      />

      {/* Celebratory Level-Up Notification Popup */}
      <LevelUpModal
        levelUpData={levelUpData}
        onClose={() => setLevelUpData(null)}
      />
    </div>
  );
}
