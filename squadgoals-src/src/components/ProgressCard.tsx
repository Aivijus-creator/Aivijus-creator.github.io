import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Flame, Sparkles, CheckCircle2, Lock } from 'lucide-react';

interface ProgressCardProps {
  completedCount: number;
  totalCount: number;
  selectedDateFormatted: string;
  isToday: boolean;
  onCelebrationSound?: () => void;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  completedCount,
  totalCount,
  selectedDateFormatted,
  isToday,
  onCelebrationSound,
}) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const was100Ref = useRef(false);

  const fireCelebrationConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { x: 0.35, y: 0.65 },
        colors: ['#FF7A00', '#FF5757', '#F59E0B', '#10B981', '#FDFBF7'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { x: 0.65, y: 0.65 },
          colors: ['#FF7A00', '#FF5757', '#F59E0B', '#10B981', '#FDFBF7'],
        });
      }, 140);
    } catch (e) {
      console.debug('Confetti skipped', e);
    }
  };

  useEffect(() => {
    if (percentage === 100 && totalCount > 0 && isToday && !was100Ref.current) {
      was100Ref.current = true;
      fireCelebrationConfetti();
      onCelebrationSound?.();
    } else if (percentage < 100) {
      was100Ref.current = false;
    }
  }, [percentage, totalCount, isToday, onCelebrationSound]);

  const handleManualConfetti = () => {
    fireCelebrationConfetti();
  };

  // Dynamic warm encouragement message
  let motivationalTitle = 'Ready to build greatness?';
  let motivationalSubtitle = 'Complete your first habit today to start building momentum.';

  if (percentage === 100 && totalCount > 0) {
    motivationalTitle = 'All SquadGoals Smashed! 🎉';
    motivationalSubtitle = isToday
      ? 'You completed 100% of your habits today. Incredible discipline!'
      : `You completed 100% of your habits on ${selectedDateFormatted}.`;
  } else if (percentage >= 75) {
    motivationalTitle = 'Almost There! Final Push 🔥';
    motivationalSubtitle = `Just ${totalCount - completedCount} more habit to hit a perfect 100%.`;
  } else if (percentage >= 50) {
    motivationalTitle = 'Halfway Point Conquered! ⚡';
    motivationalSubtitle = "You're in the groove now. Keep this sweet flow going.";
  } else if (percentage > 0) {
    motivationalTitle = 'Momentum is Building! ✨';
    motivationalSubtitle = 'Great start! Each small checkmark moves the needle.';
  } else if (!isToday) {
    motivationalTitle = `${selectedDateFormatted} Summary`;
    motivationalSubtitle = 'Historical record locked after midnight reset.';
  }

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#1A1816]/90 backdrop-blur-md border border-[#EDE6D8] dark:border-[#2E2A25] p-5 sm:p-6 shadow-md shadow-[#2C2C2C]/[0.04] dark:shadow-black/30 transition-colors">
      {/* Background warm radial accent */}
      <div
        className="pointer-events-none absolute right-0 top-0 w-64 h-64 rounded-full bg-gradient-to-bl from-[#FF7A00]/12 via-[#FF5757]/6 to-transparent blur-2xl"
        aria-hidden="true"
      />

      <div className="relative space-y-4">
        {/* Top Header Row with status & metric */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#FF7A00] tracking-wide">
                {isToday ? "Today's Progress" : `${selectedDateFormatted} Record`}
              </span>
              <span className="text-[#9B9386] dark:text-[#6E675F]">·</span>
              <span className="text-xs font-medium text-[#736C61] dark:text-[#A69E93] tabular-nums">
                {completedCount} of {totalCount} completed
              </span>
              {!isToday && (
                <>
                  <span className="text-[#9B9386] dark:text-[#6E675F]">·</span>
                  <span className="inline-flex items-center gap-1 text-xs text-[#9B9386] dark:text-[#8C8479]">
                    <Lock className="w-3 h-3" />
                    <span>Locked</span>
                  </span>
                </>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] mt-0.5 tracking-tight">
              {motivationalTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {percentage === 100 ? (
              <button
                onClick={handleManualConfetti}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF0E0] dark:bg-[#2F2115] border border-[#FFD8B3] dark:border-[#FF7A00]/40 text-[#FF7A00] text-xs font-bold hover:bg-[#FFE5CC] dark:hover:bg-[#3A281A] active:scale-95 transition-all cursor-pointer shadow-xs"
                title="Throw celebratory confetti!"
              >
                <Sparkles className="w-4 h-4" />
                <span>+100 EXP Bonus Claimed!</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5EE] dark:bg-[#24211D] border border-[#EDE6D8] dark:border-[#332E29] text-[#2C2C2C] dark:text-[#F5F2EB]">
                <Flame className="w-4 h-4 text-[#FF7A00]" />
                <span className="text-xs font-bold font-['Outfit'] tabular-nums">
                  {percentage}%
                </span>
                <span className="text-[11px] text-[#736C61] dark:text-[#A69E93]">done</span>
              </div>
            )}
          </div>
        </div>

        {/* Visual Progress Bar (Sunset Orange to Coral Red Gradient) */}
        <div className="space-y-1.5">
          <div className="relative h-4 w-full bg-[#F2EDE2] dark:bg-[#282420] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF7A00] via-[#FF6633] to-[#FF5757] transition-all duration-500 ease-out shadow-xs dark:shadow-[0_0_12px_rgba(255,122,0,0.5)]"
              style={{ width: `${Math.min(100, Math.max(percentage, totalCount === 0 ? 0 : 3))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#736C61] dark:text-[#A69E93]">
            <p className="line-clamp-1">{motivationalSubtitle}</p>
            <span className="font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums shrink-0 ml-2">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Mini quick summary highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FDFBF7] dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#302B26]">
            <div className="w-7 h-7 rounded-lg bg-[#FF7A00]/10 dark:bg-[#FF7A00]/15 text-[#FF7A00] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#9B9386] dark:text-[#8C8479] tracking-wide truncate">Done</p>
              <p className="text-sm font-bold text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums font-['Outfit']">
                {completedCount}{' '}
                <span className="text-xs font-normal text-[#736C61] dark:text-[#A69E93]">/ {totalCount}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FDFBF7] dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#302B26]">
            <div className="w-7 h-7 rounded-lg bg-[#FF5757]/10 dark:bg-[#FF5757]/15 text-[#FF5757] flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#9B9386] dark:text-[#8C8479] tracking-wide truncate">Remaining</p>
              <p className="text-sm font-bold text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums font-['Outfit']">
                {Math.max(0, totalCount - completedCount)}{' '}
                <span className="text-xs font-normal text-[#736C61] dark:text-[#A69E93]">habits</span>
              </p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FDFBF7] dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#302B26]">
            <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/10 dark:bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#9B9386] dark:text-[#8C8479] tracking-wide truncate">
                Full Day Bonus
              </p>
              <p className="text-sm font-bold text-[#2C2C2C] dark:text-[#F5F2EB] font-['Outfit'] truncate tabular-nums">
                {percentage === 100 ? '+100 EXP Earned' : '+100 EXP at 100%'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
