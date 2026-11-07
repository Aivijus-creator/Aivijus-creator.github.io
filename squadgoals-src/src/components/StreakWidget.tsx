import React from 'react';
import { Flame, Trophy, Award, Lock } from 'lucide-react';
import { StreakStats, CompletionRecord, Habit } from '../types';
import { getWeekDays, parseDateKey } from '../utils/date';

interface StreakWidgetProps {
  stats: StreakStats;
  history: CompletionRecord;
  habits: Habit[];
  todayStr: string;
  onOpenDetails?: () => void;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({
  stats,
  history,
  habits,
  todayStr,
  onOpenDetails,
}) => {
  const weekDays = getWeekDays(parseDateKey(todayStr));

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#1A1816]/90 backdrop-blur-md border border-[#EDE6D8] dark:border-[#2C2825] p-5 sm:p-6 shadow-md shadow-[#2C2C2C]/[0.04] dark:shadow-black/30 space-y-5 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF7A00] to-[#FF5757] text-white flex items-center justify-center shadow-sm shadow-[#FF7A00]/20">
            <Flame className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h3 className="text-base font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] leading-none tracking-tight">
              Daily Streak & Momentum
            </h3>
            <p className="text-xs text-[#736C61] dark:text-[#A39B8F] mt-0.5">
              Consecutive days of showing up
            </p>
          </div>
        </div>

        {onOpenDetails && (
          <button
            onClick={onOpenDetails}
            className="text-xs font-semibold text-[#FF7A00] hover:text-[#FF5757] transition-colors cursor-pointer"
          >
            Insights →
          </button>
        )}
      </div>

      {/* Main Big Streak Display */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Current streak card */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-[#FFF5EB] to-[#FFF0E8] dark:from-[#261B12] dark:to-[#241614] border border-[#FADCC0] dark:border-[#FF7A00]/30 flex items-center gap-3.5 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF5757] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#FF7A00]/25">
            <Flame className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums">
                {stats.currentStreak}
              </span>
              <span className="text-xs font-bold text-[#FF7A00] tracking-wide">
                {stats.currentStreak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#736C61] dark:text-[#A39B8F]">
              {stats.currentStreak > 0 ? 'Current Streak 🔥' : 'Start streak today!'}
            </p>
          </div>
        </div>

        {/* Best Record */}
        <div className="p-3.5 rounded-2xl bg-[#FDFBF7] dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#2C2825] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF8E6] dark:bg-[#292212] text-[#F59E0B] border border-[#FBE3A4] dark:border-[#F59E0B]/30 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums">
              {stats.longestStreak}
            </span>
            <span className="text-xs text-[#736C61] dark:text-[#A39B8F] ml-1">days</span>
            <p className="text-[11px] font-semibold text-[#736C61] dark:text-[#A39B8F] tracking-wide">
              Personal Best
            </p>
          </div>
        </div>

        {/* Total Lifetime Completions */}
        <div className="p-3.5 rounded-2xl bg-[#FDFBF7] dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#2C2825] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EEF8F1] dark:bg-[#13261B] text-[#10B981] border border-[#CDEED8] dark:border-[#10B981]/30 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums">
              {stats.totalCompletions}
            </span>
            <span className="text-xs text-[#736C61] dark:text-[#A39B8F] ml-1">habits</span>
            <p className="text-[11px] font-semibold text-[#736C61] dark:text-[#A39B8F] tracking-wide">
              Lifetime Done
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Consistency Visualization */}
      <div className="space-y-2.5 pt-2 border-t border-[#F2ECE1] dark:border-[#262320]">
        <div className="flex items-center justify-between text-xs text-[#736C61] dark:text-[#A39B8F]">
          <span className="font-semibold text-[#2C2C2C] dark:text-[#F5F2EB]">
            This Week's Activity
          </span>
          <span className="font-medium tabular-nums">
            {stats.completionRateThisWeek}% weekly consistency
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((wd) => {
            const count = (history[wd.dateStr] || []).length;
            const hasActivity = count > 0;
            const isFull = habits.length > 0 && count >= habits.length;
            const isPast = wd.dateStr !== todayStr;

            return (
              <div
                key={wd.dateStr}
                className={`flex flex-col items-center py-2 px-1 rounded-xl border text-center transition-all ${
                  isFull
                    ? 'bg-[#FFF0E0] dark:bg-[#2B1D12] border-[#FFD8B3] dark:border-[#FF7A00]/40 text-[#FF7A00]'
                    : hasActivity
                    ? 'bg-[#FFF8F0] dark:bg-[#251A13] border-[#FCE2CC] dark:border-[#FF7A00]/25 text-[#FF7A00]'
                    : 'bg-[#F9F6EF] dark:bg-[#221F1C] border-[#EDE6D8] dark:border-[#2C2825] text-[#9B9386] dark:text-[#787066]'
                }`}
                title={`${wd.dayName} (${wd.dateStr}): ${count} of ${habits.length} habits ${
                  isPast ? '(Locked past record)' : '(Today - editable)'
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] font-bold">{wd.dayName.slice(0, 1)}</span>
                  {isPast && (
                    <Lock
                      className="w-2.5 h-2.5 text-[#9B9386]/75 dark:text-[#787066]"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="mt-1">
                  {hasActivity ? (
                    <Flame
                      className={`w-3.5 h-3.5 ${
                        isFull ? 'text-[#FF5757] fill-[#FF5757]' : 'text-[#FF7A00]'
                      }`}
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[#E5DCCF] dark:bg-[#332E2A] mx-auto my-1" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
