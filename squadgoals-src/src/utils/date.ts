import { Habit, CompletionRecord, StreakStats } from '../types';

export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function getTimeUntilMidnight(now: Date = new Date()): {
  msRemaining: number;
  formattedCountdown: string;
} {
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  const msRemaining = Math.max(0, midnight.getTime() - now.getTime());
  const totalSeconds = Math.floor(msRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const formattedCountdown =
    hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${totalSeconds % 60}s`;

  return { msRemaining, formattedCountdown };
}

export function formatFriendlyDate(dateStr: string): string {
  const todayStr = formatDateKey(new Date());
  if (dateStr === todayStr) {
    return 'Today';
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === formatDateKey(yesterday)) {
    return 'Yesterday';
  }

  const date = parseDateKey(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getWeekDays(referenceDate: Date = new Date()) {
  const days = [];
  const todayStr = formatDateKey(new Date());

  // Show 7 days ending with today (or centered on selected date)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateKey(d);
    
    days.push({
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
      isFuture: d.getTime() > new Date().setHours(23, 59, 59, 999),
    });
  }
  return days;
}

export function calculateStreakStats(
  habits: Habit[],
  history: CompletionRecord
): StreakStats {
  if (habits.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRateThisWeek: 0,
      daysActiveThisMonth: 0,
    };
  }

  const todayStr = formatDateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateKey(yesterday);

  // Total completions count
  let totalCompletions = 0;
  Object.values(history).forEach((completedIds) => {
    totalCompletions += completedIds.length;
  });

  // Calculate current streak:
  // A day is considered active/completed if user completed at least 1 habit (or 50% threshold, but usually at least 1 is standard for habit apps).
  // If user completed today, start counting back from today.
  // If user hasn't completed today yet, check if yesterday was completed; if so, count back from yesterday so streak isn't lost mid-day!
  let currentStreak = 0;
  const todayCompleted = (history[todayStr] || []).length > 0;
  const yesterdayCompleted = (history[yesterdayStr] || []).length > 0;

  let checkDate = new Date();
  if (!todayCompleted) {
    if (yesterdayCompleted) {
      checkDate = yesterday;
    } else {
      currentStreak = 0;
    }
  }

  if (todayCompleted || yesterdayCompleted) {
    let streakCount = 0;
    const runner = new Date(checkDate);

    while (true) {
      const dKey = formatDateKey(runner);
      const dayCompletions = history[dKey] || [];
      if (dayCompletions.length > 0) {
        streakCount++;
        runner.setDate(runner.getDate() - 1);
      } else {
        break;
      }
    }
    currentStreak = streakCount;
  }

  // Calculate longest streak across history
  const sortedDates = Object.keys(history)
    .filter((dKey) => (history[dKey] || []).length > 0)
    .sort();

  let longestStreak = currentStreak;
  if (sortedDates.length > 0) {
    let tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = parseDateKey(sortedDates[i - 1]);
      const curr = parseDateKey(sortedDates[i]);
      const diffTime = curr.getTime() - prev.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  // Calculate completion rate this week
  const weekDays = getWeekDays(new Date());
  let possibleCompletions = 0;
  let actualCompletions = 0;

  weekDays.forEach((wd) => {
    possibleCompletions += habits.length;
    actualCompletions += (history[wd.dateStr] || []).length;
  });

  const completionRateThisWeek =
    possibleCompletions > 0
      ? Math.round((actualCompletions / possibleCompletions) * 100)
      : 0;

  // Days active in last 30 days
  let daysActiveThisMonth = 0;
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  Object.keys(history).forEach((dKey) => {
    const d = parseDateKey(dKey);
    if (d >= monthAgo && (history[dKey] || []).length > 0) {
      daysActiveThisMonth++;
    }
  });

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRateThisWeek,
    daysActiveThisMonth,
  };
}
