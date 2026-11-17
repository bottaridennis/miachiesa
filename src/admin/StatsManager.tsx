import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where, type Query } from 'firebase/firestore';
import { ClipboardCheck, Eye, Inbox, Megaphone, UserRound, Users, type LucideIcon } from 'lucide-react';
import { db } from '../lib/firebase';
import { useSession } from '../lib/session';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Feedback';
import { SectionHeader } from './common';

interface Stat {
  key: string;
  label: string;
  icon: LucideIcon;
  q: Query;
  superOnly?: boolean;
}

export default function StatsManager() {
  const { isSuperAdmin } = useSession();
  const [values, setValues] = useState<Record<string, number | null>>({});

  const stats: Stat[] = [
    { key: 'visitors', label: 'Visitatori unici', icon: Eye, q: collection(db, 'visitors') },
    { key: 'users', label: 'Utenti registrati', icon: UserRound, q: collection(db, 'users'), superOnly: true },
    { key: 'notices', label: 'Avvisi pubblicati', icon: Megaphone, q: collection(db, 'notices') },
    { key: 'subs', label: 'Iscrizioni ricevute', icon: ClipboardCheck, q: collection(db, 'form_submissions') },
    { key: 'msgs', label: 'Richieste da gestire', icon: Inbox, q: query(collection(db, 'messages'), where('status', '==', 'nuova')) },
    { key: 'groups', label: 'Gruppi', icon: Users, q: collection(db, 'groups') },
  ].filter((s) => !s.superOnly || isSuperAdmin);

  useEffect(() => {
    // Conteggi lato server: non scarica tutti i documenti (prima venivano letti tutti i visitatori)
    stats.forEach((s) =>
      getCountFromServer(s.q)
        .then((r) => setValues((v) => ({ ...v, [s.key]: r.data().count })))
        .catch(() => setValues((v) => ({ ...v, [s.key]: null }))),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  return (
    <>
      <SectionHeader title="Statistiche" description="Una panoramica dell'utilizzo dell'app." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.key} className="p-5">
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <s.icon size={19} />
            </span>
            {values[s.key] === undefined ? <Skeleton className="h-9 w-16" /> : <p className="font-serif text-4xl font-semibold text-ink">{values[s.key] ?? '—'}</p>}
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
