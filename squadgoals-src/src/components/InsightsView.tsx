import React from 'react';
import { Flame, Lock, Zap } from 'lucide-react';
import { Habit, CompletionRecord, StreakStats } from '../types';
import { formatDateKey, parseDateKey } from '../utils/date';
import { LevelProgress } from '../utils/gamification';

interface InsightsViewProps {
  habits: Habit[];
  history: CompletionRecord;
  stats: StreakStats;
  todayStr: string;
  levelProgress: LevelProgress;
}

interface DayHeatmapItem {
  dateKey: string;
  dayNum: number;
  dayName: string;
  count: number;
  total: number;
  ratio: number;
  isPast: boolean;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  habits,
  history,
  stats,
  todayStr,
  levelProgress,
}) => {
  // Generate last 28 days calendar grid (4 weeks) anchored to todayStr
  const last28Days: DayHeatmapItem[] = [];
  const today = parseDateKey(todayStr);
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = formatDateKey(d);
    const count = (history[dateKey] || []).length;
    const total = habits.length;
    const ratio = total > 0 ? count / total : 0;

    last28Days.push({
      dateKey,
      dayNum: d.getDate(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      count,
      total,
      ratio,
      isPast: dateKey !== todayStr,
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FFF5EB] via-[#FFF8F2] to-[#FFF0EB] dark:from-[#1F1A17] dark:via-[#231B16] dark:to-[#221716] border border-[#FADCC0] dark:border-[#3A2B20] p-6 sm:p-7 space-y-4 shadow-md shadow-[#2C2C2C]/[0.03] dark:shadow-black/30 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#FF5757] text-white flex items-center justify-center shadow-md shadow-[#FF7A00]/20">
              <Flame className="w-7 h-7 fill-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tracking-tight">
                Consistency & EXP Analytics
              </h2>
              <p className="text-xs sm:text-sm text-[#736C61] dark:text-[#A39B8F]">
                Review your permanently locked daily history and steady compounding growth.
              </p>
            </div>
          </div>

          {/* Level Summary Badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-[#1A1816]/90 border border-[#EDE6D8] dark:border-[#2C2825] self-start sm:self-auto">
            <Zap className="w-4 h-4 text-[#FF7A00] fill-[#FF7A00]" />
            <div className="text-xs">
              <span className="font-extrabold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB]">
                Lvl {levelProgress.level} · {levelProgress.rankTitle}
              </span>
              <span className="text-[#736C61] dark:text-[#A39B8F] ml-1.5 tabular-nums">
                ({levelProgress.totalExp} Total EXP)
              </span>
            </div>
          </div>
        </div>

        {/* Big 4-Column Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-[#1A1816]/95 backdrop-blur-sm border border-[#EDE6D8] dark:border-[#2C2825] shadow-2xs">
            <p className="text-[11px] font-bold text-[#9B9386] dark:text-[#A39B8F] tracking-wide">
              Current Streak
            </p>
            <p className="text-2xl font-extrabold font-['Outfit'] text-[#FF7A00] tabular-nums mt-0.5">
              {stats.currentStreak}{' '}
              <span className="text-xs font-semibold text-[#736C61] dark:text-[#A39B8F]">days</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-[#1A1816]/95 backdrop-blur-sm border border-[#EDE6D8] dark:border-[#2C2825] shadow-2xs">
            <p className="text-[11px] font-bold text-[#9B9386] dark:text-[#A39B8F] tracking-wide">
              Best Streak
            </p>
            <p className="text-2xl font-extrabold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums mt-0.5">
              {stats.longestStreak}{' '}
              <span className="text-xs font-semibold text-[#736C61] dark:text-[#A39B8F]">days</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-[#1A1816]/95 backdrop-blur-sm border border-[#EDE6D8] dark:border-[#2C2825] shadow-2xs">
            <p className="text-[11px] font-bold text-[#9B9386] dark:text-[#A39B8F] tracking-wide">
              Lifetime Checks
            </p>
            <p className="text-2xl font-extrabold font-['Outfit'] text-[#10B981] tabular-nums mt-0.5">
              {stats.totalCompletions}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-[#1A1816]/95 backdrop-blur-sm border border-[#EDE6D8] dark:border-[#2C2825] shadow-2xs">
            <p className="text-[11px] font-bold text-[#9B9386] dark:text-[#A39B8F] tracking-wide">
              30-Day Active
            </p>
            <p className="text-2xl font-extrabold font-['Outfit'] text-[#8B5CF6] dark:text-[#A78BFA] tabular-nums mt-0.5">
              {stats.daysActiveThisMonth}{' '}
              <span className="text-xs font-semibold text-[#736C61] dark:text-[#A39B8F]">/ 30</span>
            </p>
          </div>
        </div>
      </div>

      {/* 28-Day Consistency Matrix */}
      <div className="rounded-3xl bg-white/90 dark:bg-[#1A1816]/90 backdrop-blur-md border border-[#EDE6D8] dark:border-[#2C2825] p-6 shadow-md shadow-[#2C2C2C]/[0.04] dark:shadow-black/30 space-y-4 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tracking-tight">
                4-Week Heat Grid (Past 28 Days)
              </h3>
              <span className="inline-flex items-center gap-1 text-xs text-[#9B9386] dark:text-[#A39B8F]">
                <span aria-hidden="true">·</span>
                <Lock className="w-3 h-3" />
                <span>Past days locked</span>
              </span>
            </div>
            <p className="text-xs text-[#736C61] dark:text-[#A39B8F]">
              Brighter sunset squares mean higher completion percentages for that day
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-1.5 text-xs text-[#736C61] dark:text-[#A39B8F]">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded-md bg-[#F2EDE2] dark:bg-[#262320]" />
            <div className="w-3.5 h-3.5 rounded-md bg-[#FFD8B3] dark:bg-[#4A3219]" />
            <div className="w-3.5 h-3.5 rounded-md bg-[#FF9D4D]" />
            <div className="w-3.5 h-3.5 rounded-md bg-[#FF7A00]" />
            <div className="w-3.5 h-3.5 rounded-md bg-[#FF5757]" />
            <span>100%</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-7 gap-2 pt-2">
          {last28Days.map((day) => {
            let bgClass = 'bg-[#F2EDE2] dark:bg-[#262320] text-[#736C61] dark:text-[#A39B8F]';
            if (day.ratio === 1) {
              bgClass = 'bg-[#FF5757] text-white font-bold shadow-xs';
            } else if (day.ratio >= 0.75) {
              bgClass = 'bg-[#FF7A00] text-white font-bold';
            } else if (day.ratio >= 0.4) {
              bgClass = 'bg-[#FF9D4D] text-white font-medium';
            } else if (day.count > 0) {
              bgClass = 'bg-[#FFD8B3] dark:bg-[#4A3219] text-[#2C2C2C] dark:text-[#FFD8B3]';
            }

            return (
              <div
                key={day.dateKey}
                className={`relative flex flex-col items-center justify-center p-2 rounded-xl text-center transition-transform duration-150 hover:scale-105 cursor-default ${bgClass} ${
                  !day.isPast
                    ? 'ring-2 ring-[#2C2C2C] dark:ring-[#FF7A00] ring-offset-1 dark:ring-offset-[#1A1816]'
                    : ''
                }`}
                title={`${day.dateKey}: ${day.count} of ${day.total} habits completed ${
                  day.isPast ? '(Locked historical record)' : '(Today - editable until 00:00)'
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] opacity-80">{day.dayName}</span>
                  {day.isPast && (
                    <Lock className="w-2.5 h-2.5 opacity-65" aria-label="Locked past day" />
                  )}
                </div>
                <span className="text-sm font-bold font-['Outfit'] mt-0.5 tabular-nums">
                  {day.dayNum}
                </span>
                <span className="text-[9px] opacity-85 mt-0.5 tabular-nums">
                  {day.count}/{day.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habit breakdown per item */}
      <div className="rounded-3xl bg-white dark:bg-[#1A1816] border border-[#EDE6D8] dark:border-[#2C2825] p-6 shadow-sm shadow-[#2C2C2C]/5 dark:shadow-black/30 space-y-4 transition-colors duration-300">
        <h3 className="text-base font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB]">
          Habits Portfolio & Consistency
        </h3>

        <div className="space-y-3">
          {habits.map((habit) => {
            // Count completions in last 28 days for this habit
            let compCount = 0;
            last28Days.forEach((d) => {
              const list = history[d.dateKey] || [];
              if (list.includes(habit.id)) compCount++;
            });
            const rate = Math.round((compCount / 28) * 100);

            return (
              <div
                key={habit.id}
                className="p-3.5 rounded-2xl bg-[#FDFBF7] dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#2C2825] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{
                      backgroundColor: `${habit.color}18`,
                      border: `1px solid ${habit.color}35`,
                    }}
                  >
                    <span>{habit.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] truncate">
                      {habit.name}
                    </p>
                    <p className="text-xs text-[#736C61] dark:text-[#A39B8F] capitalize">
                      {habit.category} · Target {habit.targetDaysPerWeek}x/wk
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums">
                    {compCount} / 28 days
                  </p>
                  <p className="text-xs font-semibold text-[#FF7A00] tabular-nums">
                    {rate}% monthly rate
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
