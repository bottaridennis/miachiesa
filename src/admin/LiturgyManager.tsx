import { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { BookOpen, Copy } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol } from '../lib/useCol';
import { formatDate, toISODate } from '../lib/format';
import { Modal } from '../components/ui/Dialog';
import { Button, IconButton } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Field';
import { Badge } from '../components/ui/Badge';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { ListCard, RowActions, SectionHeader, useAction } from './common';
import type { LiturgicalColor, Liturgy, Reading } from '../types';

type Draft = Omit<Liturgy, 'id' | 'timestamp' | 'secondReading'> & { id?: string; secondReading: Reading };
const blank: Reading = { reference: '', text: '' };
const empty = (): Draft => ({ day: toISODate(), date: '', liturgicalColor: 'green', firstReading: { ...blank }, psalm: { ...blank }, secondReading: { ...blank }, gospel: { ...blank }, comment: '' });

function ReadingFields({ title, value, onChange, required, rows = 5 }: { title: string; value: Reading; onChange: (r: Reading) => void; required?: boolean; rows?: number }) {
  return (
    <fieldset className="space-y-3 rounded-2xl border border-line p-4">
      <legend className="px-1 text-sm font-bold uppercase tracking-wide text-gold">{title}</legend>
      <Input aria-label={`Riferimento ${title}`} placeholder="Riferimento (es. Is 2,1-5)" required={required} value={value.reference} onChange={(e) => onChange({ ...value, reference: e.target.value })} />
      <Textarea aria-label={`Testo ${title}`} placeholder="Testo" required={required} rows={rows} value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} />
    </fieldset>
  );
}

export default function LiturgyManager() {
  const { run, remove } = useAction();
  const { data, loading } = useCol<Liturgy>(query(collection(db, 'liturgy'), orderBy('timestamp', 'desc')));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const items = [...data].sort((a, b) => (b.day ?? '').localeCompare(a.day ?? '') || b.timestamp - a.timestamp);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const { id, secondReading, ...rest } = draft;
    const payload: Record<string, unknown> = { ...rest, secondReading: secondReading.text.trim() ? secondReading : null, timestamp: Date.now() };
    setSaving(true);
    const ok = await run(() => (id ? updateDoc(doc(db, 'liturgy', id), payload) : addDoc(collection(db, 'liturgy'), payload)), 'Letture salvate');
    setSaving(false);
    if (ok) setDraft(null);
  };

  const toDraft = (l: Liturgy): Draft => ({ ...empty(), ...l, secondReading: l.secondReading ?? { ...blank }, comment: l.comment ?? '' });
  const today = toISODate();

  return (
    <>
      <SectionHeader
        title="Letture del giorno"
        description="Nella pagina Liturgia vengono mostrate le letture della data odierna; se mancano, le ultime inserite."
        onNew={() => setDraft(empty())}
        newLabel="Nuove letture"
        extra={
          <a href="https://www.chiesacattolica.it/liturgia-del-giorno/" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-primary hover:bg-primary-soft">
            Fonte CEI ↗
          </a>
        }
      />
      {loading ? (
        <SkeletonList count={4} className="h-16" />
      ) : items.length === 0 ? (
        <EmptyState icon={<BookOpen size={26} />} title="Nessuna lettura inserita" />
      ) : (
        <ListCard>
          {items.map((l) => (
            <div key={l.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">{l.day ? formatDate(l.day, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Senza data'}</span>
                  {l.day === today && <Badge tone="success">Oggi</Badge>}
                </div>
                <p className="truncate font-semibold text-ink">{l.date}</p>
                <p className="truncate text-xs text-muted">Vangelo: {l.gospel?.reference}</p>
              </div>
              <IconButton label="Duplica" onClick={() => setDraft({ ...toDraft(l), id: undefined, day: today })}>
                <Copy size={16} />
              </IconButton>
              <RowActions onEdit={() => setDraft(toDraft(l))} onDelete={() => remove('le letture', () => deleteDoc(doc(db, 'liturgy', l.id)))} />
            </div>
          ))}
        </ListCard>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        size="lg"
        title={draft?.id ? 'Modifica letture' : 'Nuove letture'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>Annulla</Button>
            <Button type="submit" form="liturgy-form" loading={saving}>Salva</Button>
          </>
        }
      >
        {draft && (
          <form id="liturgy-form" onSubmit={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Giorno" type="date" required value={draft.day ?? ''} onChange={(e) => setDraft({ ...draft, day: e.target.value })} />
              <Input className="sm:col-span-2" label="Ricorrenza" required placeholder="Es. I Domenica di Avvento" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </div>
            <Select label="Colore liturgico" value={draft.liturgicalColor} onChange={(e) => setDraft({ ...draft, liturgicalColor: e.target.value as LiturgicalColor })}>
              <option value="green">Verde</option>
              <option value="white">Bianco</option>
              <option value="red">Rosso</option>
              <option value="purple">Viola</option>
              <option value="rose">Rosaceo</option>
            </Select>
            <ReadingFields title="Prima lettura" required value={draft.firstReading} onChange={(r) => setDraft({ ...draft, firstReading: r })} />
            <ReadingFields title="Salmo responsoriale" required rows={4} value={draft.psalm} onChange={(r) => setDraft({ ...draft, psalm: r })} />
            <ReadingFields title="Seconda lettura (domeniche e solennità)" value={draft.secondReading} onChange={(r) => setDraft({ ...draft, secondReading: r })} />
            <ReadingFields title="Vangelo" required rows={7} value={draft.gospel} onChange={(r) => setDraft({ ...draft, gospel: r })} />
            <Textarea label="Commento / pensiero del parroco (facoltativo)" rows={4} value={draft.comment ?? ''} onChange={(e) => setDraft({ ...draft, comment: e.target.value })} />
          </form>
        )}
      </Modal>
    </>
  );
}
