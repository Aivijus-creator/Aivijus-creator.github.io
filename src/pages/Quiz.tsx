import { useMemo, useState } from 'react';
import { useT } from '../i18n';
import { PageFade, Seg } from '../components/ui';
import { Court } from '../components/Court';
import { SYSTEMS, SYSTEM_IDS } from '../data/systems';
import { checkOverlap } from '../logic/overlap';
import { toCourtPlayer, DEFAULT_META } from '../components/view';
import { SETTER_TARGET } from '../data/zones';
import type { Formation, Spot } from '../data/types';

/** Make a formation that is either legal (as given) or broken by swapping one overlap pair. */
function makeQuestion(seed: number): { f: Formation; legal: boolean; sys: (typeof SYSTEM_IDS)[number]; k: number } {
  const rnd = (n: number) => Math.floor(Math.abs(Math.sin(seed * 99.13 + n * 7.7)) * 1000);
  const sys = SYSTEM_IDS[rnd(1) % 3];
  const k = rnd(2) % 6;
  const f = SYSTEMS[sys].formation(k, 'receive').map((p) => ({ ...p }));
  const legal = rnd(3) % 2 === 0;
  if (!legal) {
    const pairs: [number, number, 'x' | 'y'][] = [[2, 1, 'y'], [3, 6, 'y'], [4, 5, 'y'], [4, 3, 'x'], [3, 2, 'x'], [5, 6, 'x'], [6, 1, 'x']];
    const [a, b, ax] = pairs[rnd(4) % pairs.length];
    const pa = f.find((p) => p.zone === a)!;
    const pb = f.find((p) => p.zone === b)!;
    // move a just past b on that axis
    pa[ax] = pb[ax] + 0.4;
  }
  return { f, legal: checkOverlap(f, false).length === 0, sys, k };
}

export default function Quiz() {
  const { t } = useT();
  const [mode, setMode] = useState<'a' | 'b'>('a');
  const [n, setN] = useState(1);
  const [answer, setAnswer] = useState<null | boolean>(null);
  const [tap, setTap] = useState<Spot | null>(null);
  const [score, setScore] = useState(0);
  const q = useMemo(() => makeQuestion(n), [n]);
  const next = () => {
    setN(n + 1);
    setAnswer(null);
    setTap(null);
  };
  const players = q.f.map((p) => toCourtPlayer(p, { t, sys: q.sys, k: q.k, phase: 'receive', labelMode: 'role', meta: DEFAULT_META, showIcons: false }));
  const tapOk = tap ? Math.hypot(tap.x - SETTER_TARGET.x, tap.y - SETTER_TARGET.y) < 1.3 : false;
  return (
    <PageFade>
      <div className="page" style={{ maxWidth: 640 }}>
        <p className="kicker">{t.nav.quiz} · {t.quiz.score}: {score}</p>
        <h1 className="bar">{t.quiz.title}</h1>
        <Seg value={mode} onChange={(m) => { setMode(m); next(); }} items={[{ id: 'a', label: t.quiz.modeA }, { id: 'b', label: t.quiz.modeB }]} />
        <h3 style={{ marginTop: 18 }}>{mode === 'a' ? t.quiz.q1 : t.quiz.q2}</h3>
        <div className="court-wrap" style={{ marginTop: 8 }}>
          <Court
            players={mode === 'a' ? players : players.filter((p) => !p.id.startsWith('S'))}
            showZoneBadge
            overlap={[]}
            showTarget={mode === 'b' && tap ? SETTER_TARGET : null}
            onBackgroundTap={(_, pt) => {
              if (mode !== 'b' || tap) return;
              setTap(pt);
              if (Math.hypot(pt.x - SETTER_TARGET.x, pt.y - SETTER_TARGET.y) < 1.3) setScore((s) => s + 1);
            }}
            extra={tap ? <circle cx={tap.x} cy={tap.y} r={0.18} fill={tapOk ? 'var(--ok)' : '#E5533D'} /> : null}
          />
        </div>
        {mode === 'a' ? (
          <>
            <div className="quiz-actions">
              {[true, false].map((v) => (
                <button key={String(v)} className={`btn ${v ? '' : 'btn--ghost'}`} disabled={answer !== null}
                  onClick={() => { setAnswer(v); if (v === q.legal) setScore((s) => s + 1); }}>
                  {v ? t.quiz.legal : t.quiz.fault}
                </button>
              ))}
            </div>
            {answer !== null && (
              <div className="result" style={{ color: answer === q.legal ? 'var(--ok)' : '#E5533D' }}>
                {answer === q.legal ? t.quiz.correct : t.quiz.wrong} ({q.legal ? t.quiz.legal : t.quiz.fault})
              </div>
            )}
          </>
        ) : (
          tap && <div className="result" style={{ color: tapOk ? 'var(--ok)' : '#E5533D' }}>{tapOk ? t.quiz.nice : t.quiz.miss}</div>
        )}
        {(answer !== null || tap) && (
          <div className="quiz-actions"><button className="btn" onClick={next}>{t.quiz.next} →</button></div>
        )}
      </div>
    </PageFade>
  );
}
