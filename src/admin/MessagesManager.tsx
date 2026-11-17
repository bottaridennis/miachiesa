import { useState } from 'react';
import { collection, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { Inbox, Mail, Phone } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol } from '../lib/useCol';
import { formatDateTime, relativeTime } from '../lib/format';
import { cn } from '../lib/cn';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { Card } from '../components/ui/Card';
import { SectionHeader, useAction } from './common';
import type { MessageStatus, ServiceMessage } from '../types';

const STATUS: Record<MessageStatus, { label: string; tone: 'danger' | 'warning' | 'success' }> = {
  nuova: { label: 'Nuova', tone: 'danger' },
  in_lavorazione: { label: 'In lavorazione', tone: 'warning' },
  completata: { label: 'Completata', tone: 'success' },
};

export default function MessagesManager() {
  const { run, remove } = useAction();
  const { data, loading } = useCol<ServiceMessage>(query(collection(db, 'messages'), orderBy('timestamp', 'desc')));
  const [filter, setFilter] = useState<'aperte' | 'tutte'>('aperte');
  const messages = data.filter((m) => filter === 'tutte' || (m.status ?? 'nuova') !== 'completata');

  const setStatus = (m: ServiceMessage, status: MessageStatus) => run(() => updateDoc(doc(db, 'messages', m.id), { status }), `Segnata come "${STATUS[status].label}"`);

  return (
    <>
      <SectionHeader
        title="Richieste alla segreteria"
        description="Messaggi inviati dal modulo della pagina Segreteria."
        extra={
          <div className="flex rounded-xl bg-surface-2 p-1">
            {(['aperte', 'tutte'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn('rounded-lg px-3 py-1.5 text-sm font-semibold capitalize', filter === f ? 'bg-surface text-ink shadow-sm' : 'text-muted')}>
                {f}
              </button>
            ))}
          </div>
        }
      />
      {loading ? (
        <SkeletonList count={3} className="h-32" />
      ) : messages.length === 0 ? (
        <EmptyState icon={<Inbox size={26} />} title={filter === 'aperte' ? 'Nessuna richiesta da gestire' : 'Nessuna richiesta'} description={filter === 'aperte' ? 'Ottimo lavoro! 🎉' : undefined} />
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const status = m.status ?? 'nuova';
            return (
              <Card key={m.id} className={cn('p-5', status === 'completata' && 'opacity-70')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>
                      <Badge tone="primary">{m.service}</Badge>
                    </div>
                    <p className="font-semibold text-ink">{m.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.service)}`} className="flex items-center gap-1.5 text-primary hover:underline">
                        <Mail size={14} /> {m.email}
                      </a>
                      {m.phone && (
                        <a href={`tel:${m.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 text-primary hover:underline">
                          <Phone size={14} /> {m.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted" title={formatDateTime(m.timestamp)}>{relativeTime(m.timestamp)}</span>
                </div>
                {m.message && <p className="mt-3 whitespace-pre-line rounded-xl bg-surface-2 p-3 text-sm text-ink-2">{m.message}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {status !== 'in_lavorazione' && status !== 'completata' && <Button size="sm" variant="secondary" onClick={() => setStatus(m, 'in_lavorazione')}>Prendi in carico</Button>}
                  {status !== 'completata' ? (
                    <Button size="sm" onClick={() => setStatus(m, 'completata')}>Segna completata</Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setStatus(m, 'nuova')}>Riapri</Button>
                  )}
                  <Button size="sm" variant="ghost" className="ml-auto text-danger" onClick={() => remove('la richiesta', () => deleteDoc(doc(db, 'messages', m.id)))}>
                    Elimina
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
