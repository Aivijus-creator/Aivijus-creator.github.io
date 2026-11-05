import { useState } from 'react';
import { useT } from '../i18n';
import { Court, type CourtPlayer } from '../components/Court';
import { ZONE_CENTER } from '../data/zones';
import { zonesAt } from '../logic/rotate';
import { LINEUP_62 } from '../data/system62';
import { roleKind } from '../data/roles';
import type { PlayerId, Zone } from '../data/types';
import { kindCode } from '../components/view';
import { sleep } from '../components/ui';

/** 6-2 with substitutions: S1 rotates from zone 5 to the front row and a real opposite comes in. */
export function SubstitutionDemo() {
  const { t } = useT();
  const [step, setStep] = useState(0); // 0: S1 in zone 5, 1: rotated (S1 zone 4), 2: substituted
  const [busy, setBusy] = useState(false);
  const k = step === 0 ? 2 : 3;
  const zs = zonesAt(LINEUP_62, k);
  const players: CourtPlayer[] = [];
  (Object.keys(zs) as unknown as Zone[]).forEach((zk) => {
    const z = Number(zk) as Zone;
    const id = zs[z];
    const c = ZONE_CENTER[z];
    const out = step === 2 && id === 'S1';
    const code = t.code[id];
    players.push({ id, zone: z, x: out ? 9.85 : c.x, y: c.y, pose: out ? 'run' : 'ready', label: code, badge: kindCode(code), kind: roleKind(id), gone: out, ariaLabel: code, highlight: id === 'S1' });
  });
  const oppIn = step === 2;
  const c4 = ZONE_CENTER[4];
  const oppCode = t.code.OPP + '1';
  players.push({ id: 'OPP' as PlayerId, zone: 4, x: oppIn ? c4.x : -0.8, y: c4.y, pose: oppIn ? 'ready' : 'run', label: oppCode, badge: kindCode(t.code.OPP), kind: 'opp', gone: !oppIn, ariaLabel: oppCode, highlight: oppIn });

  const run = async () => {
    if (busy) return;
    setBusy(true);
    if (step === 2) {
      setStep(0);
      await sleep(700);
    }
    setStep(1);
    await sleep(1100);
    setStep(2);
    await sleep(800);
    setBusy(false);
  };

  return (
    <section style={{ marginTop: 40 }}>
      <h2 className="bar">{t.systems['6-2'].subTitle}</h2>
      <div className="grid grid--2" style={{ alignItems: 'center' }}>
        <ul className="bullets">
          {t.systems['6-2'].subText.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <div>
          <div className="court-wrap" style={{ maxWidth: 380 }}>
            <Court players={players} showZoneBadge ariaLabel={t.systems['6-2'].subTitle} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button className="btn" onClick={run} disabled={busy}>▶ {t.ui.showSub}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
