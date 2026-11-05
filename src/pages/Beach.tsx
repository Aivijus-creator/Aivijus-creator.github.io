import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useT } from '../i18n';
import { PageFade, sleep } from '../components/ui';
import { BallStage } from '../components/BallStage';
import { Court, type CourtPlayer } from '../components/Court';
import { BallFlight, type FlightSeg } from '../components/Ball2D';
import { beachRally, initialBeach, isSideSwitch, type BeachState } from '../logic/beach';
import type { PlayerId, Pose } from '../data/types';

const BLUE = '#0B3D6E';

function bp(id: PlayerId, label: string, x: number, y: number, pose: Pose = 'ready', extra: Partial<CourtPlayer> = {}): CourtPlayer {
  return { id, zone: 1, x, y, pose, label, badge: label, kind: 'oh', ariaLabel: label, ...extra };
}

/** Beach court wrapper (8 × 8, no attack line, no zones). */
function BeachCourt(props: { players: CourtPlayer[]; opponents?: CourtPlayer[]; overlay?: React.ReactNode; extra?: React.ReactNode; label: string }) {
  return (
    <div className="court-wrap" style={{ maxWidth: 420 }}>
      <Court beach hideZones showZoneBadge={false} players={props.players} opponents={props.opponents} overlay={props.overlay} extra={props.extra} ariaLabel={props.label} />
    </div>
  );
}

function Splash({ x, y }: { x: number; y: number }) {
  return (
    <g pointerEvents="none">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <motion.circle key={i} cx={x} cy={y} r={0.06} fill="#D9BE86" initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: Math.cos(a) * 0.45, y: Math.sin(a) * 0.25 - 0.15, opacity: 0 }} transition={{ duration: 0.3 }} />
        );
      })}
    </g>
  );
}

function ServeOrder() {
  const { t } = useT();
  const [s, setS] = useState<BeachState>(initialBeach);
  const B = t.beach;
  const players = [
    bp('OH1', 'A', 2.2, s.serving === 'us' && s.ourServer === 'A' ? 8.7 : 5.5, s.serving === 'us' && s.ourServer === 'A' ? 'serve' : 'ready'),
    bp('OH2', 'B', 5.8, s.serving === 'us' && s.ourServer === 'B' ? 8.7 : 5.5, s.serving === 'us' && s.ourServer === 'B' ? 'serve' : 'ready'),
  ];
  return (
    <div>
      <div className="scoreboard" aria-live="polite">
        <div><small>{B.usLabel}</small>{s.us}</div>
        <span className="muted">:</span>
        <div><small>{B.themLabel}</small>{s.them}</div>
      </div>
      <p style={{ textAlign: 'center', margin: '6px 0' }}>
        🏐 {s.serving === 'us' ? `${B.usLabel} — ${s.ourServer}` : B.themLabel} {B.serving}
      </p>
      <BeachCourt players={players} label={B.rotTitle} opponents={s.serving === 'them' ? [bp('MB1', '', 4, -3.0, 'serve')] : []} />
      <div className="toolbar" style={{ justifyContent: 'center' }}>
        <button className="btn btn--small" disabled={s.serving === 'us'} onClick={() => setS(beachRally(s, 'us'))}>{B.winBack}</button>
        <button className="btn btn--small btn--ghost" disabled={s.serving === 'them'} onClick={() => setS(beachRally(s, 'us'))}>{B.winServing}</button>
        <button className="btn btn--small btn--ghost" onClick={() => setS(beachRally(s, 'them'))}>{B.loseRally}</button>
      </div>
    </div>
  );
}

function RallyDemo() {
  const { t } = useT();
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0); // 0 ready, 1 pass, 2 set, 3 attack, 4 done
  const [flight, setFlight] = useState<{ key: number; segs: FlightSeg[] } | null>(null);
  const [splash, setSplash] = useState<{ x: number; y: number; k: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const passer = { x: 2.2, y: 5.6 };
  const setSpot = { x: 4, y: 1.6 };
  const hit = { x: 3.0, y: 0.7 };
  const land = { x: 6.2, y: -2.6 };
  const run = async () => {
    if (busy) return;
    setBusy(true);
    setSplash(null);
    setStage(0);
    if (reduce) {
      setStage(4);
      setBusy(false);
      return;
    }
    setFlight({
      key: Date.now(),
      segs: [
        { from: { x: 5, y: -3.1 }, to: passer, height: 3.2, duration: 0.9 },
        { from: passer, to: setSpot, height: 2.6, duration: 1.0 },
        { from: setSpot, to: hit, height: 2.0, duration: 0.8 },
        { from: hit, to: land, height: 0.25, duration: 0.35 },
      ],
    });
    await sleep(820);
    setStage(1);
    await sleep(1000);
    setStage(2);
    await sleep(700);
    setStage(3);
    await sleep(480);
    setSplash({ ...land, k: Date.now() });
    await sleep(400);
    setFlight(null);
    setStage(4);
    setBusy(false);
  };
  const A = stage >= 2 ? hit : passer;
  const players = [
    bp('OH1', 'A', A.x, A.y + (stage >= 2 ? 0.2 : 0), stage === 1 ? 'pass' : stage === 3 ? 'attack' : stage === 2 ? 'run' : 'ready'),
    bp('OH2', 'B', stage >= 1 ? setSpot.x + 0.3 : 5.8, stage >= 1 ? setSpot.y + 0.3 : 5.6, stage === 2 ? 'pass' : stage === 1 ? 'run' : 'ready'),
  ];
  const steps = t.beach.rallySteps;
  return (
    <div>
      <BeachCourt players={players} label={t.beach.rallyTitle} opponents={[bp('MB1', '', 3, -2.2), bp('MB2', '', 5.6, -2.0)]}
        overlay={flight ? <BallFlight key={flight.key} segs={flight.segs} design="beachPro" /> : null}
        extra={splash ? <Splash key={splash.k} x={splash.x} y={splash.y} /> : null} />
      <ol className="bullets" style={{ marginTop: 10 }}>
        {steps.map((s, i) => (
          <li key={s} style={{ fontWeight: stage === i + 1 || (stage === 4 && i === 3) ? 700 : 400 }}>{s}</li>
        ))}
      </ol>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button className="btn" onClick={run} disabled={busy}>▶ {t.ui.play}</button>
      </div>
    </div>
  );
}

type Signal = 'one' | 'two' | 'fist' | 'open';

function Hand({ s }: { s: Signal }) {
  const fingers = s === 'one' ? [1] : s === 'two' ? [1, 2] : s === 'open' ? [0, 1, 2, 3, 4] : [];
  return (
    <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden>
      <rect x="9" y="17" width="20" height="17" rx="7" fill="#F2C9A0" stroke={BLUE} strokeWidth="1.6" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={10 + i * 5} y={fingers.includes(i + 1) || (s === 'open' && i < 4) ? 4 : 13} width="4.4" height={fingers.includes(i + 1) || (s === 'open' && i < 4) ? 15 : 7} rx="2.2" fill="#F2C9A0" stroke={BLUE} strokeWidth="1.4" />
      ))}
      <rect x={s === 'open' ? 2 : 6} y="21" width="9" height="4.4" rx="2.2" fill="#F2C9A0" stroke={BLUE} strokeWidth="1.4" transform={s === 'open' ? 'rotate(-30 6 23)' : undefined} />
    </svg>
  );
}

function Signals() {
  const { t } = useT();
  const [s, setS] = useState<Signal>('one');
  const B = t.beach;
  const blocker = s === 'fist' ? { x: 5.4, y: 3.2, pose: 'ready' as Pose } : { x: 6.3, y: 0.45, pose: 'block' as Pose };
  const defender = s === 'one' ? { x: 2.2, y: 5.4 } : s === 'two' ? { x: 7.2, y: 6.4 } : s === 'fist' ? { x: 2.8, y: 6.2 } : { x: 4, y: 6.4 };
  const shade =
    s === 'one' ? 'M 5.6 0 L 8 0 L 8 8 L 6.6 8 Z' : s === 'two' ? 'M 5.6 0 L 6.9 0 L 2.2 8 L 0 8 L 0 6.2 Z' : s === 'open' ? 'M 5.7 0 L 7 0 L 5.4 8 L 3.4 8 Z' : '';
  return (
    <div>
      <div className="signal-grid" role="group" aria-label={B.defTitle}>
        {(['one', 'two', 'fist', 'open'] as Signal[]).map((k) => (
          <button key={k} aria-pressed={s === k} onClick={() => setS(k)}>
            <Hand s={k} />
            {B.signals[k]}
          </button>
        ))}
      </div>
      <p className="sun-card" style={{ margin: '10px 0' }}><b>{B.signals[s]}:</b> {B.signalText[s]}</p>
      <BeachCourt label={B.defTitle}
        players={[bp('MB1', 'B', blocker.x, blocker.y, blocker.pose), bp('OH1', 'D', defender.x, defender.y, 'ready')]}
        opponents={[bp('OPP', '', 6.6, -0.9, 'attack')]}
        extra={shade ? <motion.path key={s} d={shade} fill="var(--accent-500)" initial={{ opacity: 0 }} animate={{ opacity: 0.22 }} pointerEvents="none" /> : null} />
    </div>
  );
}

function SideSwitch() {
  const { t } = useT();
  const [set, setSet] = useState<1 | 2 | 3>(1);
  const [pts, setPts] = useState(0);
  const [flip, setFlip] = useState(false);
  const [msg, setMsg] = useState(false);
  const add = () => {
    const n = pts + 1;
    setPts(n);
    if (isSideSwitch(n, set)) {
      setFlip((f) => !f);
      setMsg(true);
      window.setTimeout(() => setMsg(false), 1600);
    }
  };
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="seg" style={{ marginBottom: 10 }}>
        {[1, 2, 3].map((n) => (
          <button key={n} aria-pressed={set === n} onClick={() => { setSet(n as 1 | 2 | 3); setPts(0); setFlip(false); }}>Set {n}</button>
        ))}
      </div>
      <div className="scoreboard"><div><small>Σ</small>{pts}</div></div>
      <motion.svg viewBox="-1 -9 10 18" width="140" style={{ display: 'block', margin: '8px auto' }} animate={{ rotate: flip ? 180 : 0 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
        <rect x={0} y={-8} width={8} height={16} fill="var(--sand)" stroke={BLUE} strokeWidth={0.15} />
        <line x1={-0.6} y1={0} x2={8.6} y2={0} stroke="var(--net)" strokeWidth={0.3} />
        <circle cx={2.5} cy={4} r={0.7} fill="var(--accent-700)" />
        <circle cx={5.5} cy={4} r={0.7} fill="var(--accent-700)" />
        <circle cx={2.5} cy={-4} r={0.7} fill="#9a98a0" />
        <circle cx={5.5} cy={-4} r={0.7} fill="#9a98a0" />
        <text x={-0.5} y={-6.5} fontSize={1.5}>☀️</text>
      </motion.svg>
      <div style={{ minHeight: 28, fontFamily: 'var(--f-label)', textTransform: 'uppercase', color: 'var(--accent-700)' }}>{msg ? t.beach.switchNow : ''}</div>
      <button className="btn btn--sun" onClick={add}>+1 {t.beach.switchDemo}</button>
    </div>
  );
}

export default function Beach() {
  const { t } = useT();
  const B = t.beach;
  return (
    <div data-theme-scope="beach">
      <PageFade>
        <div className="page">
          <div className="beach-hero">
            <div>
              <p className="kicker">🏖 2×2</p>
              <h1 className="bar">{B.title}</h1>
              <p style={{ fontSize: 18, margin: 0, fontWeight: 500 }}>{B.lead}</p>
            </div>
            <BallStage design="beachPro" label={t.home.dragBall} size={300} />
          </div>

          <section>
            <h2 className="bar">{B.diffTitle}</h2>
            <div className="table-wrap">
              <table className="t">
                <thead><tr>{B.diffHead.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {B.diff.map((r) => (
                    <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td><b>{r[2]}</b></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid--2" style={{ alignItems: 'start' }}>
            <div>
              <h2 className="bar">{B.rotTitle}</h2>
              <ul className="bullets">{B.rot.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <ServeOrder />
          </section>

          <section className="grid grid--2" style={{ alignItems: 'center' }}>
            <div>
              <h2 className="bar">{B.posTitle}</h2>
              <ul className="bullets">{B.pos.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <BeachCourt label={B.posTitle} players={[bp('OH1', 'A', 2, 5.5), bp('OH2', 'B', 6, 5.5)]} />
          </section>

          <section className="grid grid--2" style={{ alignItems: 'start' }}>
            <div>
              <h2 className="bar">{B.rallyTitle}</h2>
              <p className="sun-card"><b>{B.rallyCaption}</b></p>
            </div>
            <RallyDemo />
          </section>

          <section className="grid grid--2" style={{ alignItems: 'start' }}>
            <div>
              <h2 className="bar">{B.defTitle}</h2>
              <ul className="bullets">{B.def.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <Signals />
          </section>

          <section>
            <h2 className="bar">{B.keyTitle}</h2>
            <div className="grid grid--2" style={{ alignItems: 'start' }}>
              <div className="grid" style={{ gap: 8 }}>
                {B.key.map((x) => <div key={x} className="card" style={{ padding: '10px 14px' }}>✔ {x}</div>)}
              </div>
              <SideSwitch />
            </div>
          </section>

          <section>
            <h2 className="bar">{B.tipsTitle}</h2>
            <div className="grid grid--3">
              {B.tips.map((x) => <div key={x} className="sun-card">{x}</div>)}
            </div>
          </section>
        </div>
      </PageFade>
    </div>
  );
}
