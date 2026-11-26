import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

export function Page({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={cn('mx-auto w-full px-4 pb-12 pt-6 sm:px-6 md:pb-12 md:pt-10', wide ? 'max-w-6xl' : 'max-w-4xl', className)}>
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action, icon }: { eyebrow?: string; title: ReactNode; description?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="flex items-start gap-4">
        {icon && <div className="bg-vetrata hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-gold-bright shadow-glow ring-1 ring-white/10 sm:flex">{icon}</div>}
        <div>
          {eyebrow && (
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-violet">
              <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-violet via-ruby to-gold-bright" />
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-semibold leading-tight sm:text-[2.75rem]">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-[15px] text-muted">{description}</p>}
        </div>
      </div>
      {action}
    </motion.header>
  );
}

export function SectionTitle({ title, icon, action, className }: { title: ReactNode; icon?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2', className)}>
      <h2 className="flex items-center gap-2.5 text-xl font-semibold sm:text-2xl">
        {icon && <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-soft text-violet [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>}
        {title}
      </h2>
      {action}
    </div>
  );
}
