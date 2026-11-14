import { motion } from 'framer-motion';
import { useReducedMotion } from './motion';
import type { Pose, RoleKind } from '../data/types';
import { ROLE_BADGE } from '../data/roles';

type P = [number, number];
interface PoseDef {
  lK: P; lF: P; rK: P; rF: P; lE: P; lH: P; rE: P; rH: P; lift: number;
}

const HIP_L: P = [-0.07, -0.5];
const HIP_R: P = [0.07, -0.5];
const SH_L: P = [-0.15, -0.92];
const SH_R: P = [0.15, -0.92];

const mirror = (l: P[]): P[] => l.map(([x, y]) => [-x, y]);

function sym(knee: P, foot: P, elbow: P, hand: P, lift = 0): PoseDef {
  const [rK, rF, rE, rH] = mirror([knee, foot, elbow, hand]);
  return { lK: knee, lF: foot, rK, rF, lE: elbow, lH: hand, rE, rH, lift };
}

export const POSES: Record<Pose, PoseDef> = {
  ready: sym([-0.14, -0.26], [-0.16, 0], [-0.24, -0.72], [-0.17, -0.57]),
  pass: sym([-0.16, -0.24], [-0.2, 0], [-0.14, -0.7], [-0.03, -0.5]),
  set: sym([-0.09, -0.26], [-0.11, 0], [-0.24, -1.12], [-0.08, -1.3]),
  wait: sym([-0.15, -0.28], [-0.16, 0], [-0.22, -0.6], [-0.13, -0.3]),
  block: { ...sym([-0.07, -0.26], [-0.07, 0], [-0.14, -1.2], [-0.12, -1.45]), lift: 0.14 },
  attack: { lK: [-0.12, -0.3], lF: [-0.08, -0.06], rK: [0.12, -0.3], rF: [0.08, -0.06], lE: [-0.2, -1.12], lH: [-0.24, -1.32], rE: [0.26, -1.2], rH: [0.14, -1.46], lift: 0.26 },
  serve: { lK: [-0.06, -0.26], lF: [-0.1, 0], rK: [0.13, -0.26], rF: [0.2, 0], lE: [-0.13, -1.18], lH: [-0.11, -1.44], rE: [0.27, -1.04], rH: [0.32, -1.24], lift: 0 },
  run: { lK: [-0.2, -0.3], lF: [-0.3, -0.12], rK: [0.1, -0.24], rF: [0.13, 0], lE: [-0.24, -0.76], lH: [-0.14, -0.62], rE: [0.25, -0.8], rH: [0.3, -0.68], lift: 0.02 },
};
const RUN_B: PoseDef = { lK: [-0.1, -0.24], lF: [-0.13, 0], rK: [0.2, -0.3], rF: [0.3, -0.12], lE: [-0.25, -0.8], lH: [-0.3, -0.68], rE: [0.24, -0.76], rH: [0.14, -0.62], lift: 0.02 };

const limb = (a: P, b: P, c: P) => `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]}`;

function limbs(p: PoseDef) {
  return {
    ll: limb(HIP_L, p.lK, p.lF),
    rl: limb(HIP_R, p.rK, p.rF),
    la: limb(SH_L, p.lE, p.lH),
    ra: limb(SH_R, p.rE, p.rH),
  };
}

export interface FigureProps {
  pose: Pose;
  label: string;
  labelSmall?: boolean;
  badge: string;
  kind: RoleKind;
  zone: number;
  showZoneBadge: boolean;
  icon?: string;
  selected?: boolean;
  highlight?: boolean;
  faded?: boolean;
  jersey?: string; // shirt colour override
  hideBadge?: boolean;
  lean?: number;
}

const SPRING = { type: 'spring', stiffness: 170, damping: 22 } as const;

export function Figure({ pose, label, labelSmall, badge, kind, zone, showZoneBadge, icon, selected, highlight, faded, jersey, hideBadge, lean = 0 }: FigureProps) {
  const reduce = useReducedMotion();
  const def = POSES[pose];
  const L = limbs(def);
  const isLib = kind === 'libero';
  const body = faded ? '#9a98a0' : 'var(--figure)';
  const shirt = faded ? '#b9b7bd' : isLib ? '#ffffff' : jersey ?? 'var(--jersey)';
  const numColor = isLib ? '#B3122E' : '#ffffff';
  const t = reduce ? { duration: 0 } : SPRING;
  const runAnim = pose === 'run' && !reduce;
  const B = limbs(RUN_B);
  const pathAnim = (k: keyof ReturnType<typeof limbs>) =>
    runAnim ? { d: [L[k], B[k], L[k]] } : { d: L[k] };
  const pathTrans = runAnim ? { duration: 0.32, repeat: Infinity, ease: 'easeInOut' as const } : t;
  const rb = ROLE_BADGE[kind];
  const lift = def.lift;

  return (
    <g opacity={faded ? 0.55 : 1}>
      {/* selection glow + shadow mark the exact foot position */}
      {selected && <ellipse cx={0} cy={0} rx={0.46} ry={0.19} fill="none" stroke="var(--accent-500)" strokeWidth={0.07} opacity={0.9} />}
      {highlight && !selected && (
        <motion.ellipse cx={0} cy={0} rx={0.44} ry={0.18} fill="none" stroke="var(--sun-500)" strokeWidth={0.07}
          animate={reduce ? undefined : { opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
      )}
      <motion.ellipse cx={0} cy={0} rx={0.3} ry={0.11} fill="rgba(0,0,0,0.28)" animate={{ scale: 1 - lift * 1.2 }} transition={t} />
      <motion.g animate={{ y: -lift, rotate: lean }} transition={t}>
        <motion.g
          animate={reduce || runAnim ? { y: 0 } : { y: [0, -0.025, 0] }}
          transition={reduce || runAnim ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <g>
            <g fill="none" stroke={body} strokeWidth={0.075} strokeLinecap="round" strokeLinejoin="round">
              <motion.path initial={false} animate={pathAnim('ll')} transition={pathTrans} />
              <motion.path initial={false} animate={pathAnim('rl')} transition={pathTrans} />
              <motion.path initial={false} animate={pathAnim('la')} transition={pathTrans} />
              <motion.path initial={false} animate={pathAnim('ra')} transition={pathTrans} />
            </g>
            {/* jersey */}
            <path d="M -0.19 -0.96 Q 0 -1.0 0.19 -0.96 L 0.15 -0.48 Q 0 -0.45 -0.15 -0.48 Z" fill={shirt}
              stroke={isLib ? '#B3122E' : faded ? 'none' : 'rgba(0,0,0,.18)'} strokeWidth={isLib ? 0.05 : 0.02} strokeLinejoin="round" />
            {isLib && <path d="M -0.17 -0.62 L 0.17 -0.62" stroke="#B3122E" strokeWidth={0.04} />}
            <circle cx={0} cy={-1.12} r={0.13} fill={body} />
            <text x={0} y={-0.66} textAnchor="middle" fill={numColor} fontFamily="Manrope, sans-serif" fontWeight={700}
              fontSize={labelSmall ? 0.13 : label.length > 2 ? 0.17 : 0.24}>{label}</text>
          </g>
        </motion.g>
      </motion.g>
      {showZoneBadge && (
        <g transform="translate(0.33 -1.02)">
          <circle r={0.14} fill="var(--white)" stroke="var(--ink)" strokeWidth={0.025} />
          <text y={0.055} textAnchor="middle" fontFamily="Manrope, sans-serif" fontWeight={600} fontSize={0.16} fill="var(--ink)">{zone}</text>
        </g>
      )}
      {!hideBadge && (
        <g transform="translate(0 0.3)">
          <rect x={-0.3} y={-0.13} width={0.6} height={0.26} rx={0.13} fill={rb.bg} stroke={rb.border ?? 'none'} strokeWidth={0.03} />
          <text y={0.06} textAnchor="middle" fontFamily="Manrope, sans-serif" fontWeight={600} fontSize={0.17} fill={rb.fg}>{badge}</text>
        </g>
      )}
      {icon && (
        <text x={-0.36} y={-1.12} fontSize={0.26} textAnchor="middle">{icon}</text>
      )}
    </g>
  );
}
