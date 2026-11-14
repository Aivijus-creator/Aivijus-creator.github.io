import { lazy, Suspense, useEffect, useState } from 'react';
import { useReducedMotion } from './motion';
import { Ball2D } from './Ball2D';
import type { BallDesign } from '../three/Ball3D';

const Ball3D = lazy(() => import('../three/Ball3D'));

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Lazy-loaded 3D ball with a shaded SVG fallback. */
export function BallStage({ design, label, size }: { design: BallDesign; label: string; size?: number }) {
  const reduce = !!useReducedMotion();
  const [gl, setGl] = useState(false);
  useEffect(() => {
    setGl(webglOk());
  }, []);
  const fallback = (
    <div className="ball-fallback">
      <svg viewBox="-1.2 -1.2 2.4 2.4" width="70%"><Ball2D r={1} design={design} spinning period={6} /></svg>
    </div>
  );
  return (
    <div className="ball-stage" aria-label={label} role="img" style={size ? { maxWidth: size } : undefined}>
      <Suspense fallback={fallback}>{gl ? <Ball3D still={reduce} design={design} /> : fallback}</Suspense>
    </div>
  );
}
