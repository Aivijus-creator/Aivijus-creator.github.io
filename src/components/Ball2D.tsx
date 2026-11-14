import { motion } from 'framer-motion';
import { useReducedMotion } from './motion';
import { useId } from 'react';

export type Ball2DDesign = 'molten';

/** Shaded SVG ball (no logos): the white, green and red indoor ball. */
export function Ball2D({ r = 0.22, spinning = false, period = 0.6 }: { r?: number; spinning?: boolean; period?: number; design?: Ball2DDesign }) {
  const id = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const base = '#F4F3EE';
  return (
    <g>
      <defs>
        <clipPath id={`bc${id}`}>
          <circle r={r} />
        </clipPath>
        <radialGradient id={`bs${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#bc${id})`}>
        <circle r={r} fill={base} />
        <motion.g
          animate={spinning && !reduce ? { rotate: 360 } : { rotate: 0 }}
          transition={spinning ? { duration: period, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
        >
          <g transform={`scale(${r})`} strokeLinecap="round">
            <path d="M -1.2 -0.55 C -0.5 -0.95 0.4 -0.9 1.2 -0.4 L 1.2 -0.08 C 0.4 -0.55 -0.5 -0.6 -1.2 -0.22 Z" fill="#0B8F4D" />
            <path d="M -1.2 0.22 C -0.4 -0.12 0.4 -0.08 1.2 0.38 L 1.2 0.7 C 0.4 0.25 -0.4 0.2 -1.2 0.55 Z" fill="#D3202C" />
            <path d="M 0.15 1.2 C 0.3 0.95 0.6 0.85 1.2 0.85" fill="none" stroke="#0B8F4D" strokeWidth={0.12} />
            <g fill="none" stroke="rgba(0,0,0,.3)" strokeWidth={0.04}>
              <path d="M -1.2 -0.6 C -0.4 -1 0.5 -0.95 1.2 -0.45" />
              <path d="M -1.2 0.25 C -0.4 -0.1 0.4 -0.05 1.2 0.4" />
              <path d="M -0.1 1.2 C 0.1 0.6 0.5 0.3 1.2 0.05" />
            </g>
          </g>
        </motion.g>
        <circle r={r} fill={`url(#bs${id})`} />
      </g>
      <circle r={r} fill="none" stroke="rgba(0,0,0,.35)" strokeWidth={r * 0.06} />
      <ellipse cx={-r * 0.35} cy={-r * 0.42} rx={r * 0.28} ry={r * 0.16} fill="#fff" opacity={0.55} transform={`rotate(-25 ${-r * 0.35} ${-r * 0.42})`} />
    </g>
  );
}

export interface FlightSeg {
  from: { x: number; y: number };
  to: { x: number; y: number };
  height: number; // apex in meters
  duration: number;
}

/** Ball flying along arcs. Height lifts the ball up on screen and makes it bigger; shadow stays on the floor. */
export function BallFlight({ segs, design = 'molten', onDone }: { segs: FlightSeg[]; design?: Ball2DDesign; onDone?: () => void }) {
  const N = 10;
  const xs: number[] = [], ys: number[] = [], sc: number[] = [], sx: number[] = [], sy: number[] = [], ss: number[] = [], times: number[] = [];
  const total = segs.reduce((a, s) => a + s.duration, 0);
  let t0 = 0;
  const pops: { x: number; y: number; at: number }[] = [];
  segs.forEach((s, si) => {
    for (let i = si === 0 ? 0 : 1; i <= N; i++) {
      const u = i / N;
      const gx = s.from.x + (s.to.x - s.from.x) * u;
      const gy = s.from.y + (s.to.y - s.from.y) * u;
      const h = s.height * 4 * u * (1 - u);
      xs.push(gx);
      ys.push(gy - h * 0.55 - 0.6);
      sc.push(1 + h * 0.13);
      sx.push(gx);
      sy.push(gy);
      ss.push(Math.max(0.35, 1 - h * 0.12));
      times.push((t0 + s.duration * u) / total);
    }
    t0 += s.duration;
    pops.push({ x: s.to.x, y: s.to.y - 0.6, at: t0 });
  });
  const tr = { duration: total, times, ease: 'linear' as const };
  return (
    <g pointerEvents="none">
      <motion.ellipse rx={0.2} ry={0.08} fill="rgba(0,0,0,.25)" initial={{ x: sx[0], y: sy[0] }} animate={{ x: sx, y: sy, scale: ss }} transition={tr} />
      <motion.g initial={{ x: xs[0], y: ys[0] }} animate={{ x: xs, y: ys, scale: sc }} transition={tr} onAnimationComplete={onDone}>
        <Ball2D spinning design={design} />
      </motion.g>
      {pops.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={0.3} fill="none" stroke="#fff" strokeWidth={0.06}
          initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 0.9, 0], scale: [0.3, 0.6, 1.6] }}
          transition={{ delay: p.at - 0.05, duration: 0.35 }} />
      ))}
    </g>
  );
}
