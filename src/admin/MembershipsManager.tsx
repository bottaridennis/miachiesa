import { Fragment } from 'react';
import { collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Check, UserCheck, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol } from '../lib/useCol';
import { useGroups } from '../lib/data';
import { relativeTime } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { ListCard, SectionHeader, useAction } from './common';
import type { GroupMember } from '../types';

export default function MembershipsManager() {
  const { run, remove } = useAction();
  const { data: members, loading } = useCol<GroupMember>(collection(db, 'group_members'));
  const { data: groups } = useGroups();
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? 'Gruppo eliminato';
  const pending = members.filter((m) => !m.isVerified).sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  const verified = members.filter((m) => m.isVerified).sort((a, b) => groupName(a.groupId).localeCompare(groupName(b.groupId)));

  const Row = ({ m, children }: { m: GroupMember; children: React.ReactNode }) => (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <Avatar name={m.userName || m.userEmail} size={38} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{m.userName || m.userEmail}</p>
        <p className="truncate text-xs text-muted">
          {m.userName && <>{m.userEmail} · </>}
          <span className="font-semibold text-ink-2">{groupName(m.groupId)}</span>
          {m.timestamp ? ` · ${relativeTime(m.timestamp)}` : ''}
        </p>
      </div>
      {children}
    </div>
  );

  return (
    <>
      <SectionHeader title="Abilitazioni alla pubblicazione" description="Gli utenti abilitati possono pubblicare avvisi a nome del proprio gruppo." />
      {loading ? (
        <SkeletonList count={3} className="h-16" />
      ) : (
        <>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-subtle">
            In attesa {pending.length > 0 && <span className="rounded-full bg-danger px-1.5 text-[11px] text-white">{pending.length}</span>}
          </h3>
          {pending.length === 0 ? (
            <EmptyState className="py-8" icon={<UserCheck size={24} />} title="Nessuna richiesta in attesa" />
          ) : (
            <ListCard>
              {pending.map((m) => (
                <Fragment key={m.id}>{Row({ m, children: (
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger" icon={<X size={15} />} onClick={() => remove('la richiesta', () => deleteDoc(doc(db, 'group_members', m.id)))}>
                      Rifiuta
                    </Button>
                    <Button size="sm" icon={<Check size={15} />} onClick={() => run(() => updateDoc(doc(db, 'group_members', m.id), { isVerified: true }), 'Utente abilitato')}>
                      Approva
                    </Button>
                  </div>
                ) })}</Fragment>
              ))}
            </ListCard>
          )}

          <h3 className="mb-3 mt-10 text-sm font-bold uppercase tracking-wider text-subtle">Utenti abilitati ({verified.length})</h3>
          {verified.length === 0 ? (
            <EmptyState className="py-8" title="Nessun utente abilitato" />
          ) : (
            <ListCard>
              {verified.map((m) => (
                <Fragment key={m.id}>{Row({ m, children: (
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => remove("l'abilitazione", () => deleteDoc(doc(db, 'group_members', m.id)))}>
                    Revoca
                  </Button>
                ) })}</Fragment>
              ))}
            </ListCard>
          )}
        </>
      )}
    </>
  );
}
