import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

const control =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-subtle transition-colors hover:border-line-strong focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60';

interface WrapProps {
  label?: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
}

function Wrap({ label, hint, required, id, className, children }: WrapProps & { id: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-ink-2">
          {label}
          {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & WrapProps>(function Input(
  { label, hint, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fid = id ?? autoId;
  return (
    <Wrap label={label} hint={hint} required={rest.required} id={fid} className={className}>
      <input ref={ref} id={fid} className={control} {...rest} />
    </Wrap>
  );
});

export function Textarea({ label, hint, className, id, rows = 4, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & WrapProps) {
  const autoId = useId();
  const fid = id ?? autoId;
  return (
    <Wrap label={label} hint={hint} required={rest.required} id={fid} className={className}>
      <textarea id={fid} rows={rows} className={cn(control, "min-w-0", 'resize-y leading-relaxed')} {...rest} />
    </Wrap>
  );
}

export function Select({ label, hint, className, id, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & WrapProps) {
  const autoId = useId();
  const fid = id ?? autoId;
  return (
    <Wrap label={label} hint={hint} required={rest.required} id={fid} className={className}>
      <div className="relative">
        <select id={fid} className={cn(control, 'cursor-pointer appearance-none pr-10')} {...rest}>
          {children}
        </select>
        <ChevronDown size={18} aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </Wrap>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 py-1">
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input id={id} type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-surface-3 transition-colors peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/25" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
