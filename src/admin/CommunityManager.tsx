import { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ArrowDown, ArrowUp, ImagePlus, UsersRound } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol } from '../lib/useCol';
import { resizeImage } from '../lib/image';
import { Modal } from '../components/ui/Dialog';
import { Button, IconButton } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { Avatar } from '../components/ui/Avatar';
import { ParishBadge } from '../components/ui/Badge';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { ListCard, ParishSelect, RowActions, SectionHeader, useAction } from './common';
import type { CommunityMember, ParishScope } from '../types';

type Draft = Omit<CommunityMember, 'id'> & { id?: string };
const empty = (): Draft => ({ name: '', role: '', photoUrl: '', parish: 'Unità Pastorale' });

export default function CommunityManager() {
  const { run, remove, toast } = useAction();
  const { data, loading } = useCol<CommunityMember>(collection(db, 'community_members'));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const members = [...data].sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || (a.timestamp ?? 0) - (b.timestamp ?? 0));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const { id, ...rest } = draft;
    setSaving(true);
    const ok = await run(
      () => (id ? updateDoc(doc(db, 'community_members', id), rest) : addDoc(collection(db, 'community_members'), { ...rest, order: members.length, timestamp: Date.now() })),
      'Salvato',
    );
    setSaving(false);
    if (ok) setDraft(null);
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= members.length) return;
    const reordered = [...members];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    await run(() => Promise.all(reordered.map((m, k) => updateDoc(doc(db, 'community_members', m.id), { order: k }))));
  };

  return (
    <>
      <SectionHeader title="Chi siamo" description="Sacerdoti, religiose e collaboratori mostrati nella pagina Comunità." onNew={() => setDraft(empty())} newLabel="Aggiungi persona" />
      {loading ? (
        <SkeletonList count={3} className="h-16" />
      ) : members.length === 0 ? (
        <EmptyState icon={<UsersRound size={26} />} title="Nessuna persona inserita" />
      ) : (
        <ListCard>
          {members.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar src={m.photoUrl} name={m.name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{m.name}</p>
                <p className="truncate text-xs text-muted">{m.role}</p>
                {m.parish && m.parish !== 'Unità Pastorale' && <ParishBadge parish={m.parish} className="mt-1" />}
              </div>
              <IconButton label="Sposta su" disabled={i === 0} onClick={() => move(i, -1)} className="h-8 w-8 disabled:opacity-30"><ArrowUp size={15} /></IconButton>
              <IconButton label="Sposta giù" disabled={i === members.length - 1} onClick={() => move(i, 1)} className="h-8 w-8 disabled:opacity-30"><ArrowDown size={15} /></IconButton>
              <RowActions onEdit={() => setDraft({ ...empty(), ...m })} onDelete={() => remove(m.name, () => deleteDoc(doc(db, 'community_members', m.id)))} />
            </div>
          ))}
        </ListCard>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Modifica' : 'Aggiungi persona'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>Annulla</Button>
            <Button type="submit" form="member-form" loading={saving}>Salva</Button>
          </>
        }
      >
        {draft && (
          <form id="member-form" onSubmit={save} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar src={draft.photoUrl} name={draft.name} size={72} />
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-surface-2 px-3 text-sm font-semibold text-ink hover:bg-surface-3">
                  <ImagePlus size={15} /> Carica foto
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        setDraft({ ...draft, photoUrl: await resizeImage(f, 400, 60_000) });
                      } catch (err: any) {
                        toast.error(err?.message ?? 'Immagine non valida');
                      }
                    }}
                  />
                </label>
                {draft.photoUrl && <Button size="sm" variant="ghost" onClick={() => setDraft({ ...draft, photoUrl: '' })}>Rimuovi</Button>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nome e cognome" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Don Mario Rossi" />
              <Input label="Ruolo" required value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="Parroco" />
            </div>
            <ParishSelect value={draft.parish ?? 'Unità Pastorale'} onChange={(v) => setDraft({ ...draft, parish: v as ParishScope })} />
          </form>
        )}
      </Modal>
    </>
  );
}
