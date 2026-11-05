import { useState } from 'react';
import { useT } from '../i18n';
import type { PlayerId } from '../data/types';
import type { PlayersMeta } from './view';

export function EditPlayers({ ids, meta, onSave, onClose }: { ids: PlayerId[]; meta: PlayersMeta; onSave: (m: PlayersMeta) => void; onClose: () => void }) {
  const { t } = useT();
  const [m, setM] = useState<PlayersMeta>({ jersey: { ...meta.jersey }, name: { ...meta.name } });
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={t.ui.editPlayers} onClick={(e) => e.stopPropagation()}>
        <h3 className="bar">{t.ui.editPlayers}</h3>
        {ids.map((id) => (
          <div className="edit-row" key={id}>
            <b style={{ fontFamily: 'var(--f-num)' }}>{t.code[id]}</b>
            <input aria-label={`${t.code[id]} ${t.ui.labelJersey}`} inputMode="numeric" maxLength={2} value={m.jersey[id] ?? ''}
              onChange={(e) => setM({ ...m, jersey: { ...m.jersey, [id]: e.target.value.replace(/\D/g, '') } })} />
            <input aria-label={`${t.code[id]} ${t.ui.labelName}`} maxLength={10} value={m.name[id] ?? ''} placeholder={t.ui.labelName}
              onChange={(e) => setM({ ...m, name: { ...m.name, [id]: e.target.value } })} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn btn--ghost" onClick={onClose}>{t.ui.close}</button>
          <button className="btn" onClick={() => { onSave(m); onClose(); }}>{t.ui.save}</button>
        </div>
      </div>
    </div>
  );
}
