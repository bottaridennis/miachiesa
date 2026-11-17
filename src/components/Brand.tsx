import { cn } from '../lib/cn';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1f3a68] text-gold-bright shadow-sm ring-1 ring-white/10', className)} aria-hidden>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M12 3v18M6.5 8.5h11" />
      </svg>
    </span>
  );
}

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <BrandMark />
      <span className="min-w-0 leading-tight">
        <span className="block font-serif text-[17px] font-semibold text-ink">Unità Pastorale</span>
        {!compact && <span className="block truncate text-xs text-muted">Oppeano · Ca' degli Oppi</span>}
      </span>
    </span>
  );
}
