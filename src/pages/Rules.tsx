import { useState } from 'react';
import { useT } from '../i18n';
import { PageFade } from '../components/ui';
import { Court, type CourtPlayer } from '../components/Court';
import { DragCourt } from '../components/DragCourt';
import { ZONE_CENTER } from '../data/zones';
import { SYSTEMS } from '../data/systems';
import { zonesAt } from '../logic/rotate';
import { LINEUP_51 } from '../data/system51';
import { roleKind } from '../data/roles';
import { kindCode } from '../components/view';
import type { Formation, Zone } from '../data/types';

function RotateDemo() {
  const { t } = useT();
  const [k, setK] = useState(0);
  const zs = zonesAt(LINEUP_51, k);
  const players: CourtPlayer[] = ([1, 2, 3, 4, 5, 6] as Zone[]).map((z) => {
    const id = zs[z];
    const c = ZONE_CENTER[z];
    const prev = ZONE_CENTER[z === 6 ? 1 : ((z + 1) as Zone)];
    const mid = { x: (prev.x + c.x) / 2 + (c.x === prev.x ? (c.x < 4.5 ? -0.8 : 0.8) : 0), y: (prev.y + c.y) / 2 + (c.y === prev.y ? (c.y < 4 ? -0.6 : 0.6) : 0) };
    const code = t.code[id];
    return {
      id, zone: z, x: c.x, y: c.y, pose: 'ready', label: code, badge: kindCode(code), kind: roleKind(id), ariaLabel: `${code}, ${z}`,
      path: k ? { xs: [prev.x, mid.x, c.x], ys: [prev.y, mid.y, c.y], delay: 0.06 * z, duration: 0.8 } : undefined,
    } as CourtPlayer;
  });
  return (
    <div>
      <div className="court-wrap" style={{ maxWidth: 380 }}>
        <Court players={players} showZoneBadge ariaLabel={t.rules.rotationTitle} />
      </div>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button className="btn" onClick={() => setK((x) => x + 1)}>↻ {t.ui.rotate}</button>
      </div>
    </div>
  );
}

function OverlapDemo() {
  const { t } = useT();
  const start = () => SYSTEMS['5-1'].formation(0, 'receive');
  const [f, setF] = useState<Formation>(start);
  return (
    <div>
      <DragCourt formation={f} setFormation={setF} sys="5-1" k={0} serverExempt={false} />
      <div style={{ textAlign: 'center' }}>
        <button className="btn btn--ghost btn--small" onClick={() => setF(start())}>{t.ui.reset}</button>
      </div>
    </div>
  );
}

export default function Rules() {
  const { t } = useT();
  const R = t.rules;
  return (
    <PageFade>
      <div className="page">
        <p className="kicker">{t.nav.rules}</p>
        <h1 className="bar">{R.title}</h1>

        <section className="grid grid--2" style={{ alignItems: 'center' }}>
          <div>
            <h2 className="bar">{R.rotationTitle}</h2>
            <ul className="bullets">{R.rotation.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <RotateDemo />
        </section>

        <section className="grid grid--2" style={{ alignItems: 'center' }}>
          <div>
            <h2 className="bar">{R.overlapTitle}</h2>
            <ul className="bullets">{R.overlap.map((x) => <li key={x}>{x}</li>)}</ul>
            <p className="sun-card" style={{ marginTop: 12 }}><b>{R.demo}:</b> {R.demoOverlap}</p>
          </div>
          <OverlapDemo />
        </section>

        <section className="grid grid--3">
          <div className="card">
            <h3 className="bar">{R.backRowTitle}</h3>
            <ul className="bullets">{R.backRow.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="card">
            <h3 className="bar">{R.liberoTitle}</h3>
            <ul className="bullets">{R.libero.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="card">
            <h3 className="bar">{R.generalTitle}</h3>
            <ul className="bullets">{R.general.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </section>

        <section>
          <h2 className="bar">{R.glossaryTitle}</h2>
          <div className="grid grid--2">
            {R.glossary.map(([term, def]) => (
              <div key={term} className="card" style={{ padding: '12px 16px' }}>
                <b style={{ fontFamily: 'var(--f-label)', textTransform: 'uppercase', fontSize: 17 }}>{term}</b>
                <div className="muted">{def}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageFade>
  );
}
