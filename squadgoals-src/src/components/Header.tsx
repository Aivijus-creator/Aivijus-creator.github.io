import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Plus,
  Volume2,
  VolumeX,
  Database,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';
import { LevelProgress } from '../utils/gamification';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeView: 'tracker' | 'insights';
  onChangeView: (view: 'tracker' | 'insights') => void;
  levelProgress: LevelProgress;
  recentExpGain: { id: number; amount: number; label?: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenBackupModal,
  soundEnabled,
  onToggleSound,
  darkMode,
  onToggleDarkMode,
  activeView,
  onChangeView,
  levelProgress,
  recentExpGain,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FDFBF7]/85 dark:bg-[#11100F]/85 backdrop-blur-xl border-b border-[#EDE6D8]/90 dark:border-[#292521] shadow-xs shadow-[#2C2C2C]/[0.02] dark:shadow-black/20 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 md:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onChangeView('tracker');
          }}
          className="flex items-center gap-2.5 shrink-0 group focus:outline-hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF5757] flex items-center justify-center text-white shadow-md shadow-[#FF7A00]/25 group-hover:scale-105 transition-transform duration-150">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-['Outfit'] font-extrabold text-lg sm:text-xl tracking-tight text-[#2C2C2C] dark:text-[#F5F2EB] whitespace-nowrap shrink-0">
            SquadGoals
          </span>
        </a>

        {/* Zone 2: Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F2EDE2]/90 dark:bg-[#1E1C19] p-1 rounded-xl border border-[#E6DEC8]/60 dark:border-[#2E2A25]">
          {(
            [
              { id: 'tracker', label: "Today's Habits" },
              { id: 'insights', label: 'Streaks & History' },
            ] as const
          ).map((tab) => {
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeView(tab.id)}
                className={`relative px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-[#2C2C2C] dark:text-[#F5F2EB]'
                    : 'text-[#736C61] dark:text-[#9E9589] hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="header-active-tab"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-white dark:bg-[#2B2723] rounded-lg shadow-xs border border-[#EDE6D8]/80 dark:border-[#3B3530]"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Persistent Level & EXP Status Bar + Controls + Primary CTA */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Persistent Level & EXP Header Bar */}
          <div
            className="relative flex items-center gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/95 dark:bg-[#1C1A17] border border-[#EDE6D8] dark:border-[#2E2A25] shadow-2xs"
            title={`${levelProgress.rankTitle} · ${levelProgress.currentLevelExp}/${levelProgress.expForNextLevel} EXP to Level ${levelProgress.level + 1} (${levelProgress.totalExp} total EXP)`}
          >
            {/* Level Badge */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FF5757] text-white font-['Outfit'] font-extrabold text-xs tracking-wide shadow-xs shadow-[#FF7A00]/25 whitespace-nowrap shrink-0">
              <Zap className="w-3 h-3 fill-white" />
              <span>Lvl {levelProgress.level}</span>
            </div>

            {/* Animated EXP Progress Bar & Ratio */}
            <div className="w-20 sm:w-28 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-bold leading-none">
                <span className="text-[#736C61] dark:text-[#A69E93] truncate hidden sm:inline">
                  {levelProgress.rankTitle}
                </span>
                <span className="text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums ml-auto">
                  {levelProgress.currentLevelExp}/{levelProgress.expForNextLevel}{' '}
                  <span className="text-[#FF7A00]">EXP</span>
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-[#F2EDE2] dark:bg-[#2C2824] overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${Math.max(4, levelProgress.progressPercentage)}%` }}
                  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#FF7A00] via-[#FF6633] to-[#FF5757] dark:shadow-[0_0_8px_rgba(255,122,0,0.6)]"
                />
              </div>
            </div>

            {/* Floating Animated EXP Gain Toast */}
            <AnimatePresence>
              {recentExpGain && (
                <motion.div
                  key={recentExpGain.id}
                  initial={{ opacity: 0, y: 6, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`pointer-events-none absolute -bottom-7 right-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold font-['Outfit'] shadow-md whitespace-nowrap z-40 ${
                    recentExpGain.amount >= 0
                      ? 'bg-gradient-to-r from-[#FF7A00] to-[#FF5757] text-white'
                      : 'bg-[#2C2C2C] dark:bg-[#36312C] text-[#F5F2EB]'
                  }`}
                >
                  {recentExpGain.amount >= 0 ? `+${recentExpGain.amount}` : recentExpGain.amount} EXP
                  {recentExpGain.label ? ` · ${recentExpGain.label}` : ''}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dark Mode Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to Warm Light Mode' : 'Switch to Sleek Dark Mode'}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-xl border border-[#EDE6D8] dark:border-[#2E2A25] bg-white/90 dark:bg-[#1C1A17] text-[#736C61] dark:text-[#F59E0B] hover:text-[#2C2C2C] dark:hover:text-[#FBBF24] hover:border-[#D9CFBE] dark:hover:border-[#FF7A00]/50 dark:hover:shadow-[0_0_12px_rgba(255,122,0,0.2)] active:scale-95 flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-[#FF7A00] transition-transform duration-200 rotate-0" />
            ) : (
              <Moon className="w-4 h-4 text-[#736C61] transition-transform duration-200" />
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="hidden sm:flex w-9 h-9 rounded-xl border border-[#EDE6D8] dark:border-[#2E2A25] bg-white/90 dark:bg-[#1C1A17] text-[#736C61] dark:text-[#A69E93] hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB] hover:border-[#D9CFBE] dark:hover:border-[#3E3832] active:scale-95 items-center justify-center transition-all duration-150 shrink-0 cursor-pointer"
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#FF7A00]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#9B9386]" />
            )}
          </button>

          {/* Backup / Data Management */}
          <button
            onClick={onOpenBackupModal}
            title="Local Storage & Backup"
            className="hidden sm:flex w-9 h-9 rounded-xl border border-[#EDE6D8] dark:border-[#2E2A25] bg-white/90 dark:bg-[#1C1A17] text-[#736C61] dark:text-[#A69E93] hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB] hover:border-[#D9CFBE] dark:hover:border-[#3E3832] active:scale-95 items-center justify-center transition-all duration-150 shrink-0 cursor-pointer"
            aria-label="Manage data and storage"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Primary CTA: Add Habit */}
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#FF7A00] to-[#FF5757] hover:from-[#E86B00] hover:to-[#E64848] shadow-md shadow-[#FF7A00]/25 hover:shadow-lg hover:shadow-[#FF7A00]/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline sm:inline">New Habit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
