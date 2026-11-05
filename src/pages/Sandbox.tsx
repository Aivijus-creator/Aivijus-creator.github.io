import { useState } from 'react';
import { useT } from '../i18n';
import { PageFade, Seg } from '../components/ui';
import { DragCourt } from '../components/DragCourt';
import { SYSTEMS } from '../data/systems';
import { rotationName } from '../logic/explain';
import type { Formation, PlayerId, SystemId } from '../data/types';
import { constraintsFor } from '../logic/explain';

export default function Sandbox() {
  const { t } = useT();
  const [sys, setSys] = useState<SystemId>('5-1');
  const [k, setK] = useState(0);
  const [serve, setServe] = useState(false);
  const make = (s = sys, kk = k, sv = serve) => SYSTEMS[s].formation(kk, sv ? 'serve' : 'receive');
  const [f, setF] = useState<Formation>(() => make());
  const [sel, setSel] = useState<PlayerId | null>(null);
  const load = (s: SystemId, kk: number, sv: boolean) => {
    setSys(s);
    setK(kk);
    setServe(sv);
    setF(make(s, kk, sv));
    setSel(null);
  };
  const selected = sel ? f.find((p) => p.id === sel) : null;
  return (
    <PageFade>
      <div className="page">
        <p className="kicker">{t.nav.sandbox}</p>
        <h1 className="bar">{t.sandbox.title}</h1>
        <p className="lead">{t.sandbox.lead}</p>
        <div className="sys-layout">
          <div>
            <div className="toolbar">
              <Seg<SystemId> value={sys} onChange={(s) => load(s, k, serve)} items={(['5-1', '6-2', '4-2'] as SystemId[]).map((s) => ({ id: s, label: s }))} />
              <Seg<'r' | 's'> value={serve ? 's' : 'r'} onChange={(v) => load(sys, k, v === 's')} items={[{ id: 'r', label: t.phaseShort.receive }, { id: 's', label: t.phaseShort.serve }]} />
            </div>
            <div className="rotsel" style={{ marginBottom: 10 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <button key={i} aria-pressed={k === i} onClick={() => load(sys, i, serve)}>{rotationName(i)}</button>
              ))}
            </div>
            <DragCourt formation={f} setFormation={setF} sys={sys} k={k} serverExempt={serve} selectedId={sel} onSelect={setSel} />
            <div style={{ textAlign: 'center' }}>
              <button className="btn btn--ghost" onClick={() => load(sys, k, serve)}>↺ {t.ui.reset}</button>
            </div>
          </div>
          <div className="panel">
            <div className="panel__body">
              <p className="muted" style={{ marginTop: 0 }}>{t.ui.dragHint}</p>
              {selected ? (
                <div className="grid" style={{ gap: 6 }}>
                  <h3>{t.code[selected.id]} · {t.ui.zone} {selected.zone}</h3>
                  {serve && selected.zone === 1 ? (
                    <div className="constraint">✅ {t.constraint.exempt}</div>
                  ) : (
                    constraintsFor(t, f, selected, serve).map((c) => (
                      <div key={c.partnerZone} className="constraint">
                        <span>{c.ok ? '✅' : '❌'}</span>
                        <span>{c.text}<small>{t.ui.rules}: {c.rule}</small></span>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <p style={{ margin: 0 }}>{t.ui.tapHint}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageFade>
  );
}
