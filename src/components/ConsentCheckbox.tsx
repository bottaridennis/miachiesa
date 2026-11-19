import type { ReactNode } from 'react';
import { routes } from '../lib/router';

/** Casella di consenso: mai preselezionata (art. 7 GDPR e considerando 32) */
export function ConsentCheckbox({ checked, onChange, required, children }: { checked: boolean; onChange: (v: boolean) => void; required?: boolean; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-2/50 p-3.5 text-sm leading-relaxed text-ink-2 transition-colors hover:border-line-strong">
      <input type="checkbox" required={required} checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]" />
      <span>
        {children}
        {required ? <span className="text-danger"> *</span> : <span className="text-muted"> (facoltativo)</span>}
      </span>
    </label>
  );
}

export function PrivacyLink({ children = 'informativa privacy' }: { children?: ReactNode }) {
  return (
    <a href={`#${routes.privacy}`} target="_blank" rel="noopener" className="font-semibold text-primary underline-offset-2 hover:underline" onClick={(e) => e.stopPropagation()}>
      {children}
    </a>
  );
}
