import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Trash2, Edit3, Flame, Plus, Sparkles, Lock, RotateCcw } from 'lucide-react';
import { Habit, HabitCategory } from '../types';
import { parseDateKey } from '../utils/date';

interface HabitChecklistProps {
  habits: Habit[];
  completedHabitIds: string[];
  onToggleHabit: (habitId: string) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onOpenAddModal: () => void;
  selectedDateFormatted: string;
  todayStr: string;
  isToday: boolean;
  historyMap: Record<string, string[]>;
}

const CATEGORIES: { id: 'all' | HabitCategory; label: string }[] = [
  { id: 'all', label: 'All Habits' },
  { id: 'health', label: 'Health' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'mind', label: 'Mind' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'lifestyle', label: 'Lifestyle' },
];

export const HabitChecklist: React.FC<HabitChecklistProps> = ({
  habits,
  completedHabitIds,
  onToggleHabit,
  onEditHabit,
  onDeleteHabit,
  onOpenAddModal,
  selectedDateFormatted,
  todayStr,
  isToday,
  historyMap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | HabitCategory>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter habits
  const filteredHabits = habits.filter((h) => {
    if (selectedCategory === 'all') return true;
    return h.category === selectedCategory;
  });

  // Calculate individual habit streak up to todayStr
  const getHabitStreak = (habitId: string): number => {
    let streak = 0;
    const runner = parseDateKey(todayStr);
    for (let i = 0; i < 30; i++) {
      const d = new Date(runner);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dKey = `${year}-${month}-${day}`;
      const dayList = historyMap[dKey] || [];
      if (dayList.includes(habitId)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const isPastLocked = !isToday;

  return (
    <div className="space-y-4">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tracking-tight">
              Habit Checklist
            </h3>
            {isPastLocked && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#736C61] dark:text-[#A69E93]">
                <span aria-hidden="true">·</span>
                <Lock className="w-3.5 h-3.5 text-[#FF7A00]" />
                <span>Locked History</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#736C61] dark:text-[#A69E93] mt-0.5">
            {isToday
              ? 'Earn +20 EXP per habit (+100 EXP full-day bonus) — editable today until 00:00 midnight'
              : `Viewing ${selectedDateFormatted} — past records are permanently locked and read-only`}
          </p>
        </div>

        {/* Category Filters with Seamless Tab-Switching Animation */}
        <div className="flex items-center gap-1 bg-[#F2EDE2]/90 dark:bg-[#1E1C19] p-1 rounded-xl border border-[#E6DEC8]/60 dark:border-[#2E2A25] overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === 'all'
                ? habits.length
                : habits.filter((h) => h.category === cat.id).length;

            if (cat.id !== 'all' && count === 0) return null;

            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'text-[#736C61] dark:text-[#A69E93] hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="category-filter-tab"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-gradient-to-r from-[#FF7A00] to-[#FF5757] rounded-lg shadow-xs"
                  />
                )}
                <span className="relative z-10">
                  {cat.label}{' '}
                  {count > 0 && (
                    <span className="opacity-80 tabular-nums">({count})</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Past Day Read-Only Notice */}
      <AnimatePresence mode="wait">
        {isPastLocked && (
          <motion.div
            key="past-lock-banner"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="rounded-2xl bg-white/80 dark:bg-[#1A1816]/90 backdrop-blur-md border border-[#EDE6D8] dark:border-[#2E2A25] px-4 py-3 flex items-center gap-2.5 text-xs text-[#736C61] dark:text-[#A69E93] shadow-xs"
          >
            <Lock className="w-4 h-4 text-[#FF7A00] shrink-0" />
            <span>
              <strong className="font-semibold text-[#2C2C2C] dark:text-[#F5F2EB]">
                {selectedDateFormatted} is permanently locked:
              </strong>{' '}
              Past days are read-only after the 00:00 midnight reset so your historical records cannot be altered.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Habit List */}
      <AnimatePresence mode="wait">
        {filteredHabits.length === 0 ? (
          <motion.div
            key="empty-habits"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#1A1816]/90 backdrop-blur-md border border-[#EDE6D8] dark:border-[#2E2A25] p-8 text-center space-y-3 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5EB] dark:bg-[#2A2018] text-[#FF7A00] mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB]">
                No habits in this category yet
              </h4>
              <p className="text-xs text-[#736C61] dark:text-[#A69E93] max-w-sm mx-auto mt-1">
                Add a daily intention to your squad to start tracking your streak!
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#FF7A00] to-[#FF5757] hover:opacity-95 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Habit</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 gap-3"
          >
            {filteredHabits.map((habit) => {
              const isCompleted = completedHabitIds.includes(habit.id);
              const streak = getHabitStreak(habit.id);
              const isDeleting = confirmDeleteId === habit.id;

              return (
                <div
                  key={habit.id}
                  className={`group relative rounded-2xl border transition-all duration-150 p-3.5 sm:p-4 flex items-center justify-between gap-3 ${
                    isPastLocked
                      ? isCompleted
                        ? 'bg-white/80 dark:bg-[#191715]/85 backdrop-blur-sm border-[#EDE0CE] dark:border-[#2E2822] shadow-2xs'
                        : 'bg-[#FAF7F2]/80 dark:bg-[#161412]/80 backdrop-blur-sm border-[#EDE6D8] dark:border-[#26231F] opacity-85'
                      : isCompleted
                      ? 'bg-white/95 dark:bg-[#1D1A17]/95 backdrop-blur-md border-[#F2DEC4] dark:border-[#FF7A00]/35 shadow-sm shadow-[#FF7A00]/[0.04] hover:border-[#E5C9A8] dark:hover:border-[#FF7A00]/50 hover:-translate-y-0.5'
                      : 'bg-white/95 dark:bg-[#1C1A17]/95 backdrop-blur-md border-[#EDE6D8] dark:border-[#2E2A25] shadow-sm shadow-[#2C2C2C]/[0.03] hover:border-[#D9CFBE] dark:hover:border-[#3E3832] hover:shadow-md hover:shadow-[#2C2C2C]/[0.06] hover:-translate-y-0.5'
                  }`}
                >
                  {/* Left section: Checkbox + Icon + Title */}
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                    {/* Big Touch-Friendly Interactive Checkbox (44x44px hitbox) with Tactile Scale-Down Click */}
                    <button
                      type="button"
                      disabled={isPastLocked}
                      onClick={() => {
                        if (!isPastLocked) {
                          onToggleHabit(habit.id);
                        }
                      }}
                      title={
                        isPastLocked
                          ? `Locked: Past days (${selectedDateFormatted}) are permanently read-only`
                          : isCompleted
                          ? `Checked for today (+20 EXP) — click to uncheck if clicked by mistake`
                          : `Mark ${habit.name} as complete (+20 EXP)`
                      }
                      aria-label={
                        isPastLocked
                          ? `${habit.name} is permanently locked for ${selectedDateFormatted}`
                          : `Mark ${habit.name} as ${isCompleted ? 'incomplete' : 'complete'}`
                      }
                      className={`relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-150 shrink-0 select-none ${
                        isPastLocked
                          ? isCompleted
                            ? 'bg-gradient-to-r from-[#FF7A00]/85 to-[#FF5757]/85 text-white shadow-2xs cursor-not-allowed'
                            : 'border-2 border-[#E5DEC9] dark:border-[#332E29] bg-[#F4EFE6] dark:bg-[#221F1C] text-[#9B9386] cursor-not-allowed'
                          : isCompleted
                          ? 'bg-gradient-to-r from-[#FF7A00] to-[#FF5757] text-white shadow-md shadow-[#FF7A00]/25 hover:opacity-95 active:scale-90 cursor-pointer'
                          : 'border-2 border-[#D9CFBE] dark:border-[#3A342E] hover:border-[#FF7A00] dark:hover:border-[#FF7A00] bg-white dark:bg-[#24211E] hover:bg-[#FFF9F4] dark:hover:bg-[#2C2722] active:scale-90 cursor-pointer'
                      }`}
                    >
                      {isCompleted ? (
                        <motion.span
                          key="checked"
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                          className="flex items-center justify-center"
                        >
                          <Check className="w-5 h-5 stroke-[3]" />
                        </motion.span>
                      ) : isPastLocked ? (
                        <Lock className="w-4 h-4 text-[#9B9386] dark:text-[#787066]" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-[#FF7A00]/25 transition-colors" />
                      )}
                    </button>

                    {/* Habit Icon Container */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform duration-150 ${
                        !isPastLocked ? 'group-hover:scale-105' : ''
                      }`}
                      style={{
                        backgroundColor: `${habit.color}18`,
                        border: `1px solid ${habit.color}35`,
                      }}
                    >
                      <span>{habit.icon || '🎯'}</span>
                    </div>

                    {/* Habit details */}
                    <div
                      className={`min-w-0 flex-1 ${
                        isPastLocked ? 'cursor-default' : 'cursor-pointer'
                      }`}
                      onClick={() => {
                        if (!isPastLocked) {
                          onToggleHabit(habit.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-['Outfit'] font-bold text-sm sm:text-base leading-snug transition-all duration-150 ${
                            isCompleted
                              ? 'line-through text-[#9B9386] dark:text-[#787066]'
                              : isPastLocked
                              ? 'text-[#736C61] dark:text-[#A69E93]'
                              : 'text-[#2C2C2C] dark:text-[#F5F2EB]'
                          }`}
                        >
                          {habit.name}
                        </span>

                        {/* Subtle Padlock Icon next to all past historical records */}
                        {isPastLocked && (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-[#9B9386] dark:text-[#8C8479]"
                            title={`Past record for ${selectedDateFormatted} is permanently locked`}
                          >
                            <Lock className="w-3.5 h-3.5 text-[#9B9386] dark:text-[#8C8479] shrink-0" />
                            <span className="text-[11px] font-medium">
                              {isCompleted ? 'Completed & Locked' : 'Missed & Locked'}
                            </span>
                          </span>
                        )}

                        {/* Current Day Undo Hint when checked */}
                        {!isPastLocked && isCompleted && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#736C61] dark:text-[#A69E93] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                            title="Click to uncheck if checked by mistake"
                          >
                            <RotateCcw className="w-3 h-3 text-[#FF7A00]" />
                            <span>Tap to undo</span>
                          </span>
                        )}

                        {/* Habit Streak count */}
                        {streak > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#FF7A00]">
                            <span className="text-[#9B9386] dark:text-[#6E675F] font-normal mr-1" aria-hidden="true">
                              ·
                            </span>
                            <Flame className="w-3.5 h-3.5 fill-current" />
                            <span className="tabular-nums">{streak}d</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#736C61] dark:text-[#A69E93] mt-0.5 truncate">
                        {habit.description && (
                          <span className="truncate">{habit.description}</span>
                        )}
                        {habit.description && <span aria-hidden="true">·</span>}
                        <span className="capitalize">{habit.category}</span>
                        {!isPastLocked && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-semibold tabular-nums ${
                                isCompleted
                                  ? 'text-[#FF7A00]'
                                  : 'text-[#9B9386] dark:text-[#8C8479]'
                              }`}
                            >
                              {isCompleted ? '+20 EXP Earned' : '+20 EXP'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right section: Contextual Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-[#FFEBEB] dark:bg-[#2E1A1A] p-1 rounded-xl border border-[#FFCCD0] dark:border-[#5C2B2B]">
                        <span className="text-[11px] font-bold text-[#FF5757] px-1">
                          Delete?
                        </span>
                        <button
                          onClick={() => onDeleteHabit(habit.id)}
                          className="px-2 py-1 bg-[#FF5757] text-white rounded-lg text-xs font-bold hover:bg-[#E64848] transition-colors cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-white dark:bg-[#24211E] text-[#736C61] dark:text-[#A69E93] rounded-lg text-xs font-medium hover:text-[#2C2C2C] dark:hover:text-white transition-colors cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onEditHabit(habit)}
                          title="Edit habit details"
                          className="w-8 h-8 rounded-lg text-[#9B9386] dark:text-[#8C8479] hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB] hover:bg-[#F2EDE2] dark:hover:bg-[#2A2622] active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                          aria-label={`Edit ${habit.name}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setConfirmDeleteId(habit.id)}
                          title="Delete habit"
                          className="w-8 h-8 rounded-lg text-[#9B9386] dark:text-[#8C8479] hover:text-[#FF5757] hover:bg-[#FFEBEB] dark:hover:bg-[#2E1A1A] active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                          aria-label={`Delete ${habit.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
