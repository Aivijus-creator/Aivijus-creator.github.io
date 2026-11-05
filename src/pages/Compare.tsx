import { useState } from 'react';
import { useT } from '../i18n';
import { PageFade, Tabs } from '../components/ui';
import { Court } from '../components/Court';
import { SYSTEMS, SYSTEM_IDS } from '../data/systems';
import { toCourtPlayer, DEFAULT_META } from '../components/view';
import { withGone } from './SystemPage';
import { rotationName } from '../logic/explain';
import type { Phase, PlayerId } from '../data/types';

export default function Compare() {
  const { t } = useT();
  const [k, setK] = useState(0);
  const [phase, setPhase] = useState<Phase>('receive');
  return (
    <PageFade>
      <div className="page">
        <p className="kicker">5-1 · 6-2 · 4-2</p>
        <h1 className="bar">{t.compare.title}</h1>
        <div className="table-wrap">
          <table className="t">
            <thead>
              <tr><th /><th>5-1</th><th>6-2</th><th>4-2</th></tr>
            </thead>
            <tbody>
              {t.compare.rows.map((r) => (
                <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <section>
          <h2 className="bar">{t.compare.same}</h2>
          <div className="rotsel" style={{ maxWidth: 560 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <button key={i} aria-pressed={k === i} onClick={() => setK(i)}>{rotationName(i)}</button>
            ))}
          </div>
          <div style={{ maxWidth: 560, marginTop: 8 }}>
            <Tabs<Phase> value={phase} onChange={setPhase} items={(['receive', 'attack', 'serve', 'defense'] as Phase[]).map((p) => ({ id: p, label: t.phaseShort[p] }))} />
          </div>
          <div className="grid grid--3" style={{ marginTop: 16 }}>
            {SYSTEM_IDS.map((id) => {
              const S = SYSTEMS[id];
              const all: PlayerId[] = [...S.lineup, ...(S.hasLibero ? (['L'] as PlayerId[]) : [])];
              const players = withGone(S.formation(k, phase), all, S.lineup, k).map((p) =>
                toCourtPlayer(p, { t, sys: id, k, phase, labelMode: 'role', meta: DEFAULT_META, showIcons: true }));
              return (
                <div key={id}>
                  <h3 style={{ textAlign: 'center' }}>{id}</h3>
                  <div className="court-wrap"><Court players={players} showZoneBadge ariaLabel={`${id} ${rotationName(k)}`} /></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PageFade>
  );
}
