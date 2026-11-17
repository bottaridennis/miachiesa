import { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { CalendarDays, Copy } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol } from '../lib/useCol';
import { useGroups } from '../lib/data';
import { formatDate, parseISODate, toISODate } from '../lib/format';
import { cn } from '../lib/cn';
import { Modal } from '../components/ui/Dialog';
import { Button, IconButton } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Field';
import { ParishBadge } from '../components/ui/Badge';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { DateTile } from '../components/EventCard';
import { ListCard, ParishSelect, RowActions, SectionHeader, useAction } from './common';
import type { ParishEvent, ParishScope } from '../types';

type Draft = Omit<ParishEvent, 'id' | 'timestamp'> & { id?: string };
const empty = (): Draft => ({ title: '', date: toISODate(), time: '', endTime: '', location: '', description: '', group: '', groupId: '', parish: 'Unità Pastorale' });

export default function EventsManager() {
  const { run, remove } = useAction();
  const { data: events, loading } = useCol<ParishEvent>(query(collection(db, 'events'), orderBy('date', 'desc')));
  const { data: groups } = useGroups();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const today = toISODate();
  const upcoming = events.filter((e) => e.date >= today).reverse();
  const past = events.filter((e) => e.date < today);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const { id, ...data } = draft;
    const group = groups.find((g) => g.id === data.groupId);
    const d = parseISODate(data.date);
    const [h, m] = (data.time || '0:0').split(':').map(Number);
    const payload = {
      ...data,
      title: data.title.trim(),
      group: group?.name ?? data.group ?? '',
      groupId: group?.id ?? '',
      timestamp: d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), h || 0, m || 0).getTime() : Date.now(),
    };
    setSaving(true);
    const ok = await run(() => (id ? updateDoc(doc(db, 'events', id), payload) : addDoc(collection(db, 'events'), payload)), id ? 'Evento aggiornato' : 'Evento creato');
    setSaving(false);
    if (ok) setDraft(null);
  };

  const row = (ev: ParishEvent) => (
    <div key={ev.id} className={cn('flex items-center gap-3 px-4 py-3', ev.date < today && 'opacity-60')}>
      <DateTile date={ev.date} className="w-14 py-1.5" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{ev.title}</p>
        <p className="truncate text-xs text-muted">
          {ev.time} · {ev.location}
          {ev.group ? ` · ${ev.group}` : ''}
        </p>
        <ParishBadge parish={ev.parish} className="mt-1" />
      </div>
      <IconButton label="Duplica" onClick={() => setDraft({ ...empty(), ...ev, id: undefined, date: toISODate() })}>
        <Copy size={16} />
      </IconButton>
      <RowActions onEdit={() => setDraft({ ...empty(), ...ev })} onDelete={() => remove("l'evento", () => deleteDoc(doc(db, 'events', ev.id)))} />
    </div>
  );

  return (
    <>
      <SectionHeader title="Eventi" description="Il calendario visibile nella sezione Comunità. Gli eventi passati vengono nascosti automaticamente." onNew={() => setDraft(empty())} newLabel="Nuovo evento" />
      {loading ? (
        <SkeletonList count={4} className="h-20" />
      ) : upcoming.length === 0 ? (
        <EmptyState icon={<CalendarDays size={26} />} title="Nessun evento in programma" />
      ) : (
        <ListCard>{upcoming.map(row)}</ListCard>
      )}
      {past.length > 0 && (
        <div className="mt-6">
          <Button variant="ghost" size="sm" onClick={() => setShowPast(!showPast)}>
            {showPast ? 'Nascondi' : 'Mostra'} eventi passati ({past.length})
          </Button>
          {showPast && <div className="mt-3"><ListCard>{past.map(row)}</ListCard></div>}
        </div>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Modifica evento' : 'Nuovo evento'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>Annulla</Button>
            <Button type="submit" form="event-form" loading={saving}>Salva</Button>
          </>
        }
      >
        {draft && (
          <form id="event-form" onSubmit={save} className="space-y-5">
            <Input label="Titolo" required maxLength={150} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Es. Incontro gruppo famiglie" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Input className="col-span-2 sm:col-span-1" label="Data" type="date" required value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} hint={draft.date ? formatDate(draft.date, { weekday: 'long' }) : undefined} />
              <Input label="Inizio" type="time" required value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
              <Input label="Fine" type="time" value={draft.endTime ?? ''} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
            </div>
            <Input label="Luogo" required value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Es. Salone parrocchiale di Oppeano" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Select label="Gruppo organizzatore" value={draft.groupId ?? ''} onChange={(e) => setDraft({ ...draft, groupId: e.target.value })}>
                <option value="">Nessuno / tutta la comunità</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
              <ParishSelect value={draft.parish} onChange={(v) => setDraft({ ...draft, parish: v as ParishScope })} />
            </div>
            <Textarea label="Descrizione" rows={3} maxLength={2000} value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </form>
        )}
      </Modal>
    </>
  );
}
