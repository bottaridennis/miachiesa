import { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { CheckCircle2, Clock3, Plus, Trash2, Users } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol } from '../lib/useCol';
import { useSession } from '../lib/session';
import { useGroups } from '../lib/data';
import { routes } from '../lib/router';
import { Modal } from '../components/ui/Dialog';
import { Button, IconButton } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Field';
import { Badge, ParishBadge } from '../components/ui/Badge';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { ListCard, ParishSelect, RowActions, SectionHeader, useAction } from './common';
import type { Group, GroupMember, ParishScope } from '../types';

type Draft = Omit<Group, 'id'> & { id?: string };
const empty: Draft = { name: '', parish: 'Unità Pastorale', description: '', contact: '', meetingInfo: '', leaders: [] };

export default function GroupsManager() {
  const { user, isAdmin } = useSession();
  const { run, remove } = useAction();
  const { data: groups, loading } = useGroups();
  const { data: memberships } = useCol<GroupMember>(user ? query(collection(db, 'group_members'), where('userId', '==', user.uid)) : null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const join = (groupId: string) =>
    run(
      () =>
        setDoc(doc(db, 'group_members', `${groupId}_${user.uid}`), {
          groupId,
          userId: user.uid,
          userEmail: user.email ?? '',
          userName: user.displayName ?? '',
          isVerified: false,
          timestamp: Date.now(),
        }),
      "Richiesta inviata: un amministratore la verificherà a breve.",
    );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    const { id, ...data } = draft;
    const payload = { ...data, name: data.name.trim(), leaders: (data.leaders ?? []).filter((l) => l.name.trim()) };
    const ok = await run(() => (id ? updateDoc(doc(db, 'groups', id), payload) : addDoc(collection(db, 'groups'), payload)), id ? 'Gruppo aggiornato' : 'Gruppo creato');
    setSaving(false);
    if (ok) setDraft(null);
  };

  return (
    <>
      <SectionHeader
        title="Gruppi parrocchiali"
        description={isAdmin ? 'Crea e gestisci i gruppi. Gli animatori possono chiedere di pubblicare avvisi a nome del gruppo.' : 'Sei animatore di un gruppo? Chiedi di essere abilitato a pubblicare avvisi.'}
        onNew={isAdmin ? () => setDraft({ ...empty }) : undefined}
        newLabel="Nuovo gruppo"
      />
      {loading ? (
        <SkeletonList count={4} className="h-16" />
      ) : groups.length === 0 ? (
        <EmptyState icon={<Users size={26} />} title="Nessun gruppo" />
      ) : (
        <ListCard>
          {groups.map((g) => {
            const m = memberships.find((x) => x.groupId === g.id);
            return (
              <div key={g.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-serif font-semibold text-primary">{g.name.charAt(0)}</span>
                <a href={`#${routes.group(g.id)}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{g.name}</p>
                  <ParishBadge parish={g.parish} />
                </a>
                {isAdmin ? (
                  <RowActions onEdit={() => setDraft({ ...empty, ...g })} onDelete={() => remove('il gruppo', () => deleteDoc(doc(db, 'groups', g.id)))} />
                ) : m ? (
                  m.isVerified ? (
                    <Badge tone="success" icon={<CheckCircle2 size={11} />}>Abilitato</Badge>
                  ) : (
                    <Badge tone="warning" icon={<Clock3 size={11} />}>In attesa</Badge>
                  )
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => join(g.id)}>
                    Chiedi di pubblicare
                  </Button>
                )}
              </div>
            );
          })}
        </ListCard>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Modifica gruppo' : 'Nuovo gruppo'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Annulla
            </Button>
            <Button type="submit" form="group-form" loading={saving}>
              Salva
            </Button>
          </>
        }
      >
        {draft && (
          <form id="group-form" onSubmit={save} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Nome del gruppo" required maxLength={100} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <ParishSelect value={draft.parish} onChange={(v) => setDraft({ ...draft, parish: v as ParishScope })} />
            </div>
            <Textarea label="Descrizione" rows={3} maxLength={1000} value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Quando si incontra" placeholder="Es. ogni venerdì alle 21:00" value={draft.meetingInfo ?? ''} onChange={(e) => setDraft({ ...draft, meetingInfo: e.target.value })} />
              <Input label="Contatto (email o telefono)" value={draft.contact ?? ''} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-2">Responsabili</p>
                <Button size="sm" variant="ghost" icon={<Plus size={15} />} onClick={() => setDraft({ ...draft, leaders: [...(draft.leaders ?? []), { name: '', role: '' }] })}>
                  Aggiungi
                </Button>
              </div>
              <div className="space-y-2">
                {(draft.leaders ?? []).map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm" placeholder="Nome" value={l.name} onChange={(e) => setDraft({ ...draft, leaders: draft.leaders!.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                    <input className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm" placeholder="Ruolo" value={l.role ?? ''} onChange={(e) => setDraft({ ...draft, leaders: draft.leaders!.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) })} />
                    <IconButton label="Rimuovi" onClick={() => setDraft({ ...draft, leaders: draft.leaders!.filter((_, j) => j !== i) })}>
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
