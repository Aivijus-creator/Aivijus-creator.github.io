import { useT } from '../i18n';
import { ROLE_BADGE } from '../data/roles';
import type { RoleKind } from '../data/types';

export function Legend({ open }: { open?: boolean }) {
  const { t } = useT();
  const kinds: RoleKind[] = ['setter', 'oh', 'mb', 'opp', 'libero'];
  return (
    <details className="legend card" open={open}>
      <summary>{t.ui.legend}</summary>
      <div className="legend__grid">
        {kinds.map((k) => (
          <div className="legend__item" key={k}>
            <span className="swatch" style={{ background: ROLE_BADGE[k].bg, border: `2px solid ${ROLE_BADGE[k].border ?? ROLE_BADGE[k].bg}` }} />
            {t.roleName[k]}
          </div>
        ))}
        <div className="legend__item"><span className="swatch" style={{ background: 'var(--jersey)' }} />{t.legend.jersey}</div>
        <div className="legend__item"><span className="swatch" style={{ background: '#fff', border: '2px solid #B3122E' }} />{t.legend.libero}</div>
        <div className="legend__item">🏐 {t.legend.passer}</div>
        <div className="legend__item">👻 {t.legend.hidden}</div>
        <div className="legend__item">⚡ {t.legend.attacker}</div>
        <div className="legend__item">🎯 {t.legend.setter}</div>
        <div className="legend__item">✋ {t.legend.blocker}</div>
        <div className="legend__item"><span className="swatch" style={{ background: 'var(--accent-500)', height: 4 }} />{t.legend.arrow}</div>
        <div className="legend__item"><span className="swatch" style={{ background: 'var(--ok)', height: 4 }} />{t.legend.ok}</div>
        <div className="legend__item"><span className="swatch" style={{ background: 'var(--bad)', height: 4 }} />{t.legend.bad}</div>
      </div>
    </details>
  );
}
