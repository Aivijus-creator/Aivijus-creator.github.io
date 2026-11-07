import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Zap, X, ArrowUpRight } from 'lucide-react';
import { getRankTitle, getExpRequiredForLevel } from '../utils/gamification';

interface LevelUpModalProps {
  levelUpData: {
    previousLevel: number;
    newLevel: number;
    totalExp: number;
  } | null;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  levelUpData,
  onClose,
}) => {
  useEffect(() => {
    if (!levelUpData) return;

    try {
      // Celebratory golden & sunset confetti burst for leveling up
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#FF7A00', '#FF5757', '#F59E0B', '#FBBF24', '#10B981'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0.15, y: 0.6 },
          colors: ['#FF7A00', '#FF5757', '#F59E0B'],
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 0.85, y: 0.6 },
          colors: ['#FF7A00', '#FF5757', '#F59E0B'],
        });
      }, 180);
    } catch (e) {
      console.debug('Confetti skipped', e);
    }
  }, [levelUpData]);

  return (
    <AnimatePresence>
      {levelUpData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-[#FDFBF7] dark:bg-[#1A1816] border border-[#FADCC0] dark:border-[#FF7A00]/40 p-6 sm:p-7 text-center shadow-2xl shadow-[#FF7A00]/20 overflow-hidden"
          >
            {/* Glowing radial aura */}
            <div
              className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gradient-to-b from-[#FF7A00]/25 via-[#FF5757]/10 to-transparent blur-3xl"
              aria-hidden="true"
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/80 dark:bg-[#262320] border border-[#EDE6D8] dark:border-[#36312C] text-[#736C61] dark:text-[#A69E93] hover:text-[#2C2C2C] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close level up popup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Level Emblem */}
            <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF7A00] via-[#FF6224] to-[#FF5757] text-white flex flex-col items-center justify-center shadow-xl shadow-[#FF7A00]/35 ring-4 ring-[#FF7A00]/20">
              <Trophy className="w-8 h-8 mb-0.5 drop-shadow-xs" />
              <span className="text-[11px] font-extrabold font-['Outfit'] tracking-wider uppercase">
                LVL {levelUpData.newLevel}
              </span>
            </div>

            {/* Kicker & Title */}
            <div className="relative mt-5 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF7A00]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Level Up Milestone Reached!</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tracking-tight">
                Level {levelUpData.newLevel} Unlocked!
              </h3>

              <p className="text-sm text-[#736C61] dark:text-[#A69E93]">
                New Rank Title:{' '}
                <strong className="font-bold text-[#2C2C2C] dark:text-white">
                  {getRankTitle(levelUpData.newLevel)}
                </strong>
              </p>
            </div>

            {/* Stats summary box */}
            <div className="relative mt-5 p-4 rounded-2xl bg-white dark:bg-[#221F1C] border border-[#EDE6D8] dark:border-[#332E29] grid grid-cols-2 gap-3 text-left">
              <div>
                <p className="text-[11px] font-semibold text-[#9B9386] dark:text-[#8C8479]">
                  Total Lifetime EXP
                </p>
                <p className="text-lg font-extrabold font-['Outfit'] text-[#FF7A00] tabular-nums flex items-center gap-1 mt-0.5">
                  <Zap className="w-4 h-4 fill-current" />
                  <span>{levelUpData.totalExp} EXP</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#9B9386] dark:text-[#8C8479]">
                  Next Level Target
                </p>
                <p className="text-lg font-extrabold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums flex items-center gap-1 mt-0.5">
                  <ArrowUpRight className="w-4 h-4 text-[#FF5757]" />
                  <span>{getExpRequiredForLevel(levelUpData.newLevel)} EXP</span>
                </p>
              </div>
            </div>

            <p className="relative mt-4 text-xs text-[#736C61] dark:text-[#A69E93] leading-relaxed">
              Each new level scales progressively, challenging your consistency as your daily habits compound!
            </p>

            {/* Primary CTA */}
            <button
              onClick={onClose}
              className="relative mt-5 w-full py-3 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#FF7A00] to-[#FF5757] hover:from-[#E86B00] hover:to-[#E64848] shadow-lg shadow-[#FF7A00]/30 active:scale-98 transition-all cursor-pointer"
            >
              Keep Crushing SquadGoals!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
