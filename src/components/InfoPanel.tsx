import { useT } from '../i18n';
import type { SetterMode, SystemId } from '../data/types';
import { rotationInfo } from '../logic/explain';

export function InfoPanel({ sys, k, mode }: { sys: SystemId; k: number; mode?: SetterMode }) {
  const { t } = useT();
  const i = rotationInfo(t, sys, k, mode);
  const Codes = ({ list }: { list: string[] }) => (
    <span className="codes">{list.length ? list.map((c) => <span key={c} className="code" style={{ background: 'var(--ink)', color: 'var(--white)' }}>{c}</span>) : t.ui.none}</span>
  );
  return (
    <dl className="facts card">
      <dt>{t.ui.frontRow}</dt>
      <dd><Codes list={i.front} /></dd>
      <dt>{t.ui.backRow}</dt>
      <dd><Codes list={i.back} /></dd>
      <dt>{t.ui.attackers}</dt>
      <dd><span className="pill">{i.attackers}</span></dd>
      <dt>{t.ui.passers}</dt>
      <dd><Codes list={i.passers} /></dd>
      <dt>{t.ui.hidden}</dt>
      <dd><Codes list={i.hidden} /></dd>
      <dt>{t.ui.setterPath}</dt>
      <dd>{i.setterPath}</dd>
      <dt>{t.ui.libero}</dt>
      <dd>{i.libero}</dd>
      <dt>{t.ui.risk}</dt>
      <dd>{i.risk}</dd>
    </dl>
  );
}
