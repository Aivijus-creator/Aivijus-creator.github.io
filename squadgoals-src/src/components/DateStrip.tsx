import React from 'react';
import { Calendar as CalendarIcon, CheckCircle2, Lock, Clock } from 'lucide-react';
import { getWeekDays, parseDateKey, formatFriendlyDate } from '../utils/date';
import { CompletionRecord, Habit } from '../types';

interface DateStripProps {
  selectedDate: string;
  todayStr: string;
  midnightCountdown: string;
  onSelectDate: (dateStr: string) => void;
  history: CompletionRecord;
  habits: Habit[];
}

export const DateStrip: React.FC<DateStripProps> = ({
  selectedDate,
  todayStr,
  midnightCountdown,
  onSelectDate,
  history,
  habits,
}) => {
  const weekDays = getWeekDays(parseDateKey(todayStr));

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <CalendarIcon className="w-4 h-4 text-[#FF7A00] shrink-0" />
          <span className="font-bold text-[#736C61] dark:text-[#A69E93] tracking-wide">
            Viewing:{' '}
            <span className="text-[#2C2C2C] dark:text-[#F5F2EB] font-semibold">
              {formatFriendlyDate(selectedDate)}
            </span>
          </span>
          <span className="text-[#9B9386] dark:text-[#6E675F]" aria-hidden="true">
            ·
          </span>
          {selectedDate === todayStr ? (
            <span className="inline-flex items-center gap-1 text-[#736C61] dark:text-[#A69E93] font-medium">
              <Clock className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>
                Editable today · Locks at 00:00 (
                <span className="tabular-nums font-semibold text-[#2C2C2C] dark:text-[#F5F2EB]">
                  {midnightCountdown}
                </span>
                )
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[#9B9386] dark:text-[#8C8479] font-medium">
              <Lock className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Past Record Locked (Read-Only)</span>
            </span>
          )}
        </div>

        {selectedDate !== todayStr && (
          <button
            onClick={() => onSelectDate(todayStr)}
            className="text-xs font-semibold text-[#FF7A00] hover:text-[#FF5757] transition-colors cursor-pointer whitespace-nowrap"
          >
            Jump to Today →
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {weekDays.map((day) => {
          const isSelected = day.dateStr === selectedDate;
          const isDayToday = day.dateStr === todayStr;
          const isPastDay = !isDayToday;
          const completedCount = (history[day.dateStr] || []).length;
          const totalHabits = habits.length;
          const isAllDone = totalHabits > 0 && completedCount >= totalHabits;
          const hasAny = completedCount > 0;

          return (
            <button
              key={day.dateStr}
              onClick={() => onSelectDate(day.dateStr)}
              title={
                isDayToday
                  ? `Today (${day.dateStr}) — Editable until 00:00 midnight`
                  : `${day.dayName} (${day.dateStr}) — Past record permanently locked (${completedCount}/${totalHabits} completed)`
              }
              className={`group relative flex flex-col items-center justify-center py-2.5 sm:py-3 px-1 rounded-2xl border transition-all duration-150 text-center cursor-pointer ${
                isSelected
                  ? 'bg-[#2C2C2C] dark:bg-[#FF7A00] text-white border-[#2C2C2C] dark:border-[#FF7A00] shadow-lg shadow-[#2C2C2C]/15 dark:shadow-[#FF7A00]/25 -translate-y-0.5'
                  : isDayToday
                  ? 'bg-white/95 dark:bg-[#1C1A17] backdrop-blur-md text-[#2C2C2C] dark:text-[#F5F2EB] border-[#FF7A00] shadow-sm shadow-[#FF7A00]/10 hover:border-[#FF5757] hover:-translate-y-0.5'
                  : 'bg-white/80 dark:bg-[#181614]/90 backdrop-blur-sm text-[#736C61] dark:text-[#A69E93] border-[#EDE6D8] dark:border-[#2B2723] hover:border-[#D6CAB6] dark:hover:border-[#3D3731] hover:bg-white dark:hover:bg-[#221F1C] hover:-translate-y-0.5 shadow-2xs'
              } active:scale-95`}
            >
              {/* Top row: Day name + subtle padlock icon on past days */}
              <div className="flex items-center justify-center gap-1">
                <span
                  className={`text-[10px] sm:text-xs font-semibold tracking-wider ${
                    isSelected
                      ? 'text-white/90'
                      : isDayToday
                      ? 'text-[#FF7A00] font-bold'
                      : 'text-[#9B9386] dark:text-[#8C8479]'
                  }`}
                >
                  {day.dayName}
                </span>
                {isPastDay && (
                  <Lock
                    className={`w-2.5 h-2.5 shrink-0 ${
                      isSelected ? 'text-white/75' : 'text-[#9B9386]/80 dark:text-[#787066]'
                    }`}
                    aria-label="Locked past date"
                  />
                )}
              </div>

              <span
                className={`text-base sm:text-lg font-bold font-['Outfit'] mt-0.5 tabular-nums ${
                  isSelected
                    ? 'text-white'
                    : isDayToday
                    ? 'text-[#2C2C2C] dark:text-[#F5F2EB]'
                    : 'text-[#4A443A] dark:text-[#D5CEC4]'
                }`}
              >
                {day.dayNumber}
              </span>

              {/* Status indicator */}
              <div className="mt-1 h-3.5 flex items-center justify-center gap-1">
                {isAllDone ? (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-white sm:text-[#FF7A00] dark:text-white' : 'text-[#FF7A00]'
                    }`}
                  />
                ) : hasAny ? (
                  <span
                    className={`text-[10px] font-bold tabular-nums ${
                      isSelected ? 'text-white/90' : 'text-[#FF7A00]'
                    }`}
                  >
                    {completedCount}/{totalHabits}
                  </span>
                ) : (
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white/35' : 'bg-[#EDE6D8] dark:bg-[#2E2A25]'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
