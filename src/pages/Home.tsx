import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useT } from '../i18n';
import { Ball2D } from '../components/Ball2D';
import { PageFade } from '../components/ui';
import { MiniCourt } from './MiniCourt';
import type { SystemId } from '../data/types';

const Ball3D = lazy(() => import('../three/Ball3D'));

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function Home() {
  const { t } = useT();
  const reduce = !!useReducedMotion();
  const [gl, setGl] = useState(false);
  useEffect(() => { setGl(webglOk()); }, []);
  const ids: SystemId[] = ['5-1', '6-2', '4-2'];
  return (
    <PageFade>
      <div className="page">
        <section className="hero">
          <div>
            <p className="kicker">{t.home.kicker}</p>
            <h1 className="bar">{t.home.title}</h1>
            <p className="lead">{t.home.lead}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link className="btn" to="/5-1">{t.home.cta} →</Link>
              <Link className="btn btn--ghost" to="/rules">{t.home.rulesCta}</Link>
            </div>
            <ul className="features">
              {t.home.features.map((f) => <li key={f} className="pill">{f}</li>)}
            </ul>
          </div>
          <div>
            <div className="ball-stage" aria-label={t.home.dragBall}>
              <Suspense fallback={<div className="ball-fallback"><svg viewBox="-1.2 -1.2 2.4 2.4" width="70%"><Ball2D r={1} /></svg></div>}>
                {gl ? (
                  <Ball3D still={reduce} />
                ) : (
                  <div className="ball-fallback"><svg viewBox="-1.2 -1.2 2.4 2.4" width="70%"><Ball2D r={1} /></svg></div>
                )}
              </Suspense>
            </div>
            <p className="muted" style={{ textAlign: 'center', fontSize: 13, margin: '4px 0 0' }}>↻ {t.home.dragBall}</p>
          </div>
        </section>

        <section>
          <div className="grid grid--3">
            {ids.map((id, i) => (
              <motion.div key={id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link to={`/${id}`} className="card sys-card">
                  <span className="num">{id}</span>
                  <span>{t.home.cards[id]}</span>
                  <span className="kicker" style={{ margin: 0 }}>{t.ui.learnMore} →</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <div className="grid grid--2" style={{ alignItems: 'center' }}>
            <div className="court-wrap" style={{ maxWidth: 420 }}>
              <MiniCourt />
            </div>
            <div>
              <h2 className="bar">{t.rules.rotationTitle}</h2>
              <ul className="bullets">{t.rules.rotation.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          </div>
        </section>
      </div>
    </PageFade>
  );
}
