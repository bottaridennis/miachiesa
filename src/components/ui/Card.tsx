import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, interactive, ...rest }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-surface shadow-card',
        interactive && 'cursor-pointer transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-float',
        className,
      )}
      {...rest}
    />
  );
}
