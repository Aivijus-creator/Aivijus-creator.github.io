import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Plus,
  BarChart3,
  CheckSquare,
  Lock,
  X,
} from 'lucide-react';
import { Habit, CompletionRecord } from './types';
import {
  loadHabits,
  saveHabits,
  loadHistory,
  saveHistory,
  loadSettings,
  saveSettings,
  loadGamification,
  saveGamification,
  UserSettings,
  GamificationState,
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
} from './utils/gamification';

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

const LAST_ACTIVE_DATE_KEY = 'squadgoals_last_active_date_v1';

export default function App() {
  // Core State
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits());
  const [history, setHistory] = useState<CompletionRecord>(() => loadHistory());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [gamification, setGamification] = useState<GamificationState>(() =>
    loadGamification()
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

  // Sync state to LocalStorage
  useEffect(() => {
    saveHabits(habits);
  }, [habits]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    saveSettings(settings);
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings]);

  useEffect(() => {
    saveGamification(gamification);
  }, [gamification]);

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
  const handleToggleHabit = useCallback(
    (habitId: string) => {
      // Rule 2: Permanent Past-Day Locking — never allow altering past dates
      if (selectedDate !== todayStr) {
        return;
      }

      const currentList = history[selectedDate] || [];
      const isAlreadyCompleted = currentList.includes(habitId);

      let updatedList: string[];
      if (isAlreadyCompleted) {
        updatedList = currentList.filter((id) => id !== habitId);
      } else {
        updatedList = [...currentList, habitId];
      }

      // Update History state
      setHistory((prev) => ({
        ...prev,
        [selectedDate]: updatedList,
      }));

      // Calculate Gamification EXP Delta
      const allHabitsNowDone =
        habits.length > 0 &&
        habits.every((h) => updatedList.includes(h.id));
      const hadDailyBonusForToday =
        gamification.dailyBonusDates.includes(todayStr);

      let expDelta = 0;
      let updatedBonusDates = [...gamification.dailyBonusDates];
      let toastLabel: string | undefined;

      if (!isAlreadyCompleted) {
        // Habit checked: +20 EXP
        expDelta += EXP_PER_HABIT;
        if (allHabitsNowDone && !hadDailyBonusForToday) {
          expDelta += DAILY_ALL_DONE_BONUS_EXP;
          updatedBonusDates.push(todayStr);
          toastLabel = 'Daily Sweep Bonus!';
        }
      } else {
        // Habit unchecked on current day (misclick protection): revert +20 EXP
        expDelta -= EXP_PER_HABIT;
        if (!allHabitsNowDone && hadDailyBonusForToday) {
          expDelta -= DAILY_ALL_DONE_BONUS_EXP;
          updatedBonusDates = updatedBonusDates.filter((d) => d !== todayStr);
        }
      }

      const prevTotalExp = gamification.totalExp;
      const newTotalExp = Math.max(0, prevTotalExp + expDelta);
      const prevLevel = getLevelProgress(prevTotalExp).level;
      const newLevel = getLevelProgress(newTotalExp).level;

      setGamification({
        totalExp: newTotalExp,
        dailyBonusDates: updatedBonusDates,
      });

      if (expDelta > 0) {
        setRecentExpGain({
          id: Date.now(),
          amount: expDelta,
          label: toastLabel,
        });
      }

      // Check if user crossed a level threshold
      if (newLevel > prevLevel) {
        setLevelUpData({
          previousLevel: prevLevel,
          newLevel,
          totalExp: newTotalExp,
        });
        if (settings.soundEnabled) {
          playLevelUpSound();
        }
      } else if (settings.soundEnabled) {
        if (isAlreadyCompleted) {
          playUncheckSound();
        } else {
          playCheckSound();
        }
      }
    },
    [
      selectedDate,
      todayStr,
      history,
      habits,
      gamification,
      settings.soundEnabled,
    ]
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

  // Data reload from backup or reset
  const handleDataReload = () => {
    setHabits(loadHabits());
    setHistory(loadHistory());
    setSettings(loadSettings());
    setGamification(loadGamification());
  };

  return (
    <div
      id="top"
      className="min-h-screen bg-[#FDFBF7] dark:bg-[#11100F] text-[#2C2C2C] dark:text-[#F5F2EB] flex flex-col font-sans pb-20 sm:pb-12 transition-colors duration-300"
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Automated Midnight Reset Notification Banner (if a 00:00 rollover occurred) */}
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
                  />
                </div>

                {/* Right Column: Streak Widget & Quick Actions (5 cols on lg) */}
                <div className="lg:col-span-5 space-y-6">
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
                          +{EXP_PER_HABIT} EXP per check · +{DAILY_ALL_DONE_BONUS_EXP} EXP daily sweep
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
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1A1816]/95 backdrop-blur-md border-t border-[#EDE6D8] dark:border-[#2C2825] px-4 py-2 flex items-center justify-around shadow-lg transition-colors duration-300">
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
              Storage & Backup
            </button>
            <span>·</span>
            <span>Saved in Browser LocalStorage</span>
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
        onDataReload={handleDataReload}
      />

      {/* Celebratory Level-Up Notification Popup */}
      <LevelUpModal
        levelUpData={levelUpData}
        onClose={() => setLevelUpData(null)}
      />
    </div>
  );
}
