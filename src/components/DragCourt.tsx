import { useState } from 'react';
import { fmt, useT } from '../i18n';
import type { Formation, PlayerId, SystemId } from '../data/types';
import { Court, type OverlapLine } from './Court';
import { evaluateOverlap } from '../logic/overlap';
import { toCourtPlayer, DEFAULT_META, type LabelMode } from './view';

/** Court where every player can be dragged (mouse + touch); overlap is checked live. */
export function DragCourt({ formation, setFormation, sys, k, serverExempt, labelMode = 'role', selectedId, onSelect }: {
  formation: Formation;
  setFormation: (f: Formation) => void;
  sys: SystemId;
  k: number;
  serverExempt: boolean;
  labelMode?: LabelMode;
  selectedId?: PlayerId | null;
  onSelect?: (id: PlayerId | null) => void;
}) {
  const { t } = useT();
  const [showLines, setShowLines] = useState(true);
  const res = evaluateOverlap(formation, serverExempt);
  const bad = res.filter((r) => !r.ok && !r.skipped);
  const lines: OverlapLine[] = showLines
    ? res.filter((r) => !r.skipped).map((r) => {
        const a = formation.find((p) => p.zone === r.rule.a)!;
        const b = formation.find((p) => p.zone === r.rule.b)!;
        return { key: `${r.rule.a}-${r.rule.b}`, a, b, ok: r.ok, label: `${r.rule.a}·${r.rule.b}` };
      })
    : [];
  let msg = t.ui.legal;
  if (bad.length) {
    const r = bad[0].rule;
    const a = formation.find((p) => p.zone === r.a)!;
    const b = formation.find((p) => p.zone === r.b)!;
    msg = `${t.ui.fault} – ` + fmt(t.ui.faultMsg, { a: t.code[a.id], za: r.a, b: t.code[b.id], zb: r.b, rel: r.kind === 'frontBack' ? t.ui.relFront : t.ui.relLeft });
  }
  const players = formation.map((p) => toCourtPlayer(p, { t, sys, k, phase: 'receive', labelMode, meta: DEFAULT_META, showIcons: false, selectedId }));
  return (
    <div>
      <div className="court-wrap court-wrap--sandbox">
        <div className={`banner ${bad.length ? 'banner--bad' : ''}`} role="status">{msg}</div>
        <Court players={players} overlap={lines} draggable showZoneBadge
          onPlayerTap={(id) => onSelect?.(id === selectedId ? null : id)}
          onBackgroundTap={() => onSelect?.(null)}
          onDrag={(id, x, y) => setFormation(formation.map((p) => (p.id === id ? { ...p, x: Math.round(x * 20) / 20, y: Math.round(y * 20) / 20 } : p)))} />
      </div>
      <div className="toolbar" style={{ justifyContent: 'center' }}>
        <button className="chip" aria-pressed={showLines} onClick={() => setShowLines(!showLines)}>{showLines ? '●' : '○'} {t.ui.overlap}</button>
      </div>
    </div>
  );
}
