import { AnimatePresence, motion } from 'framer-motion';
import { useId, type ReactNode } from 'react';

export function Tabs<T extends string>({ items, value, onChange, label }: { items: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label?: string }) {
  const lid = useId();
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map((it) => (
        <button key={it.id} role="tab" aria-selected={value === it.id} onClick={() => onChange(it.id)}>
          {it.label}
          {value === it.id && <motion.span layoutId={`tab-${lid}`} className="tabs__line" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
        </button>
      ))}
    </div>
  );
}

export function Seg<T extends string>({ items, value, onChange, label }: { items: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {items.map((it) => (
        <button key={it.id} aria-pressed={value === it.id} onClick={() => onChange(it.id)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button className="chip" aria-pressed={on} onClick={() => onChange(!on)}>
      <span aria-hidden>{on ? '●' : '○'}</span>
      {children}
    </button>
  );
}

export function Toast({ msg }: { msg: string | null }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div key={msg} className="toast" role="status" initial={{ opacity: 0, y: 12, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 12, x: '-50%' }}>
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PageFade({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
