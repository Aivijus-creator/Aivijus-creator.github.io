import { useEffect, useState } from 'react';
import { useReducedMotion } from '../components/motion';
import { useT } from '../i18n';
import { Court, type CourtPlayer } from '../components/Court';
import { SYSTEMS } from '../data/systems';
import { toCourtPlayer, DEFAULT_META } from '../components/view';
import { withGone } from './SystemPage';
import type { PlayerId } from '../data/types';

/** Small self-running court: 5-1 serve receive, rotating every few seconds. */
export function MiniCourt({ interval = 3200 }: { interval?: number }) {
  const { t } = useT();
  const reduce = useReducedMotion();
  const [k, setK] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setK((x) => (x + 1) % 6), interval);
    return () => window.clearInterval(id);
  }, [reduce, interval]);
  const S = SYSTEMS['5-1'];
  const all: PlayerId[] = [...S.lineup, 'L'];
  const f = withGone(S.formation(k, 'receive'), all, S.lineup, k);
  const players: CourtPlayer[] = f.map((p) => toCourtPlayer(p, { t, sys: '5-1', k, phase: 'receive', labelMode: 'role', meta: DEFAULT_META, showIcons: false }));
  return <Court players={players} showZoneBadge ariaLabel="5-1" />;
}
