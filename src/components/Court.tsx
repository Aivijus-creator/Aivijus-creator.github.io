import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useRef, type ReactNode, type PointerEvent as RPE } from 'react';
import type { PlayerId, Pose, RoleKind, Spot, Zone } from '../data/types';
import { Figure } from './Figure';
import { ZONE_CENTER } from '../data/zones';

export interface CourtPlayer {
  id: PlayerId;
  zone: Zone;
  x: number;
  y: number;
  pose: Pose;
  label: string;
  labelSmall?: boolean;
  badge: string;
  kind: RoleKind;
  icon?: string;
  selected?: boolean;
  highlight?: boolean;
  faded?: boolean;
  gone?: boolean;
  path?: { xs: number[]; ys: number[]; delay: number; duration: number };
  lean?: number;
  ariaLabel: string;
  jersey?: string;
}

export interface Arrow {
  key: string;
  from: Spot;
  to: Spot;
  dim?: boolean;
}

export interface OverlapLine {
  key: string;
  a: Spot;
  b: Spot;
  ok: boolean;
  label: string;
  focus?: boolean;
}

interface Props {
  players: CourtPlayer[];
  arrows?: Arrow[];
  overlap?: OverlapLine[];
  highlightZone?: Zone | null;
  showZoneBadge?: boolean;
  onPlayerTap?: (id: PlayerId) => void;
  onBackgroundTap?: (zone: Zone | null, pt: Spot) => void;
  draggable?: boolean;
  onDrag?: (id: PlayerId, x: number, y: number) => void;
  overlay?: ReactNode;
  beach?: boolean;
  showTarget?: Spot | null;
  opponents?: CourtPlayer[];
  hideZones?: boolean;
  ariaLabel?: string;
  extra?: ReactNode;
}

const SPRING = { type: 'spring', stiffness: 170, damping: 22 } as const;

export function zoneAt(x: number, y: number): Zone | null {
  if (x < 0 || x > 9 || y < 0 || y > 9) return null;
  const col = x < 3 ? 0 : x < 6 ? 1 : 2;
  return (y < 3 ? [4, 3, 2] : [5, 6, 1])[col] as Zone;
}

export function Court({ players, arrows = [], overlap = [], highlightZone, showZoneBadge = true, onPlayerTap, onBackgroundTap, draggable, onDrag, overlay, beach, showTarget, opponents = [], hideZones, ariaLabel, extra }: Props) {
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: PlayerId; sx: number; sy: number; moved: boolean } | null>(null);
  const W = beach ? 8 : 9;
  const vb = beach ? '-1.1 -3.4 10.2 13.6' : '-1.1 -3.4 11.2 14.6';

  const toSvg = (e: { clientX: number; clientY: number }): Spot => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    const p = m ? pt.matrixTransform(m.inverse()) : pt;
    return { x: p.x, y: p.y };
  };

  const onPDown = (id: PlayerId) => (e: RPE) => {
    e.stopPropagation();
    drag.current = { id, sx: e.clientX, sy: e.clientY, moved: false };
    if (draggable) (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onPMove = (e: RPE) => {
    const d = drag.current;
    if (!d || !draggable) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) d.moved = true;
    if (d.moved) {
      const p = toSvg(e);
      onDrag?.(d.id, Math.max(-0.8, Math.min(W + 0.8, p.x)), Math.max(0.05, Math.min(10.4, p.y)));
    }
  };
  const onPUp = (id: PlayerId) => (e: RPE) => {
    e.stopPropagation();
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) onPlayerTap?.(id);
  };

  const bgTap = (e: RPE) => {
    if (!onBackgroundTap) return;
    const p = toSvg(e);
    onBackgroundTap(beach ? null : zoneAt(p.x, p.y), p);
  };

  const ordered = [...players].sort((a, b) => Number(!!a.selected) - Number(!!b.selected) || a.y - b.y);
  const line = 'var(--court-line)';

  return (
    <svg ref={svgRef} className="court-svg" viewBox={vb} role="img" aria-label={ariaLabel} onPointerMove={onPMove}>
      <defs>
        <marker id="arrowhead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 1 1 L 8 5 L 1 9" fill="none" stroke="var(--accent-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        {beach && (
          <pattern id="grain" width="0.6" height="0.6" patternUnits="userSpaceOnUse">
            <circle cx="0.1" cy="0.15" r="0.025" fill="rgba(120,90,40,.25)" />
            <circle cx="0.42" cy="0.35" r="0.02" fill="rgba(120,90,40,.2)" />
            <circle cx="0.25" cy="0.5" r="0.018" fill="rgba(255,255,255,.35)" />
          </pattern>
        )}
      </defs>
      {/* background (free zone) catches taps */}
      <rect x={-1.1} y={-3.4} width={W + 2.2} height={beach ? 13.6 : 14.6} fill="transparent" onPointerUp={bgTap} />
      {/* opponent half (faded) */}
      <rect x={0} y={-3.4} width={W} height={3.4} fill="var(--opp-half)" pointerEvents="none" />
      {!beach && <line x1={0} y1={-3} x2={W} y2={-3} stroke={line} strokeOpacity={0.35} strokeWidth={0.05} />}
      {opponents.map((o) => (
        <g key={'o' + o.id} transform={`translate(${o.x} ${o.y})`} pointerEvents="none">
          <Figure pose={o.pose} label="" badge="" kind="oh" zone={0} showZoneBadge={false} faded hideBadge />
        </g>
      ))}
      {/* floor */}
      <rect x={0} y={0} width={W} height={W} fill="var(--court)" onPointerUp={bgTap} />
      {beach && <rect x={0} y={0} width={W} height={W} fill="url(#grain)" pointerEvents="none" />}
      {highlightZone && (
        <rect x={ZONE_CENTER[highlightZone].x - 1.5} y={highlightZone >= 2 && highlightZone <= 4 ? 0 : 3} width={3} height={highlightZone >= 2 && highlightZone <= 4 ? 3 : 6}
          fill="var(--accent-500)" opacity={0.16} pointerEvents="none" />
      )}
      <g pointerEvents="none">
        {!hideZones && !beach && (
          <g stroke={line} strokeOpacity={0.55} strokeWidth={0.03} strokeDasharray="0.15 0.15">
            <line x1={3} y1={0} x2={3} y2={9} />
            <line x1={6} y1={0} x2={6} y2={9} />
          </g>
        )}
        {beach && <line x1={4} y1={0} x2={4} y2={8} stroke={line} strokeOpacity={0.4} strokeWidth={0.04} strokeDasharray="0.2 0.2" />}
        {!hideZones && !beach &&
          ([1, 2, 3, 4, 5, 6] as Zone[]).map((z) => (
            <text key={z} x={ZONE_CENTER[z].x} y={z >= 2 && z <= 4 ? 2.5 : 8.4} textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight={700} fontSize={0.9}
              fill="var(--ink)" opacity={0.07}>{z}</text>
          ))}
        {/* court lines with a soft outline so they read on a light floor */}
        <g fill="none" strokeLinecap="square">
          <rect x={0} y={0} width={W} height={W} stroke="var(--court-line-outline)" strokeWidth={0.12} />
          <rect x={0} y={0} width={W} height={W} stroke={line} strokeWidth={0.07} />
          {!beach && <line x1={0} y1={3} x2={9} y2={3} stroke="var(--court-line-outline)" strokeWidth={0.12} />}
          {!beach && <line x1={0} y1={3} x2={9} y2={3} stroke={line} strokeWidth={0.07} />}
        </g>
        {/* net */}
        <line x1={-0.6} y1={0} x2={W + 0.6} y2={0} stroke="var(--net)" strokeWidth={0.14} strokeLinecap="round" />
        <line x1={-0.6} y1={-0.06} x2={W + 0.6} y2={-0.06} stroke="#fff" strokeOpacity={0.7} strokeWidth={0.03} />
        <line x1={0} y1={-0.35} x2={0} y2={0.1} stroke="#E0283F" strokeWidth={0.06} />
        <line x1={W} y1={-0.35} x2={W} y2={0.1} stroke="#E0283F" strokeWidth={0.06} />
        {showTarget && (
          <g transform={`translate(${showTarget.x} ${showTarget.y})`}>
            <circle r={0.32} fill="none" stroke="#F2B705" strokeWidth={0.05} strokeDasharray="0.1 0.08" />
            <circle r={0.07} fill="#F2B705" />
          </g>
        )}
      </g>
      {/* overlap lines */}
      <g pointerEvents="none">
        <AnimatePresence>
          {overlap.map((o) => (
            <motion.g key={o.key} initial={{ opacity: 0 }} animate={{ opacity: o.ok ? (o.focus ? 1 : 0.85) : [1, 0.45, 1] }} exit={{ opacity: 0 }}
              transition={o.ok || reduce ? { duration: 0.3 } : { duration: 1.2, repeat: Infinity }}>
              <line x1={o.a.x} y1={o.a.y} x2={o.b.x} y2={o.b.y} stroke={o.ok ? 'var(--ok)' : 'var(--bad)'} strokeWidth={o.focus ? 0.09 : 0.05} strokeLinecap="round" />
              <g transform={`translate(${(o.a.x + o.b.x) / 2} ${(o.a.y + o.b.y) / 2})`}>
                <rect x={-0.34} y={-0.15} width={0.68} height={0.3} rx={0.15} fill={o.ok ? 'var(--ok)' : 'var(--bad)'} />
                <text y={0.07} textAnchor="middle" fontSize={0.18} fontFamily="'Barlow Condensed', sans-serif" fontWeight={600} fill="#fff">{o.label}</text>
              </g>
            </motion.g>
          ))}
        </AnimatePresence>
      </g>
      {/* movement arrows draw themselves */}
      <g pointerEvents="none">
        <AnimatePresence>
          {arrows.map((a) => {
            const dx = a.to.x - a.from.x, dy = a.to.y - a.from.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len, uy = dy / len;
            const s = { x: a.from.x + ux * 0.35, y: a.from.y + uy * 0.35 };
            const e = { x: a.to.x - ux * 0.35, y: a.to.y - uy * 0.35 };
            const c = { x: (s.x + e.x) / 2 - uy * len * 0.12, y: (s.y + e.y) / 2 + ux * len * 0.12 };
            return (
              <motion.path key={a.key} d={`M ${s.x} ${s.y} Q ${c.x} ${c.y} ${e.x} ${e.y}`} fill="none" stroke="var(--accent-500)" strokeWidth={0.07}
                strokeLinecap="round" markerEnd="url(#arrowhead)" opacity={a.dim ? 0.35 : 0.95}
                initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.6, ease: 'easeOut' }} />
            );
          })}
        </AnimatePresence>
      </g>
      {/* players */}
      {ordered.map((p) => {
        const anim = p.path && !reduce
          ? { x: p.path.xs, y: p.path.ys, opacity: p.gone ? 0 : 1 }
          : { x: p.x, y: p.y, opacity: p.gone ? 0 : 1 };
        const trans = reduce || (draggable && drag.current?.id === p.id)
          ? { duration: 0 }
          : p.path
            ? { duration: p.path.duration, delay: p.path.delay, ease: 'easeInOut' as const, opacity: { duration: 0.3 } }
            : { ...SPRING, opacity: { duration: 0.35 } };
        return (
          <motion.g key={p.id} className="player" initial={false} animate={anim} transition={trans}
            role="button" tabIndex={p.gone ? -1 : 0} aria-label={p.ariaLabel} aria-hidden={p.gone || undefined}
            pointerEvents={p.gone ? 'none' : undefined}
            onPointerDown={onPDown(p.id)} onPointerUp={onPUp(p.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlayerTap?.(p.id); } }}>
            {/* generous hit area */}
            <rect x={-0.45} y={-1.35} width={0.9} height={1.85} fill="transparent" />
            <Figure pose={p.pose} label={p.label} labelSmall={p.labelSmall} badge={p.badge} kind={p.kind} zone={p.zone} showZoneBadge={showZoneBadge}
              icon={p.icon} selected={p.selected} highlight={p.highlight} faded={p.faded} lean={p.lean} jersey={p.jersey} />
          </motion.g>
        );
      })}
      {extra}
      {overlay}
    </svg>
  );
}
