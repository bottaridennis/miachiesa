import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center', className)}>
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">{icon}</div>}
      <p className="font-serif text-lg font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} />;
}

export function SkeletonList({ count = 3, className = 'h-24' }: { count?: number; className?: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Caricamento">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}

export function Notice({ tone = 'info', children, icon }: { tone?: 'info' | 'warning' | 'success' | 'danger'; children: ReactNode; icon?: ReactNode }) {
  const styles = {
    info: 'bg-primary-soft text-primary border-primary/15',
    warning: 'bg-warning-soft text-warning border-warning/20',
    success: 'bg-success-soft text-success border-success/20',
    danger: 'bg-danger-soft text-danger border-danger/20',
  }[tone];
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium', styles)}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="flex-1">{children}</div>
    </div>
  );
}
