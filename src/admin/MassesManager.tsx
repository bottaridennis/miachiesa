import { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Church } from 'lucide-react';
import { db } from '../lib/firebase';
import { useMassTimes } from '../lib/data';
import { massDayLabel, toISODate, WEEKDAYS } from '../lib/format';
import { Modal } from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Field';
import { Badge, ParishBadge } from '../components/ui/Badge';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { ListCard, ParishSelect, RowActions, SectionHeader, useAction } from './common';
import type { MassDay, MassTime, MassType, ParishScope } from '../types';

const LOCATIONS = ['Chiesa parrocchiale di Oppeano', 'Santuario della Madonna del Carmine', "Chiesa parrocchiale di Ca' degli Oppi"];

type DayChoice = 'weekdays' | 'date' | '0' | '1' | '2' | '3' | '4' | '5' | '6';
type Draft = Omit<MassTime, 'id' | 'day'> & { id?: string; dayChoice: DayChoice };

const empty = (): Draft => ({ time: '', dayChoice: '0', date: '', title: '', description: '', location: LOCATIONS[0], parish: 'Oppeano', type: 'Festiva' });

/** Ordine logico nella lista: Lun..Dom, poi feriali, poi date straordinarie */
const dayRank = (m: MassTime) => (m.date ? 100 : m.day === 'weekdays' ? 0.5 : typeof m.day === 'number' ? (m.day === 0 ? 7 : m.day) : 50);

export default function MassesManager() {
  const { run, remove } = useAction();
  const { data, loading } = useMassTimes();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const masses = [...data].sort((a, b) => dayRank(a) - dayRank(b) || (a.date ?? '').localeCompare(b.date ?? '') || a.time.localeCompare(b.time));

  const toDraft = (m: MassTime): Draft => ({
    ...empty(),
    ...m,
    dayChoice: m.date ? 'date' : m.day === 'weekdays' ? 'weekdays' : typeof m.day === 'number' ? (String(m.day) as DayChoice) : m.type === 'Prefestiva' ? '6' : m.type === 'Feriale' ? 'weekdays' : '0',
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const { id, dayChoice, ...rest } = draft;
    const day: MassDay = dayChoice === 'weekdays' || dayChoice === 'date' ? dayChoice : Number(dayChoice);
    const payload = { ...rest, day, date: dayChoice === 'date' ? rest.date : '' };
    setSaving(true);
    const ok = await run(() => (id ? updateDoc(doc(db, 'mass_times', id), payload) : addDoc(collection(db, 'mass_times'), { ...payload, order: Date.now() })), 'Orario salvato');
    setSaving(false);
    if (ok) setDraft(null);
  };

  const today = toISODate();

  return (
    <>
      <SectionHeader title="Orari delle Messe" description="Imposta gli orari settimanali ricorrenti e le celebrazioni straordinarie." onNew={() => setDraft(empty())} newLabel="Nuovo orario" />
      {loading ? (
        <SkeletonList count={5} className="h-16" />
      ) : masses.length === 0 ? (
        <EmptyState icon={<Church size={26} />} title="Nessun orario inserito" />
      ) : (
        <ListCard>
          {masses.map((m) => (
            <div key={m.id} className={`flex items-center gap-4 px-4 py-3 ${m.date && m.date < today ? 'opacity-50' : ''}`}>
              <span className="w-14 shrink-0 text-center font-serif text-xl font-semibold">{m.time}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold capitalize text-ink">
                  {massDayLabel(m)}
                  {m.title ? ` · ${m.title}` : ''}
                </p>
                <p className="truncate text-xs text-muted">{m.location}</p>
                <div className="mt-1 flex gap-1.5">
                  <Badge tone={m.type === 'Festiva' ? 'primary' : m.type === 'Prefestiva' ? 'gold' : 'neutral'}>{m.type}</Badge>
                  <ParishBadge parish={m.parish} />
                </div>
              </div>
              <RowActions onEdit={() => setDraft(toDraft(m))} onDelete={() => remove("l'orario", () => deleteDoc(doc(db, 'mass_times', m.id)))} />
            </div>
          ))}
        </ListCard>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Modifica orario' : 'Nuovo orario'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>Annulla</Button>
            <Button type="submit" form="mass-form" loading={saving}>Salva</Button>
          </>
        }
      >
        {draft && (
          <form id="mass-form" onSubmit={save} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Select label="Quando" value={draft.dayChoice} onChange={(e) => {
                const v = e.target.value as DayChoice;
                setDraft({ ...draft, dayChoice: v, type: v === '0' ? 'Festiva' : v === '6' ? 'Prefestiva' : v === 'date' ? draft.type : 'Feriale' });
              }}>
                <option value="weekdays">Lunedì – Venerdì</option>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <option key={d} value={String(d)}>Ogni {WEEKDAYS[d].toLowerCase()}</option>
                ))}
                <option value="date">Solo in una data…</option>
              </Select>
              <Input label="Orario" type="time" required value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
            </div>
            {draft.dayChoice === 'date' && <Input label="Data" type="date" required value={draft.date ?? ''} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Tipo" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as MassType })}>
                <option>Feriale</option>
                <option>Prefestiva</option>
                <option>Festiva</option>
              </Select>
              <ParishSelect value={draft.parish ?? 'Unità Pastorale'} onChange={(v) => setDraft({ ...draft, parish: v as ParishScope })} />
            </div>
            <Input label="Luogo" required list="mass-locations" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            <datalist id="mass-locations">
              {LOCATIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Titolo (facoltativo)" placeholder="Es. Messa dei fanciulli" value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              <Input label="Nota (facoltativa)" placeholder="Es. con il coro parrocchiale" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
