import { AnimatePresence, motion } from 'framer-motion';
import { useT } from '../i18n';
import type { Formation, Phase, Placed, PlayerId, SetterMode, SystemId, Zone } from '../data/types';
import { ROLE_BADGE } from '../data/roles';
import { constraintsFor, displayRole, nextMove, rotationName, whyHere } from '../logic/explain';
import { isFront } from '../data/zones';
import { Tabs } from './ui';
import type { Dict } from '../i18n/en';

export type SideTab = 'positions' | 'zones' | 'selected';
type RoleKey = keyof Dict['roleName'];

const ROLES_BY_SYS: Record<SystemId, RoleKey[]> = {
  '5-1': ['setter', 'oh', 'mb', 'opp', 'libero'],
  '6-2': ['setter', 'setterHitter', 'oh', 'mb', 'libero'],
  '4-2': ['setter', 'hitter'],
};

const badgeKind = (r: RoleKey) => (r === 'setterHitter' ? 'opp' : r === 'hitter' ? 'oh' : r);

interface Props {
  sys: SystemId;
  k: number;
  phase: Phase;
  mode?: SetterMode;
  formation: Formation;
  selected: Placed | null;
  tab: SideTab;
  setTab: (t: SideTab) => void;
  highlightRole: string | null;
  setHighlightRole: (r: string | null) => void;
  zone: Zone | null;
  setZone: (z: Zone | null) => void;
  focusPartner: PlayerId | null;
  setFocusPartner: (p: PlayerId | null) => void;
  onClose: () => void;
  serverExempt: boolean;
}

export function SidePanel(p: Props) {
  const { t } = useT();
  return (
    <div className="panel sheet">
      <Tabs<SideTab>
        value={p.tab}
        onChange={p.setTab}
        items={[
          { id: 'positions', label: t.ui.positions },
          { id: 'zones', label: t.ui.zones },
          { id: 'selected', label: t.ui.selected },
        ]}
      />
      <div className="panel__body">
        <AnimatePresence mode="wait">
          <motion.div key={p.tab + (p.selected?.id ?? '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {p.tab === 'positions' && <Positions {...p} />}
            {p.tab === 'zones' && <Zones {...p} />}
            {p.tab === 'selected' && <Selected {...p} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Positions({ sys, highlightRole, setHighlightRole }: Props) {
  const { t } = useT();
  return (
    <div className="grid" style={{ gap: 10 }}>
      {ROLES_BY_SYS[sys].map((r) => {
        const c = t.roleCards[r];
        const b = ROLE_BADGE[badgeKind(r)];
        return (
          <button key={r} className="role-card" aria-pressed={highlightRole === r} onClick={() => setHighlightRole(highlightRole === r ? null : r)}>
            <span className="role-card__head">
              <span className="swatch" style={{ background: b.bg, border: `2px solid ${b.border ?? b.bg}` }} />
              {t.roleName[r]}
            </span>
            <span>{c.text}</span>
            <span className="role-card__meta">
              <span><b>{t.roleLabels.where}:</b> {c.where}</span>
              <span><b>{t.roleLabels.jobs}:</b> {c.jobs.join(' · ')}</span>
              <span><b>{t.roleLabels.rules}:</b> {c.rules.join(' · ')}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Zones({ zone, setZone }: Props) {
  const { t } = useT();
  return (
    <div className="grid" style={{ gap: 8, gridTemplateColumns: '1fr' }}>
      {([4, 3, 2, 5, 6, 1] as Zone[]).map((z) => (
        <button key={z} className="role-card" aria-pressed={zone === z} onClick={() => setZone(zone === z ? null : z)}>
          <span className="role-card__head">
            <span className="code" style={{ background: 'var(--ink)', color: 'var(--white)', fontSize: 16 }}>{z}</span>
            {t.ui.zone} {z}
          </span>
          <span>{t.zoneText[z]}</span>
        </button>
      ))}
    </div>
  );
}

function Selected({ sys, k, phase, mode, formation, selected, focusPartner, setFocusPartner, onClose, serverExempt }: Props) {
  const { t } = useT();
  if (!selected) return <p className="muted" style={{ margin: 0 }}>{t.ui.tapHint}</p>;
  const dr = displayRole(sys, k, selected);
  const why = whyHere(t, sys, k, phase, selected);
  const overlapPhase = phase === 'receive' || phase === 'serve';
  const isServer = phase === 'serve' && selected.zone === 1;
  const cons = overlapPhase ? constraintsFor(t, formation, selected, serverExempt) : [];
  const nm = nextMove(t, sys, k, phase, selected, mode);
  const card = t.roleCards[dr];
  const b = ROLE_BADGE[badgeKind(dr)];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="code" style={{ background: b.bg, color: b.fg, border: b.border ? `2px solid ${b.border}` : undefined, fontSize: 18 }}>{t.code[selected.id]}</span>
          <div>
            <div style={{ fontFamily: 'var(--f-label)', fontSize: 20, textTransform: 'uppercase', lineHeight: 1.1 }}>{t.roleName[dr]}</div>
            <div className="muted" style={{ fontSize: 13 }}>
              {t.ui.zone} {selected.zone} · {isFront(selected.zone) ? t.ui.front : t.ui.backRowWord} · {sys} {rotationName(k)} · {t.phaseShort[phase]}
            </div>
          </div>
        </div>
        <button className="btn btn--ghost btn--small" onClick={onClose} aria-label={t.ui.close}>✕</button>
      </div>
      <div className="sub-h">{t.ui.whyHere}</div>
      <p className="why">{why}</p>
      {overlapPhase && (
        <div className="grid" style={{ gap: 6 }}>
          {isServer ? (
            <div className="constraint">✅ {t.constraint.exempt}</div>
          ) : (
            cons.map((c) => (
              <button key={c.partnerZone} className="constraint" aria-pressed={focusPartner === c.partnerId}
                onClick={() => setFocusPartner(focusPartner === c.partnerId ? null : c.partnerId)}>
                <span>{c.ok ? '✅' : '❌'}</span>
                <span>
                  {c.text}
                  <small>{t.ui.rules}: {c.rule}</small>
                </span>
              </button>
            ))
          )}
        </div>
      )}
      {!overlapPhase && <p className="muted" style={{ fontSize: 14, margin: 0 }}>{t.constraint.afterServe}</p>}
      <div className="sub-h">{t.next.title}</div>
      <p style={{ margin: 0 }}>➜ {nm.text}</p>
      <div className="sub-h">{t.ui.roleReminder}</div>
      <p style={{ margin: 0 }} className="muted">{card.text}</p>
    </div>
  );
}
