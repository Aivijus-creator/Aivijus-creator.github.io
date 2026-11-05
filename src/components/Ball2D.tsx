import { motion, useReducedMotion } from 'framer-motion';
import { useId } from 'react';

/** Shaded SVG ball in the classic blue/yellow look (no logos). Centered at (0,0), radius r. */
export function Ball2D({ r = 0.22, spinning = false, colors = ['#FFC72C', '#1565C0'] }: { r?: number; spinning?: boolean; colors?: [string, string] }) {
  const id = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const [c1, c2] = colors;
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
        <circle r={r} fill={c1} />
        <motion.g
          animate={spinning && !reduce ? { rotate: 360 } : { rotate: 0 }}
          transition={spinning ? { duration: 0.6, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
        >
          <g transform={`scale(${r})`} strokeLinecap="round">
            {/* curved panels */}
            <path d="M -1.2 -0.35 C -0.5 -0.75 0.4 -0.7 1.2 -0.2 L 1.2 0.18 C 0.4 -0.3 -0.5 -0.35 -1.2 0.05 Z" fill={c2} />
            <path d="M -0.55 1.2 C -0.2 0.5 0.15 0.2 0.85 -0.15 L 1.2 0.5 C 0.6 0.6 0.25 0.9 0.05 1.3 Z" fill={c2} />
            <path d="M -1.2 0.45 C -0.8 0.3 -0.45 0.45 -0.3 1.2" fill="none" stroke={c2} strokeWidth={0.22} />
            <g fill="none" stroke="rgba(0,0,0,.35)" strokeWidth={0.05}>
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
export function BallFlight({ segs, colors, onDone }: { segs: FlightSeg[]; colors?: [string, string]; onDone?: () => void }) {
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
        <Ball2D spinning colors={colors} />
      </motion.g>
      {pops.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={0.3} fill="none" stroke="#fff" strokeWidth={0.06}
          initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 0.9, 0], scale: [0.3, 0.6, 1.6] }}
          transition={{ delay: p.at - 0.05, duration: 0.35 }} />
      ))}
    </g>
  );
}
