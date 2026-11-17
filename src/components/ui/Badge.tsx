import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'neutral' | 'primary' | 'gold' | 'success' | 'warning' | 'danger' | 'oppeano' | 'cadeglioppi';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2',
  primary: 'bg-primary-soft text-primary',
  gold: 'bg-gold-soft text-gold',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  oppeano: 'bg-oppeano-soft text-oppeano',
  cadeglioppi: 'bg-cadeglioppi-soft text-cadeglioppi',
};

export function Badge({ tone = 'neutral', children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function ParishBadge({ parish, className }: { parish?: string; className?: string }) {
  if (!parish) return null;
  const tone: Tone = parish === 'Oppeano' ? 'oppeano' : parish === "Ca' degli Oppi" ? 'cadeglioppi' : 'neutral';
  return (
    <Badge tone={tone} className={className}>
      {parish}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category?: string }) {
  if (!category) return null;
  const tone: Tone = category === 'Urgente' ? 'danger' : category === 'Notizia' ? 'primary' : category === 'Riflessione' ? 'gold' : 'neutral';
  return <Badge tone={tone}>{category}</Badge>;
}
