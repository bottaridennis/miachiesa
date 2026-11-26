import { useState } from 'react';
import { initials } from '../../lib/format';
import { cn } from '../../lib/cn';

export function Avatar({ src, name, size = 40, className }: { src?: string | null; name?: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-soft to-primary-soft font-bold text-primary', className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src && !failed ? (
        <img src={src} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
