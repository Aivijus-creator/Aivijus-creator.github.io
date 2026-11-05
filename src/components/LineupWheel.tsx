import type { PlayerId } from '../data/types';
import { useT } from '../i18n';
import { roleKind, ROLE_BADGE } from '../data/roles';

/** Six players on a hexagon in court layout order, with clockwise arrows. */
export function LineupWheel({ lineup }: { lineup: PlayerId[] }) {
  const { t } = useT();
  // hexagon positions per zone (net at top): 4 top-left, 3 top, 2 top-right, 1 bottom-right, 6 bottom, 5 bottom-left
  const pos: Record<number, [number, number]> = { 4: [28, 36], 3: [75, 18], 2: [122, 36], 1: [122, 114], 6: [75, 132], 5: [28, 114] };
  return (
    <svg className="wheel" viewBox="0 0 150 150" role="img" aria-label={t.ui.rotationOrder}>
      <circle cx={75} cy={75} r={52} fill="none" stroke="var(--accent-500)" strokeWidth={2} strokeDasharray="4 5" />
      <path d="M 118 66 l 5 9 l 5 -9" fill="none" stroke="var(--accent-500)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 32 84 l -5 -9 l -5 9" fill="none" stroke="var(--accent-500)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {lineup.map((id, i) => {
        const [x, y] = pos[i + 1];
        const b = ROLE_BADGE[roleKind(id)];
        return (
          <g key={id} transform={`translate(${x} ${y})`}>
            <circle r={16} fill={b.bg} stroke={b.border ?? 'none'} strokeWidth={2} />
            <text y={4.5} textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight={600} fontSize={12} fill={b.fg}>{t.code[id]}</text>
            <text x={14} y={-11} fontSize={10} fontFamily="Oswald" fill="var(--muted)">{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}
