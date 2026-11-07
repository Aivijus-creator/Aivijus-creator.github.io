import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Trophy, Crown, RefreshCw, Link2, Check, Users } from 'lucide-react';
import { Avatar } from './Avatar';
import {
  Account,
  LeaderboardRow,
  LiveStatus,
  fetchLeaderboard,
  subscribeToLeaderboard,
} from '../lib/cloud';
import { getLevelProgress } from '../utils/gamification';

type SortMode = 'today' | 'total';

interface LeaderboardProps {
  supabase: SupabaseClient;
  account: Account;
  todayStr: string;
  /** The signed-in user's live numbers, shown instantly before the server round-trip. */
  myTotalExp: number;
  myTodayExp: number;
}

interface RankedRow {
  id: string;
  name: string;
  level: number;
  rankTitle: string;
  totalExp: number;
  todayExp: number;
  isMe: boolean;
  rank: number;
}

const SORT_KEY = 'squadgoals_leaderboard_sort_v1';
const POLL_MS = 30000;

function readSort(): SortMode {
  try {
    return localStorage.getItem(SORT_KEY) === 'total' ? 'total' : 'today';
  } catch {
    return 'today';
  }
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  supabase,
  account,
  todayStr,
  myTotalExp,
  myTodayExp,
}) => {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [sortMode, setSortMode] = useState<SortMode>(readSort);
  const [copied, setCopied] = useState(false);
  const refetchTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchLeaderboard(supabase);
      setRows(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, [supabase]);

  // Coalesce bursts of realtime events into one refetch.
  const scheduleRefetch = useCallback(() => {
    if (refetchTimer.current) return;
    refetchTimer.current = window.setTimeout(() => {
      refetchTimer.current = null;
      void load();
    }, 400);
  }, [load]);

  useEffect(() => {
    void load();
    const unsubscribe = subscribeToLeaderboard(supabase, scheduleRefetch, (s) => {
      setStatus(s);
      if (s === 'live') scheduleRefetch(); // catch anything missed while connecting
    });
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
      if (refetchTimer.current) window.clearTimeout(refetchTimer.current);
      refetchTimer.current = null;
    };
  }, [supabase, load, scheduleRefetch]);

  // Fallback polling whenever the realtime channel is not connected.
  useEffect(() => {
    if (status === 'live') return;
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [status, load]);

  useEffect(() => {
    try {
      localStorage.setItem(SORT_KEY, sortMode);
    } catch {
      /* ignore */
    }
  }, [sortMode]);

  const ranked: RankedRow[] = useMemo(() => {
    if (!rows) return [];
    const list = rows.map((r) => ({
      id: r.id,
      name: r.display_name,
      totalExp: r.total_exp,
      todayExp: r.exp_date === todayStr ? r.today_exp : 0,
      isMe: r.id === account.userId,
    }));
    const mine = { id: account.userId, name: account.displayName, totalExp: myTotalExp, todayExp: myTodayExp, isMe: true };
    const idx = list.findIndex((r) => r.isMe);
    if (idx >= 0) list[idx] = mine;
    else list.push(mine);

    const primary = (r: (typeof list)[number]) => (sortMode === 'today' ? r.todayExp : r.totalExp);
    const secondary = (r: (typeof list)[number]) => (sortMode === 'today' ? r.totalExp : r.todayExp);
    list.sort(
      (a, b) =>
        primary(b) - primary(a) || secondary(b) - secondary(a) || a.name.localeCompare(b.name)
    );

    let prev: (typeof list)[number] | null = null;
    let rank = 0;
    return list.map((r, i) => {
      if (!prev || primary(prev) !== primary(r) || secondary(prev) !== secondary(r)) rank = i + 1;
      prev = r;
      const lp = getLevelProgress(r.totalExp);
      return { ...r, level: lp.level, rankTitle: lp.rankTitle, rank };
    });
  }, [rows, todayStr, account, myTotalExp, myTodayExp, sortMode]);

  const myRank = ranked.find((r) => r.isMe)?.rank;
  const canShareLink = /^https?:$/.test(window.location.protocol);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + window.location.pathname);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <section
      aria-labelledby="leaderboard-title"
      className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#1A1816]/90 backdrop-blur-md border border-[#EDE6D8] dark:border-[#2C2825] p-5 sm:p-6 shadow-md shadow-[#2C2C2C]/[0.04] dark:shadow-black/30 transition-colors duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#FF7A00] text-white flex items-center justify-center shadow-md shadow-[#FF7A00]/25 shrink-0">
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <h3 id="leaderboard-title" className="text-sm sm:text-base font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] leading-tight">
              Squad Leaderboard
            </h3>
            <p className="text-[11px] text-[#736C61] dark:text-[#A39B8F] truncate">
              {myRank ? `You’re #${myRank} ` : ''}
              {sortMode === 'today' ? 'by EXP collected today' : 'by all-time EXP'}
            </p>
          </div>
        </div>
        <LiveBadge status={status} onRefresh={() => void load()} />
      </div>

      {/* Sort toggle */}
      <div
        role="radiogroup"
        aria-label="Rank by"
        className="mt-4 grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F2EDE2]/90 dark:bg-[#1E1C19] border border-[#E6DEC8]/60 dark:border-[#2E2A25]"
      >
        {(
          [
            { id: 'today', label: 'Today’s EXP' },
            { id: 'total', label: 'Total EXP' },
          ] as const
        ).map((opt) => {
          const active = sortMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSortMode(opt.id)}
              className={`relative py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                active
                  ? 'text-[#2C2C2C] dark:text-[#F5F2EB]'
                  : 'text-[#736C61] dark:text-[#9E9589] hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="leaderboard-sort"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-white dark:bg-[#2B2723] rounded-lg shadow-xs border border-[#EDE6D8]/80 dark:border-[#3B3530]"
                />
              )}
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Column headings */}
      <div
        aria-hidden="true"
        className="mt-4 px-2.5 grid grid-cols-[1.75rem_minmax(0,1fr)_2.5rem_3.5rem_3.5rem] items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#9B9386] dark:text-[#7A7268]"
      >
        <span className="text-center">#</span>
        <span>Friend</span>
        <span className="text-center">Lvl</span>
        <span className={`text-right ${sortMode === 'today' ? 'text-[#FF7A00]' : ''}`}>Today</span>
        <span className={`text-right ${sortMode === 'total' ? 'text-[#FF7A00]' : ''}`}>Total</span>
      </div>

      {/* Rows */}
      {rows === null && !error ? (
        <div className="mt-2 space-y-2" aria-busy="true" aria-label="Loading leaderboard">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-[#F8F5EE] dark:bg-[#221F1C] animate-pulse" />
          ))}
        </div>
      ) : error && rows === null ? (
        <div className="mt-3 p-3 rounded-xl bg-[#FFEBEB] dark:bg-[#2D1618] border border-[#FFCCD0] dark:border-[#FF5757]/30 text-xs text-[#D93D3D] dark:text-[#FF8A8A] flex items-center justify-between gap-3">
          <span>Couldn’t load the leaderboard.</span>
          <button onClick={() => void load()} className="font-bold underline cursor-pointer">
            Retry
          </button>
        </div>
      ) : (
        <ol className="mt-2 space-y-1.5">
          <AnimatePresence initial={false}>
            {ranked.map((r) => (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className={`grid grid-cols-[1.75rem_minmax(0,1fr)_2.5rem_3.5rem_3.5rem] items-center gap-2 px-2.5 py-2 rounded-xl border ${
                  r.isMe
                    ? 'bg-[#FFF5EB] dark:bg-[#261B12] border-[#FADCC0] dark:border-[#FF7A00]/30'
                    : 'bg-[#FDFBF7] dark:bg-[#1F1C19] border-[#F2ECE1] dark:border-[#2A2622]'
                }`}
              >
                <RankBadge rank={r.rank} />
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={r.name} seed={r.id} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#2C2C2C] dark:text-[#F5F2EB] truncate">
                      {r.name}
                      {r.isMe && (
                        <span className="ml-1.5 px-1.5 py-px rounded-md bg-[#FF7A00] text-white text-[9px] font-bold align-middle">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-[#9B9386] dark:text-[#8C8479] truncate">{r.rankTitle}</p>
                  </div>
                </div>
                <span className="text-center text-xs font-bold font-['Outfit'] text-[#2C2C2C] dark:text-[#F5F2EB] tabular-nums">
                  <span className="sr-only">Level </span>
                  {r.level}
                </span>
                <span
                  className={`text-right text-xs font-bold font-['Outfit'] tabular-nums ${
                    r.todayExp > 0 ? 'text-[#FF7A00]' : 'text-[#B5AC9E] dark:text-[#5E574F]'
                  }`}
                >
                  <span className="sr-only">Today's EXP </span>
                  {r.todayExp > 0 ? `+${r.todayExp}` : '0'}
                </span>
                <span className="text-right text-xs font-semibold font-['Outfit'] text-[#736C61] dark:text-[#A39B8F] tabular-nums">
                  <span className="sr-only">Total EXP </span>
                  {r.totalExp.toLocaleString()}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}

      {/* Invite */}
      {rows !== null && ranked.length <= 1 && (
        <div className="mt-3 p-3 rounded-xl border border-dashed border-[#E6DEC8] dark:border-[#332E29] flex items-center gap-2.5 text-xs text-[#736C61] dark:text-[#A39B8F]">
          <Users className="w-4 h-4 text-[#FF7A00] shrink-0" />
          <span className="flex-1">It’s just you so far. Invite friends: they show up here as soon as they sign up.</span>
        </div>
      )}
      {canShareLink && (
        <div className="mt-3 pt-3 border-t border-[#F2ECE1] dark:border-[#262320] flex items-center justify-between text-xs">
          <span className="text-[#736C61] dark:text-[#A39B8F]">Grow the squad</span>
          <button
            onClick={copyInvite}
            className="inline-flex items-center gap-1.5 font-bold text-[#FF7A00] hover:text-[#FF5757] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            {copied ? 'Link copied!' : 'Copy invite link'}
          </button>
        </div>
      )}
    </section>
  );
};

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  const medal =
    rank === 1
      ? 'from-[#FBBF24] to-[#F59E0B] text-white shadow-[#F59E0B]/30'
      : rank === 2
      ? 'from-[#D6D3D1] to-[#A8A29E] text-white shadow-black/10'
      : rank === 3
      ? 'from-[#F0A46B] to-[#C2703D] text-white shadow-[#C2703D]/25'
      : '';
  return (
    <span className="flex items-center justify-center">
      <span className="sr-only">Rank </span>
      {medal ? (
        <span className={`w-6 h-6 rounded-full bg-gradient-to-br ${medal} shadow-sm flex items-center justify-center text-[10px] font-extrabold font-['Outfit']`}>
          {rank === 1 ? <Crown className="w-3.5 h-3.5" /> : rank}
        </span>
      ) : (
        <span className="text-xs font-bold font-['Outfit'] text-[#9B9386] dark:text-[#7A7268] tabular-nums">{rank}</span>
      )}
    </span>
  );
};

const LiveBadge: React.FC<{ status: LiveStatus; onRefresh: () => void }> = ({ status, onRefresh }) => {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#EEF8F1] dark:bg-[#13261B] border border-[#CDEED8] dark:border-[#10B981]/30 text-[10px] font-bold text-[#0E8F63] dark:text-[#34D399] shrink-0">
        <span className="relative flex w-2 h-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-60 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-[#10B981]" />
        </span>
        Live
      </span>
    );
  }
  return (
    <button
      onClick={onRefresh}
      title={status === 'connecting' ? 'Connecting to live updates…' : 'Live updates unavailable: refreshing every 30 seconds. Click to refresh now.'}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#F8F5EE] dark:bg-[#24211D] border border-[#EDE6D8] dark:border-[#332E29] text-[10px] font-bold text-[#736C61] dark:text-[#A39B8F] hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB] shrink-0 cursor-pointer"
    >
      <RefreshCw className={`w-3 h-3 ${status === 'connecting' ? 'animate-spin' : ''}`} />
      {status === 'connecting' ? 'Connecting' : 'Refresh'}
    </button>
  );
};
