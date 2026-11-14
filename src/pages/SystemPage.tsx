import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE } from 'react';
import { useReducedMotion } from '../components/motion';
import { fmt, useT } from '../i18n';
import type { AttackKind, Formation, Phase, Placed, PlayerId, Pose, SetterMode, SystemId, Zone } from '../data/types';
import { SYSTEMS } from '../data/systems';
import { HIT_SPOT, ZONE_CENTER, isFront } from '../data/zones';
import { setterZone51 } from '../data/system51';
import { Court, type Arrow, type CourtPlayer, type OverlapLine } from '../components/Court';
import { BallFlight, type FlightSeg } from '../components/Ball2D';
import { SidePanel, type SideTab } from '../components/SidePanel';
import { InfoPanel } from '../components/InfoPanel';
import { Legend } from '../components/Legend';
import { LineupWheel } from '../components/LineupWheel';
import { EditPlayers } from '../components/EditPlayers';
import { PageFade, Seg, Tabs, Toast, Toggle, sleep } from '../components/ui';
import { DEFAULT_META, toCourtPlayer, type LabelMode, type PlayersMeta } from '../components/view';
import { evaluateOverlap } from '../logic/overlap';
import { mod6, nextZone, zoneOf } from '../logic/rotate';
import { nextMove, rotationName } from '../logic/explain';
import { load, save } from '../logic/storage';
import { SubstitutionDemo } from './SubstitutionDemo';

export type DisplayPlayer = Placed & { gone?: boolean; path?: CourtPlayer['path']; pose?: Pose; lean?: number };

const OFF = { x: 9.85, y: 4.5 };
const PHASES: Phase[] = ['receive', 'attack', 'serve', 'defense'];

/** Every player of the system, absent ones parked invisible at the bench side. */
export function withGone(f: Formation, allIds: PlayerId[], lineup: PlayerId[], k: number): DisplayPlayer[] {
  return allIds.map((id) => {
    const p = f.find((q) => q.id === id);
    if (p) return { ...p };
    const zone = id === 'L' ? (6 as Zone) : zoneOf(lineup, k, id);
    return { id, zone, x: OFF.x, y: OFF.y, tag: 'cover', gone: true };
  });
}

function curvedMid(a: { x: number; y: number }, b: { x: number; y: number }) {
  const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const v = { x: m.x - 4.5, y: m.y - 4.5 };
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: m.x + (v.x / l) * 0.8, y: m.y + (v.y / l) * 0.8 };
}

export default function SystemPage({ sys }: { sys: SystemId }) {
  const { t } = useT();
  const S = SYSTEMS[sys];
  const reduce = !!useReducedMotion();
  const allIds = useMemo<PlayerId[]>(() => [...S.lineup, ...(S.hasLibero ? (['L'] as PlayerId[]) : [])], [S]);

  const [k, setK] = useState(0);
  const [phase, setPhase] = useState<Phase>('receive');
  const [mode, setMode] = useState<SetterMode>('international');
  const [labelMode, setLabelModeS] = useState<LabelMode>(() => load<LabelMode>('vb-label', 'role'));
  const [showIcons, setShowIcons] = useState(true);
  const [showOverlap, setShowOverlap] = useState(true);
  const [meta, setMeta] = useState<PlayersMeta>(() => load('vb-players', DEFAULT_META));
  const [selectedId, setSelectedId] = useState<PlayerId | null>(null);
  const [tab, setTab] = useState<SideTab>('positions');
  const [highlightRole, setHighlightRole] = useState<string | null>(null);
  const [zoneSel, setZoneSel] = useState<Zone | null>(null);
  const [focusPartner, setFocusPartner] = useState<PlayerId | null>(null);
  const [toast, setToastS] = useState<string | null>(null);
  const [override, setOverride] = useState<DisplayPlayer[] | null>(null);
  const [poseOv, setPoseOv] = useState<Partial<Record<PlayerId, Pose>>>({});
  const [flight, setFlight] = useState<{ key: number; segs: FlightSeg[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [editing, setEditing] = useState(false);
  const [spinKey, setSpinKey] = useState(0);

  const st = useRef({ k, phase, mode });
  st.current = { k, phase, mode };
  const tok = useRef(0);
  const counters = useRef({ rot: 0, play: 0 });
  const toastTimer = useRef<number | undefined>(undefined);

  // reset when the system changes
  useEffect(() => {
    cancel();
    setK(0);
    setPhase('receive');
    setSelectedId(null);
    setHighlightRole(null);
    counters.current.rot = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sys]);

  const setLabelMode = (m: LabelMode) => {
    setLabelModeS(m);
    save('vb-label', m);
  };

  const showToast = (m: string) => {
    setToastS(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastS(null), 2600);
  };

  function cancel() {
    tok.current++;
    setOverride(null);
    setFlight(null);
    setPoseOv({});
    setBusy(false);
    setAuto(false);
  }

  const formation = S.formation(k, phase, mode);
  const shown: DisplayPlayer[] = override ?? withGone(formation, allIds, S.lineup, k);

  function rotationToast(k1: number, ph: Phase) {
    let m: string;
    if (sys === '5-1') {
      const z = setterZone51(k1);
      m = fmt(isFront(z) ? t.toast.setterFront : t.toast.setterBack, { z });
    } else {
      m = fmt(sys === '6-2' ? t.toast.s62 : t.toast.s42, { s: t.code[S.settingSetter(k1)] });
    }
    const f = S.formation(k1, ph, st.current.mode);
    if (f.some((p) => p.middleServes)) m += ' ' + t.middleServes;
    if (counters.current.rot !== 0 && counters.current.rot % 6 === 0) m = t.ui.fullCycle;
    showToast(m);
  }

  async function rotate(my = ++tok.current) {
    const { k: k0, phase: ph, mode: md } = st.current;
    const k1 = k0 + 1;
    const alive = () => tok.current === my;
    setSelectedId(null);
    setFocusPartner(null);
    setSpinKey((s) => s + 1);
    counters.current.rot++;
    if (reduce) {
      setK(mod6(k1));
      rotationToast(k1, ph);
      return;
    }
    setBusy(true);
    setFlight(null);
    setPoseOv({});
    const cur = withGone(S.formation(k0, ph, md), allIds, S.lineup, k0);
    const next = S.formation(k1, ph, md);
    // A — everyone to their zone center
    const A: DisplayPlayer[] = cur.map((p) => (p.gone ? p : { ...p, x: ZONE_CENTER[p.zone].x, y: ZONE_CENTER[p.zone].y, pose: 'ready' }));
    setOverride(A);
    await sleep(500);
    if (!alive()) return;
    // B — clockwise along curved paths, staggered; libero leaving the back row swaps with its middle
    let order = 0;
    const B: DisplayPlayer[] = A.map((p) => {
      if (p.gone) {
        const n = next.find((q) => q.id === p.id);
        if (n && isFront(n.zone)) {
          const c = ZONE_CENTER[n.zone];
          return { ...p, gone: false, zone: n.zone, x: c.x, y: c.y, pose: 'run', lean: 6, path: { xs: [-0.8, c.x], ys: [c.y + 1, c.y], delay: 0.15, duration: 0.7 } };
        }
        return p;
      }
      const nz = nextZone(p.zone);
      const c = ZONE_CENTER[nz];
      if (p.id === 'L' && isFront(nz)) {
        return { ...p, zone: nz, x: -0.8, y: p.y, gone: true, pose: 'run', lean: -6, path: { xs: [p.x, -0.8], ys: [p.y, p.y], delay: 0, duration: 0.6 } };
      }
      const mid = curvedMid(p, c);
      return { ...p, zone: nz, x: c.x, y: c.y, pose: 'run', lean: c.x > p.x ? 6 : c.x < p.x ? -6 : 0, path: { xs: [p.x, mid.x, c.x], ys: [p.y, mid.y, c.y], delay: order++ * 0.06, duration: 0.8 } };
    });
    setOverride(B);
    await sleep(1150);
    if (!alive()) return;
    // C — remaining libero swap at the sideline
    let swapped = false;
    const C: DisplayPlayer[] = B.map((p) => {
      const n = next.find((q) => q.id === p.id);
      if (!p.gone && !n) {
        swapped = true;
        return { ...p, gone: true, x: 9.85, pose: 'run', lean: 6, path: { xs: [p.x, 9.85], ys: [p.y, p.y], delay: 0, duration: 0.6 } };
      }
      if (p.gone && n) {
        swapped = true;
        const c = ZONE_CENTER[n.zone];
        return { ...p, gone: false, zone: n.zone, x: c.x, y: c.y, pose: 'run', lean: -6, path: { xs: [9.85, c.x], ys: [c.y, c.y], delay: 0.05, duration: 0.6 } };
      }
      return { ...p, path: undefined, pose: p.gone ? p.pose : 'ready', lean: 0 };
    });
    if (swapped) {
      setOverride(C);
      await sleep(750);
      if (!alive()) return;
    }
    // D — into the phase formation of the new rotation
    setK(mod6(k1));
    setOverride(null);
    setBusy(false);
    rotationToast(k1, ph);
  }

  function back() {
    cancel();
    setSelectedId(null);
    setK((x) => mod6(x - 1));
  }

  async function play(my = ++tok.current) {
    const alive = () => tok.current === my;
    setSelectedId(null);
    setFocusPartner(null);
    if (st.current.phase !== 'receive') {
      setOverride(null);
      setPhase('receive');
      await sleep(reduce ? 0 : 800);
      if (!alive()) return;
    }
    const { k: kk, mode: md } = st.current;
    const recv = S.formation(kk, 'receive', md);
    const att = S.formation(kk, 'attack', md);
    if (reduce) {
      setPhase('attack');
      return;
    }
    const passers = recv.filter((p) => p.tag === 'passer');
    const passer = passers[counters.current.play % passers.length];
    const kinds: AttackKind[] = ['left', 'middle', 'right', 'pipe', 'backRight', 'dump'];
    const options = kinds.map((kd) => att.find((a) => a.attackKind === kd)).filter(Boolean) as Placed[];
    const hitter = options[counters.current.play % options.length];
    counters.current.play++;
    const setter = att.find((p) => p.tag === 'setting')!;
    const kind = hitter.attackKind ?? 'left';
    const hit = HIT_SPOT[kind];
    const land = { x: kind === 'left' ? 6.8 : kind === 'right' || kind === 'backRight' ? 1.8 : 3.2, y: -2.5 };
    setBusy(true);
    setFlight({
      key: Date.now(),
      segs: [
        { from: { x: 2.5 + (counters.current.play % 3) * 2, y: -3.2 }, to: { x: passer.x, y: passer.y }, height: 3.4, duration: 0.9 },
        { from: { x: passer.x, y: passer.y }, to: { x: setter.x, y: setter.y }, height: 2.8, duration: 1.0 },
        { from: { x: setter.x, y: setter.y }, to: hit, height: kind === 'middle' ? 0.8 : kind === 'dump' ? 0.2 : 2.2, duration: kind === 'dump' ? 0.25 : 0.7 },
        { from: hit, to: land, height: 0.25, duration: 0.35 },
      ],
    });
    await sleep(720);
    if (!alive()) return;
    setPoseOv({ [passer.id]: 'pass' });
    await sleep(200);
    if (!alive()) return;
    // switch: everyone runs to the attack formation
    const runs: Partial<Record<PlayerId, Pose>> = { [passer.id]: 'pass' };
    att.forEach((a) => {
      const r = recv.find((q) => q.id === a.id)!;
      if (a.id !== passer.id && Math.hypot(a.x - r.x, a.y - r.y) > 0.5) runs[a.id] = 'run';
    });
    setPhase('attack');
    setPoseOv(runs);
    await sleep(650);
    if (!alive()) return;
    setPoseOv({});
    await sleep(330);
    if (!alive()) return;
    setPoseOv({ [setter.id]: 'set' });
    if (kind !== 'dump') {
      const ov = withGone(att, allIds, S.lineup, kk).map((p) => (p.id === hitter.id ? { ...p, x: hit.x, y: hit.y + 0.15 } : p));
      setOverride(ov);
      await sleep(420);
      if (!alive()) return;
      setPoseOv({ [setter.id]: 'set', [hitter.id]: 'attack' });
      await sleep(600);
    } else {
      setPoseOv({ [setter.id]: 'attack' });
      await sleep(700);
    }
    if (!alive()) return;
    await sleep(350);
    if (!alive()) return;
    setFlight(null);
    setPoseOv({});
    setOverride(null);
    setBusy(false);
  }

  // auto-play loop: receive → switch → attack, then rotate
  useEffect(() => {
    if (!auto) return;
    const my = ++tok.current;
    (async () => {
      while (tok.current === my) {
        await play(my);
        if (tok.current !== my) break;
        await sleep(900);
        if (tok.current !== my) break;
        await rotate(my);
        await sleep(1100);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  // keyboard: → rotate, ← back, Space play
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || editing) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!busy) rotate();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
      } else if (e.key === ' ' && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault();
        if (auto) cancel();
        else if (!busy) play();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // swipe on the court
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onWrapDown = (e: RPE) => (swipe.current = { x: e.clientX, y: e.clientY });
  const onWrapUp = (e: RPE) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || busy) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 50) {
      if (dx < 0) rotate();
      else back();
    }
  };

  const view = { t, sys, k, phase, labelMode, meta, showIcons, selectedId, highlightRole, focusId: focusPartner };
  const players: CourtPlayer[] = shown.map((p) => toCourtPlayer({ ...p, pose: poseOv[p.id] ?? p.pose }, view));
  const selected = selectedId ? formation.find((p) => p.id === selectedId) ?? null : null;

  // arrows: switch movement in attack/defense phases, or the selected player's next move
  const arrows: Arrow[] = [];
  if (!override && !flight) {
    if (selected) {
      const nm = nextMove(t, sys, k, phase, selected, mode);
      if (nm.to) arrows.push({ key: 'sel', from: selected, to: nm.to });
    } else if (phase === 'attack' || phase === 'defense') {
      const from = S.formation(k, phase === 'attack' ? 'receive' : 'serve', mode);
      formation.forEach((p) => {
        const f = from.find((q) => q.id === p.id);
        if (f && Math.hypot(f.x - p.x, f.y - p.y) > 0.6) arrows.push({ key: p.id + phase, from: f, to: p });
      });
    }
  }

  const overlapPhase = phase === 'receive' || phase === 'serve';
  const overlap: OverlapLine[] = [];
  if (overlapPhase && !override && (showOverlap || focusPartner)) {
    const res = evaluateOverlap(formation, phase === 'serve');
    res.forEach((r) => {
      if (r.skipped) return;
      const a = formation.find((p) => p.zone === r.rule.a)!;
      const b = formation.find((p) => p.zone === r.rule.b)!;
      const focus = !!(selected && focusPartner && [a.id, b.id].includes(selected.id) && [a.id, b.id].includes(focusPartner));
      if (focusPartner && !focus) return;
      overlap.push({ key: `${r.rule.a}-${r.rule.b}`, a, b, ok: r.ok, label: `${r.rule.a}·${r.rule.b}`, focus });
    });
  }

  const concept = t.systems[sys];
  const attackersNow = S.formation(k, 'attack', mode).filter((p) => isFront(p.zone) && p.tag === 'attacker').length;

  return (
    <PageFade>
      <div className="page">
        <p className="kicker">{t.ui.system}</p>
        <div className="concept">
          <div style={{ flex: '1 1 280px' }}>
            <h1 className="bar">{concept.name}</h1>
            <ul className="bullets">
              {concept.concept.map((c) => <li key={c}>{c}</li>)}
              {'only3' in concept && <li><b>{concept.only3}</b></li>}
            </ul>
          </div>
          <div style={{ textAlign: 'center' }}>
            <LineupWheel lineup={S.lineup} />
            <div className="muted" style={{ fontSize: 12 }}>{t.ui.startRotation}</div>
          </div>
        </div>

        <div className="sys-layout">
          <div>
            <div className="rotsel" role="group" aria-label={t.ui.rotation}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <button key={i} aria-pressed={k === i} onClick={() => { cancel(); setSelectedId(null); setK(i); }}>
                  {rotationName(i)}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <Tabs<Phase> value={phase} onChange={(p) => { cancel(); setPhase(p); }} label={t.ui.rotation}
                items={PHASES.map((p) => ({ id: p, label: t.phaseShort[p] }))} />
            </div>
            <div className="rot-title" style={{ margin: '12px 0 4px' }}>
              <span className="big">{t.ui.rotation} {rotationName(k)}</span>
              <span className="pill">{fmt(t.ui.attacksCount, { n: attackersNow })}</span>
              {sys === '6-2' && <span className="pill pill--dark">{t.code[S.settingSetter(k)]} 🎯</span>}
            </div>
            <p className="muted" style={{ margin: '0 0 8px', minHeight: 48 }}><b style={{ color: 'var(--ink)' }}>{t.phase[phase]}.</b> {t.phaseHint[phase]}</p>

            <div className="court-wrap" onPointerDown={onWrapDown} onPointerUp={onWrapUp}>
              <Court
                players={players}
                arrows={arrows}
                overlap={overlap}
                highlightZone={zoneSel}
                showZoneBadge={labelMode !== 'zone'}
                showTarget={phase === 'attack' || phase === 'receive' ? (S.formation(k, 'attack', mode).find((p) => p.tag === 'setting') ?? null) : null}
                ariaLabel={`${sys} ${rotationName(k)} — ${t.phase[phase]}`}
                onPlayerTap={(id) => {
                  if (busy) return;
                  setSelectedId(id === selectedId ? null : id);
                  setFocusPartner(null);
                  setTab('selected');
                  setZoneSel(null);
                }}
                onBackgroundTap={(z) => {
                  setSelectedId(null);
                  setFocusPartner(null);
                  if (z) {
                    setZoneSel(z === zoneSel ? null : z);
                    setTab('zones');
                  } else setZoneSel(null);
                }}
                overlay={flight ? <BallFlight key={flight.key} segs={flight.segs} design="molten" /> : null}
              />
            </div>

            <div className="toolbar">
              <Seg<LabelMode> value={labelMode} onChange={setLabelMode} label={t.ui.labels}
                items={[
                  { id: 'role', label: t.ui.labelRole },
                  { id: 'zone', label: t.ui.labelZone },
                  { id: 'jersey', label: t.ui.labelJersey },
                  { id: 'name', label: t.ui.labelName },
                ]} />
              <button className="chip" onClick={() => setEditing(true)}>✎ {t.ui.editPlayers}</button>
            </div>
            <div className="toolbar">
              <Toggle on={showOverlap} onChange={setShowOverlap}>{t.ui.overlap}</Toggle>
              <Toggle on={showIcons} onChange={setShowIcons}>{t.ui.icons}</Toggle>
              <Toggle on={auto} onChange={(v) => { if (v) { cancel(); setAuto(true); } else cancel(); }}>{t.ui.autoplay}</Toggle>
              {sys === '4-2' && (
                <Seg<SetterMode> value={mode} onChange={(m) => { cancel(); setMode(m); }} label={t.ui.mode}
                  items={[{ id: 'international', label: t.ui.modeIntl }, { id: 'traditional', label: t.ui.modeTrad }]} />
              )}
            </div>
            <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>{t.ui.swipeHint} · <span className="hide-mobile">{t.ui.keyHint}</span></p>

            <div className="rotate-bar">
              <button className="btn btn--ghost btn--small" onClick={back} aria-label={t.ui.back}>↺ {t.ui.back}</button>
              <button className="btn btn--rotate" onClick={() => { if (auto) cancel(); if (!busy) rotate(); }} disabled={busy && !auto}>
                <span key={spinKey} className={`rot-icon ${spinKey ? 'spin' : ''}`}>↻</span> {t.ui.rotate}
              </button>
              <button className="btn btn--ghost btn--small" onClick={() => (auto ? cancel() : busy ? null : play())} aria-label={t.ui.play}>
                {auto ? '❚❚' : '▶'} {auto ? t.ui.pause : t.ui.play}
              </button>
            </div>
          </div>

          <div className="side-sticky grid" style={{ gap: 16 }}>
            <SidePanel sys={sys} k={k} phase={phase} mode={mode} formation={formation} selected={selected} tab={tab} setTab={setTab}
              highlightRole={highlightRole} setHighlightRole={setHighlightRole} zone={zoneSel} setZone={setZoneSel}
              focusPartner={focusPartner} setFocusPartner={setFocusPartner} onClose={() => { setSelectedId(null); setFocusPartner(null); }}
              serverExempt={phase === 'serve'} />
            <InfoPanel sys={sys} k={k} mode={mode} />
            <Legend />
          </div>
        </div>

        {sys === '6-2' && <SubstitutionDemo />}
      </div>
      <Toast msg={toast} />
      {editing && <EditPlayers ids={allIds} meta={meta} onClose={() => setEditing(false)} onSave={(m) => { setMeta(m); save('vb-players', m); }} />}
    </PageFade>
  );
}
