import { useId } from 'react';
import { cn } from '../lib/cn';

/** Marchio "vetrata": finestra ad arco con vetri colorati e croce dorata */
export function BrandMark({ className }: { className?: string }) {
  const clip = `brand-arch-${useId().replace(/:/g, '')}`;
  return (
    <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-night shadow-glow ring-1 ring-white/10', className)} aria-hidden>
      <svg viewBox="0 0 32 32" width="26" height="26">
        <defs>
          <clipPath id={clip}>
            <path d="M6 29V14a10 10 0 0 1 20 0v15z" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clip})`}>
          <rect x="0" y="0" width="16" height="17" fill="#2f5bd8" />
          <rect x="16" y="0" width="16" height="17" fill="#8a4fe0" />
          <rect x="0" y="17" width="16" height="15" fill="#13a37e" />
          <rect x="16" y="17" width="16" height="15" fill="#d23a55" />
        </g>
        <path d="M6 29V14a10 10 0 0 1 20 0v15z" fill="none" stroke="#0b1033" strokeWidth="1.6" />
        <path d="M16 7.5v18M10.5 14.5h11" stroke="#f3c86a" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Brand({ compact, inverted }: { compact?: boolean; inverted?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <BrandMark />
      <span className="min-w-0 leading-tight">
        <span className={cn('block font-serif text-[17px] font-semibold', inverted ? 'text-white' : 'text-ink')}>Unità Pastorale</span>
        {!compact && <span className={cn('block truncate text-xs', inverted ? 'text-white/60' : 'text-muted')}>Oppeano · Ca' degli Oppi</span>}
      </span>
    </span>
  );
}
