import { useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { ChevronDown, ClipboardCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol } from '../lib/useCol';
import { useSession } from '../lib/session';
import { formatDateTime } from '../lib/format';
import { routes } from '../lib/router';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { ListCard, SectionHeader } from './common';
import type { FormSubmission } from '../types';

export default function MySubmissionsSection() {
  const { user } = useSession();
  const { data, loading } = useCol<FormSubmission & { formTitle?: string }>(user ? query(collection(db, 'form_submissions'), where('userId', '==', user.uid)) : null);
  const [open, setOpen] = useState<string | null>(null);
  const sorted = [...data].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
      <SectionHeader title="Le mie iscrizioni" description="Le iscrizioni inviate mentre eri connesso con il tuo account." />
      {loading ? (
        <SkeletonList count={3} className="h-16" />
      ) : sorted.length === 0 ? (
        <EmptyState icon={<ClipboardCheck size={26} />} title="Nessuna iscrizione" action={<a href={`#${routes.registrations}`} className="font-semibold text-primary">Scopri le iscrizioni aperte</a>} />
      ) : (
        <ListCard>
          {sorted.map((s) => (
            <div key={s.id}>
              <button onClick={() => setOpen(open === s.id ? null : s.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2" aria-expanded={open === s.id}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{s.formTitle || 'Iscrizione'}</span>
                  <span className="block text-xs text-muted">Inviata il {formatDateTime(s.timestamp)}</span>
                </span>
                <ChevronDown size={18} className={`text-muted transition-transform ${open === s.id ? 'rotate-180' : ''}`} />
              </button>
              {open === s.id && (
                <dl className="grid gap-x-6 gap-y-2 bg-surface-2/50 px-4 py-4 text-sm sm:grid-cols-2">
                  {Object.entries(s.data ?? {}).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-muted">{k}</dt>
                      <dd className="font-medium text-ink">{typeof v === 'boolean' ? (v ? 'Sì' : 'No') : v || '—'}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}
        </ListCard>
      )}
    </>
  );
}
