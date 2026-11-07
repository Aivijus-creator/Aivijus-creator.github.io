import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fmt, useT } from '../i18n';
import { PageFade } from '../components/ui';
import { BallStage } from '../components/BallStage';
import { Court, type Arrow, type OverlapLine } from '../components/Court';
import { MiniCourt } from './MiniCourt';
import { withGone } from './SystemPage';
import { SYSTEMS } from '../data/systems';
import { setterZone51 } from '../data/system51';
import { ROLE_BADGE } from '../data/roles';
import { DEFAULT_META, toCourtPlayer } from '../components/view';
import { displayRole, nextMove, rotationName, whyHere } from '../logic/explain';
import { evaluateOverlap } from '../logic/overlap';
import type { Phase, PlayerId, SystemId } from '../data/types';
import type { Dict } from '../i18n/en';

const SYS: SystemId[] = ['5-1', '6-2', '4-2'];

/** True while the media query matches; the ball mounts in one slot only (one WebGL context). */
function useWide(q = '(min-width: 1280px)') {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setOn(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, [q]);
  return on;
}

/** The players of a system at rotation k and phase, ready for <Court>. */
function courtPlayers(t: Dict, sys: SystemId, k: number, phase: Phase, selectedId: PlayerId | null = null) {
  const S = SYSTEMS[sys];
  const all: PlayerId[] = [...S.lineup, ...(S.hasLibero ? (['L'] as PlayerId[]) : [])];
  const f = S.formation(k, phase);
  const shown = withGone(f, all, S.lineup, k);
  return {
    formation: f,
    players: shown.map((p) => toCourtPlayer(p, { t, sys, k, phase, labelMode: 'role', meta: DEFAULT_META, showIcons: false, selectedId })),
  };
}

/** The live window in the hero: the six 5-1 rotations, the court and the overlap check, all from the real data. */
function HeroWindow() {
  const { t } = useT();
  const S = SYSTEMS['5-1'];
  const [k, setK] = useState(0);
  const [phase, setPhase] = useState<Phase>('receive');
  const [sel, setSel] = useState<PlayerId>(S.settingSetter(0));
  const { formation, players } = courtPlayers(t, '5-1', k, phase, sel);
  const p = formation.find((q) => q.id === sel) ?? formation[0];
  const arrows: Arrow[] = [];
  const nm = nextMove(t, '5-1', k, phase, p);
  if (nm.to) arrows.push({ key: 'sel', from: p, to: nm.to });
  const checkPhase = phase === 'receive' || phase === 'serve';
  const results = checkPhase ? evaluateOverlap(formation, phase === 'serve').filter((r) => !r.skipped) : [];
  const overlap: OverlapLine[] = results.map((r) => {
    const a = formation.find((q) => q.zone === r.rule.a)!;
    const b = formation.find((q) => q.zone === r.rule.b)!;
    return { key: `${r.rule.a}-${r.rule.b}`, a, b, ok: r.ok, label: `${r.rule.a}·${r.rule.b}` };
  });
  const dr = displayRole('5-1', k, p);
  const badge = ROLE_BADGE[dr === 'setterHitter' ? 'opp' : (players.find((q) => q.id === p.id)?.kind ?? 'setter')];
  const phases: Phase[] = ['receive', 'attack', 'defense'];

  return (
    <div className="h-win" role="group" aria-label={t.home.windowLabel}>
      <div className="h-win__bar">
        <span className="h-win__dots" aria-hidden><i /><i /><i /></span>
        <span><b>{t.home.winTitle}</b> · {t.ui.rotation} {rotationName(k).slice(1)}</span>
        <span className="h-seg" role="group" aria-label={t.ui.rotation}>
          {phases.map((ph) => (
            <button key={ph} type="button" aria-pressed={phase === ph} onClick={() => setPhase(ph)}>{t.phaseShort[ph]}</button>
          ))}
        </span>
      </div>
      <div className="h-win__body">
        <div className="h-rl">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" aria-pressed={k === i} onClick={() => { setK(i); setSel(S.settingSetter(i)); }}>
              <i>{rotationName(i)}</i>
              <span><b>{t.ui.rotation} {rotationName(i).slice(1)}</b>{fmt(t.home.setterIn, { z: setterZone51(i) })}</span>
            </button>
          ))}
        </div>
        <div className="h-court">
          <Court players={players} arrows={arrows} overlap={overlap} showZoneBadge ariaLabel={`5-1 ${rotationName(k)} ${t.phase[phase]}`}
            onPlayerTap={(id) => setSel(id)} />
        </div>
        <div className="h-side">
          <div className="h-who">
            <span className="h-chip" style={{ background: badge.bg, color: badge.fg, border: badge.border ? `2px solid ${badge.border}` : undefined }}>{t.code[p.id]}</span>
            <div><b>{t.roleName[dr]}</b><small>{t.ui.zone} {p.zone} · {t.phaseShort[phase]}</small></div>
          </div>
          <p className="h-why">{whyHere(t, '5-1', k, phase, p)}</p>
          {checkPhase && (
            <>
              <p className="h-h">{t.home.overlapPairs}</p>
              <ul className="h-list">
                {results.map((r) => (
                  <li key={`${r.rule.a}-${r.rule.b}`}>
                    <span>{t.ui.zone} {r.rule.a} · {r.rule.b}</span>
                    <span className={r.ok ? 'ok' : 'bad'}>{r.ok ? t.home.legal : t.quiz.fault}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="h-h">{nm.text}</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useT();
  const H = t.home;
  const wide = useWide();
  const setter = SYSTEMS['5-1'].formation(0, 'receive').find((p) => p.id === SYSTEMS['5-1'].settingSetter(0))!;
  return (
    <PageFade>
      <div className="home">
        <section className="h-hero" aria-labelledby="hero-h">
          <div className="wrap">
            <div className="h-hero__c">
              {!wide && <div className="h-ball-sm"><BallStage design="molten" label={H.dragBall} /></div>}
              <Link className="h-pill" to="/compare"><b>{H.pill}</b><span>{H.pillMore}</span></Link>
              <h1 id="hero-h">{H.title}</h1>
              <p className="lead">{H.lead}</p>
              <div className="btn-row">
                <Link className="btn" to="/5-1">{H.cta}</Link>
                <Link className="btn btn--ghost" to="/rules">{H.rulesCta}</Link>
              </div>
            </div>
            <div className="h-frame">
              <HeroWindow />
              {wide && <div className="h-ball"><BallStage design="molten" label={H.dragBall} /></div>}
            </div>
          </div>
        </section>

        <section className="h-section" aria-labelledby="sys-h">
          <div className="wrap">
            <div className="h-head">
              <h2 id="sys-h">{H.sysTitle}</h2>
              <p>{H.sysLead}</p>
            </div>
            <div className="h-cards">
              {SYS.map((s) => (
                <Link key={s} to={`/${s}`} className="h-card">
                  <div className="h-card__head">
                    <span className="h-card__num">{s}</span>
                    <span className="h-card__go">{fmt(H.open, { s })} →</span>
                  </div>
                  <p>{H.cards[s]}</p>
                  <div className="h-card__court">
                    <Court players={courtPlayers(t, s, 0, 'receive').players} showZoneBadge={false} ariaLabel={`${s} ${rotationName(0)} ${t.phase.receive}`} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="h-section" aria-labelledby="explain-h">
          <div className="wrap h-split">
            <div className="h-split__text">
              <h2 id="explain-h">{H.explainTitle}</h2>
              <p className="lead">{H.explainLead}</p>
              <ul className="h-facts">{H.explainFacts.map((f) => <li key={f}>{f}</li>)}</ul>
              <Link className="link" to="/rules">{H.explainLink}</Link>
            </div>
            <div className="h-split__frame">
              <div className="court-wrap"><MiniCourt /></div>
            </div>
          </div>
        </section>

        <section className="h-section h-band" aria-labelledby="steps-h">
          <div className="wrap">
            <h2 id="steps-h">{H.stepsTitle}</h2>
            <div className="h-steps">
              {H.steps.map((s, i) => (
                <article key={s.title} className="h-step">
                  <div className="h-step__text">
                    <span className="h-step__num">{i + 1}</span>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                  <div className="h-step__panel" aria-hidden>
                    {i === 0 && (
                      <div className="h-mini">
                        <div className="h-mini__bar">{H.stepPick}</div>
                        <div className="h-mini__body">
                          <div className="seg">{SYS.map((x) => <button key={x} type="button" tabIndex={-1} aria-pressed={x === '5-1'}>{x}</button>)}</div>
                          <div className="rotsel">{[0, 1, 2, 3, 4, 5].map((r) => <button key={r} type="button" tabIndex={-1} aria-pressed={r === 0}>{rotationName(r)}</button>)}</div>
                        </div>
                      </div>
                    )}
                    {i === 1 && (
                      <div className="h-mini">
                        <div className="h-mini__body">
                          <div className="h-who">
                            <span className="h-chip" style={{ background: ROLE_BADGE.setter.bg, color: ROLE_BADGE.setter.fg }}>{t.code[setter.id]}</span>
                            <div><b>{t.roleName.setter}</b><small>5-1 · {t.ui.rotation} 1 · {t.ui.zone} {setter.zone}</small></div>
                          </div>
                          <p className="h-why">{whyHere(t, '5-1', 0, 'receive', setter)}</p>
                        </div>
                      </div>
                    )}
                    {i === 2 && (
                      <div className="h-mini">
                        <div className="h-mini__body">
                          {H.stepMoves.map((m, j) => (
                            <div key={m} className="h-note">
                              <i style={{ background: [ROLE_BADGE.setter.bg, ROLE_BADGE.opp.bg, '#fff'][j], color: [ROLE_BADGE.setter.fg, ROLE_BADGE.opp.fg, '#B3122E'][j] }}>
                                {[t.code.S, t.code.OPP, t.code.L][j]}
                              </i>
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="h-section" aria-labelledby="faq-h">
          <div className="wrap h-split">
            <div className="h-faq-side">
              <h2 id="faq-h">{H.faqTitle}</h2>
              <p>{H.faqLead}</p>
              <Link className="link" to="/rules">{H.faqLink}</Link>
            </div>
            <div className="faq h-faq-list">
              {H.faq.map(([q, a]) => (
                <div key={q} className="faq__item"><h3>{q}</h3><p>{a}</p></div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageFade>
  );
}
