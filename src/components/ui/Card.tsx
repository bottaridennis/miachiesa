import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, interactive, ...rest }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'glass rounded-2xl border border-white/70 shadow-card dark:border-white/[0.06]',
        interactive && 'cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-violet/30 hover:shadow-float',
        className,
      )}
      {...rest}
    />
  );
}
