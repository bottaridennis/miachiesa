import { useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, query, updateDoc, where } from 'firebase/firestore';
import { ImagePlus, Megaphone, Pin, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol } from '../lib/useCol';
import { useSession } from '../lib/session';
import { useGroups, useNotices } from '../lib/data';
import { resizeImage, estimateBytes } from '../lib/image';
import { relativeTime } from '../lib/format';
import { routes } from '../lib/router';
import { Modal } from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea, Toggle } from '../components/ui/Field';
import { CategoryBadge, ParishBadge } from '../components/ui/Badge';
import { EmptyState, Notice as Callout, SkeletonList } from '../components/ui/Feedback';
import { ListCard, RowActions, SectionHeader, useAction } from './common';
import { noticeImages } from '../components/NoticeCard';
import { NOTICE_CATEGORIES, type GroupMember, type Notice, type NoticeCategory, type ParishScope } from '../types';

const MAX_IMAGES = 4;
const MAX_DOC_BYTES = 900_000;

interface Draft {
  id?: string;
  title: string;
  content: string;
  groupId: string;
  category: NoticeCategory;
  images: string[];
  attachmentUrl: string;
  pinned: boolean;
  parish: ParishScope;
}

const emptyDraft: Draft = { title: '', content: '', groupId: '', category: 'Avviso', images: [], attachmentUrl: '', pinned: false, parish: 'Unità Pastorale' };

export default function NoticesManager() {
  const { user, isAdmin } = useSession();
  const { run, remove, toast } = useAction();
  const { data: groups } = useGroups();
  const { data: memberships } = useCol<GroupMember>(user ? query(collection(db, 'group_members'), where('userId', '==', user.uid)) : null);
  const { data: allNotices, loading } = useNotices(200);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  const verifiedGroupIds = new Set(memberships.filter((m) => m.isVerified).map((m) => m.groupId));
  const myGroups = isAdmin ? groups : groups.filter((g) => verifiedGroupIds.has(g.id));
  const canPublish = isAdmin || myGroups.length > 0;
  const notices = useMemo(() => allNotices.filter((n) => isAdmin || n.authorId === user?.uid), [allNotices, isAdmin, user]);

  if (!user) return null;

  const openNew = () => setDraft({ ...emptyDraft, groupId: isAdmin ? 'admin' : myGroups[0]?.id ?? '' });
  const openEdit = (n: Notice) =>
    setDraft({
      id: n.id,
      title: n.title,
      content: n.content,
      groupId: n.groupId,
      category: n.category ?? 'Avviso',
      images: noticeImages(n),
      attachmentUrl: n.attachmentUrl ?? '',
      pinned: !!n.pinned,
      parish: n.parish ?? 'Unità Pastorale',
    });

  const addImages = async (files: FileList | null) => {
    if (!files || !draft) return;
    const slots = MAX_IMAGES - draft.images.length;
    if (slots <= 0) {
      toast.error(`Puoi caricare al massimo ${MAX_IMAGES} immagini.`);
      return;
    }
    setProcessing(true);
    try {
      const out: string[] = [];
      for (const f of Array.from(files).slice(0, slots)) out.push(await resizeImage(f));
      setDraft((d) => (d ? { ...d, images: [...d.images, ...out] } : d));
    } catch (e: any) {
      toast.error(e?.message ?? 'Impossibile elaborare l’immagine.');
    }
    setProcessing(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.groupId) {
      toast.error('Seleziona il gruppo che pubblica.');
      return;
    }
    if (draft.attachmentUrl && !/^https?:\/\//i.test(draft.attachmentUrl)) {
      toast.error("L'allegato deve essere un link che inizia con https://");
      return;
    }
    if (estimateBytes([...draft.images, draft.content]) > MAX_DOC_BYTES) {
      toast.error('Le immagini sono troppo pesanti: rimuovine qualcuna.');
      return;
    }
    const group = groups.find((g) => g.id === draft.groupId);
    const parish = draft.groupId === 'admin' ? draft.parish : group?.parish ?? 'Unità Pastorale';
    const payload = {
      title: draft.title.trim(),
      content: draft.content.trim(),
      groupId: draft.groupId,
      category: draft.category,
      parish,
      images: draft.images,
      imageUrl: draft.images[0] ?? '',
      attachmentUrl: draft.attachmentUrl.trim(),
      pinned: isAdmin ? draft.pinned : false,
    };
    setSaving(true);
    const ok = await run(
      () =>
        draft.id
          ? updateDoc(doc(db, 'notices', draft.id), payload)
          : addDoc(collection(db, 'notices'), {
              ...payload,
              authorId: user.uid,
              authorName: user.displayName ?? '',
              timestamp: Date.now(),
              date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
            }),
      draft.id ? 'Avviso aggiornato' : 'Avviso pubblicato',
    );
    setSaving(false);
    if (ok) setDraft(null);
  };

  const groupName = (id: string) => (id === 'admin' ? 'Amministrazione' : groups.find((g) => g.id === id)?.name ?? '—');

  return (
    <>
      <SectionHeader title={isAdmin ? 'Avvisi' : 'I miei avvisi'} description={isAdmin ? 'Tutti gli avvisi pubblicati nella bacheca.' : 'Gli avvisi che hai pubblicato per i tuoi gruppi.'} onNew={canPublish ? openNew : undefined} newLabel="Nuovo avviso" />

      {!canPublish && (
        <div className="mb-6">
          <Callout tone="warning">
            Per pubblicare avvisi devi essere abilitato da un amministratore per almeno un gruppo. Vai alla sezione{' '}
            <a href={`#${routes.accountSection('gruppi')}`} className="underline">
              Gruppi
            </a>{' '}
            per inviare la richiesta.
          </Callout>
        </div>
      )}

      {loading ? (
        <SkeletonList count={4} className="h-16" />
      ) : notices.length === 0 ? (
        <EmptyState icon={<Megaphone size={26} />} title="Nessun avviso pubblicato" />
      ) : (
        <ListCard>
          {notices.map((n) => (
            <div key={n.id} className="flex items-center gap-3 px-4 py-3">
              {noticeImages(n)[0] ? <img src={noticeImages(n)[0]} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted"><Megaphone size={18} /></span>}
              <a href={`#${routes.notice(n.id)}`} className="min-w-0 flex-1">
                <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                  {n.pinned && <Pin size={13} className="fill-gold text-gold" />}
                  <CategoryBadge category={n.category} />
                  <ParishBadge parish={n.parish} />
                </div>
                <p className="truncate font-semibold text-ink">{n.title}</p>
                <p className="truncate text-xs text-muted">
                  {groupName(n.groupId)} · {n.timestamp ? relativeTime(n.timestamp) : n.date}
                </p>
              </a>
              <RowActions onEdit={() => openEdit(n)} onDelete={() => remove("l'avviso", () => deleteDoc(doc(db, 'notices', n.id)))} />
            </div>
          ))}
        </ListCard>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Modifica avviso' : 'Nuovo avviso'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Annulla
            </Button>
            <Button type="submit" form="notice-form" loading={saving} disabled={processing}>
              {draft?.id ? 'Salva modifiche' : 'Pubblica'}
            </Button>
          </>
        }
      >
        {draft && (
          <form id="notice-form" onSubmit={save} className="space-y-5">
            <Input label="Titolo" required maxLength={150} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Select label="Pubblicato da" required value={draft.groupId} onChange={(e) => setDraft({ ...draft, groupId: e.target.value })}>
                <option value="" disabled>
                  Seleziona…
                </option>
                {isAdmin && <option value="admin">Amministrazione parrocchiale</option>}
                {myGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.parish})
                  </option>
                ))}
              </Select>
              <Select label="Categoria" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as NoticeCategory })}>
                {NOTICE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
            {draft.groupId === 'admin' && (
              <Select label="Parrocchia" value={draft.parish} onChange={(e) => setDraft({ ...draft, parish: e.target.value as ParishScope })}>
                <option>Unità Pastorale</option>
                <option>Oppeano</option>
                <option>Ca' degli Oppi</option>
              </Select>
            )}
            <Textarea label="Testo" required rows={8} maxLength={10000} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />

            <div>
              <p className="mb-2 text-sm font-semibold text-ink-2">
                Immagini <span className="font-normal text-muted">({draft.images.length}/{MAX_IMAGES}, la prima è la copertina)</span>
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {draft.images.map((src, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-2">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setDraft({ ...draft, images: draft.images.filter((_, j) => j !== i) })} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white" aria-label="Rimuovi immagine">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {draft.images.length < MAX_IMAGES && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line-strong text-muted transition-colors hover:border-primary hover:text-primary">
                    <ImagePlus size={22} />
                    <span className="text-xs font-semibold">{processing ? 'Elaboro…' : 'Aggiungi'}</span>
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addImages(e.target.files); e.target.value = ''; }} />
                  </label>
                )}
              </div>
            </div>

            <Input label="Link allegato (PDF, modulo…)" type="url" placeholder="https://…" value={draft.attachmentUrl} onChange={(e) => setDraft({ ...draft, attachmentUrl: e.target.value })} hint="Ad esempio un link a Google Drive o al sito della diocesi." />

            {isAdmin && <Toggle checked={draft.pinned} onChange={(v) => setDraft({ ...draft, pinned: v })} label="Fissa in evidenza" description="L'avviso resterà in cima alla bacheca." />}
          </form>
        )}
      </Modal>
    </>
  );
}
