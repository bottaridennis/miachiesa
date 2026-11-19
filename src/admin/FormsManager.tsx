import { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { ArrowDown, ArrowUp, ClipboardList, Download, Eye, Plus, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol } from '../lib/useCol';
import { formatDate, formatDateTime, isDeadlinePassed, toISODate } from '../lib/format';
import { downloadCSV } from '../lib/csv';
import { routes } from '../lib/router';
import { Modal } from '../components/ui/Dialog';
import { Button, IconButton } from '../components/ui/Button';
import { Input, Select, Textarea, Toggle } from '../components/ui/Field';
import { Badge } from '../components/ui/Badge';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { ListCard, ParishSelect, RowActions, SectionHeader, useAction } from './common';
import type { FieldType, FormField, FormSubmission, ParishScope, RegistrationForm } from '../types';

const FIELD_TYPES: { v: FieldType; label: string }[] = [
  { v: 'text', label: 'Testo breve' },
  { v: 'textarea', label: 'Testo lungo' },
  { v: 'email', label: 'Email' },
  { v: 'tel', label: 'Telefono' },
  { v: 'date', label: 'Data' },
  { v: 'number', label: 'Numero' },
  { v: 'select', label: 'Scelta da elenco' },
  { v: 'checkbox', label: 'Casella (sì/no)' },
];

type Draft = Omit<RegistrationForm, 'id' | 'timestamp'> & { id?: string };

const defaultFields = (): FormField[] => [
  { label: 'Nome e cognome', type: 'text', required: true },
  { label: 'Data di nascita', type: 'date', required: true },
  { label: 'Telefono', type: 'tel', required: true },
  { label: 'Email', type: 'email', required: true },
];

const empty = (): Draft => ({ title: '', description: '', deadline: toISODate(new Date(Date.now() + 14 * 86400000)), fields: defaultFields(), parish: 'Unità Pastorale', forMinors: false, askPhotoConsent: false });

export default function FormsManager() {
  const { run, remove, toast } = useAction();
  const { data: forms, loading } = useCol<RegistrationForm>(query(collection(db, 'forms'), orderBy('timestamp', 'desc')));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<RegistrationForm | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const labels = draft.fields.map((f) => f.label.trim().toLowerCase());
    if (labels.some((l) => !l)) return toast.error('Tutti i campi devono avere un nome.');
    if (new Set(labels).size !== labels.length) return toast.error('Ci sono campi con lo stesso nome.');
    if (draft.fields.some((f) => f.type === 'select' && !(f.options ?? []).filter(Boolean).length)) return toast.error('Aggiungi le opzioni ai campi "Scelta da elenco".');
    const { id, ...rest } = draft;
    const payload = {
      ...rest,
      forMinors: !!rest.forMinors,
      askPhotoConsent: !!rest.askPhotoConsent,
      fields: rest.fields.map((f) => ({ label: f.label.trim(), type: f.type, required: f.required, ...(f.type === 'select' ? { options: (f.options ?? []).map((o) => o.trim()).filter(Boolean) } : {}) })),
    };
    setSaving(true);
    const ok = await run(() => (id ? updateDoc(doc(db, 'forms', id), payload) : addDoc(collection(db, 'forms'), { ...payload, timestamp: Date.now() })), 'Modulo salvato');
    setSaving(false);
    if (ok) setDraft(null);
  };

  const updateField = (i: number, patch: Partial<FormField>) => draft && setDraft({ ...draft, fields: draft.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) });
  const moveField = (i: number, dir: -1 | 1) => {
    if (!draft) return;
    const fields = [...draft.fields];
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    [fields[i], fields[j]] = [fields[j], fields[i]];
    setDraft({ ...draft, fields });
  };

  return (
    <>
      <SectionHeader title="Moduli di iscrizione" description="Crea moduli personalizzati e consulta o esporta le iscrizioni ricevute." onNew={() => setDraft(empty())} newLabel="Nuovo modulo" />
      {loading ? (
        <SkeletonList count={3} className="h-16" />
      ) : forms.length === 0 ? (
        <EmptyState icon={<ClipboardList size={26} />} title="Nessun modulo" />
      ) : (
        <ListCard>
          {forms.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <a href={`#${routes.registration(f.id)}`} className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{f.title}</p>
                <p className="flex items-center gap-2 text-xs text-muted">
                  Scadenza {formatDate(f.deadline, { day: 'numeric', month: 'short', year: 'numeric' })}
                  {isDeadlinePassed(f.deadline) ? <Badge>Chiuso</Badge> : <Badge tone="success">Aperto</Badge>}
                </p>
              </a>
              <Button size="sm" variant="secondary" icon={<Eye size={15} />} onClick={() => setViewing(f)}>
                Iscrizioni
              </Button>
              <RowActions onEdit={() => setDraft({ ...empty(), ...f })} onDelete={() => remove('il modulo', () => deleteDoc(doc(db, 'forms', f.id)))} />
            </div>
          ))}
        </ListCard>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        size="lg"
        title={draft?.id ? 'Modifica modulo' : 'Nuovo modulo'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>Annulla</Button>
            <Button type="submit" form="form-form" loading={saving}>Salva</Button>
          </>
        }
      >
        {draft && (
          <form id="form-form" onSubmit={save} className="space-y-5">
            <Input label="Titolo" required maxLength={150} placeholder="Es. Grest estivo 2026" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <Textarea label="Descrizione" required rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Scadenza iscrizioni" type="date" required value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} hint="Le iscrizioni restano aperte fino alla fine del giorno indicato." />
              <ParishSelect value={draft.parish ?? 'Unità Pastorale'} onChange={(v) => setDraft({ ...draft, parish: v as ParishScope })} />
            </div>

            <div className="space-y-3 rounded-2xl border border-line bg-surface-2/40 p-4">
              <p className="text-sm font-semibold text-ink-2">Privacy e consensi</p>
              <p className="text-xs text-muted">La presa visione dell'informativa privacy viene chiesta automaticamente in ogni modulo: non serve aggiungere un campo apposito.</p>
              <Toggle checked={!!draft.forMinors} onChange={(v) => setDraft({ ...draft, forMinors: v })} label="Iscrizione di minori" description="Chi compila dichiara di esercitare la responsabilità genitoriale sul minore." />
              <Toggle checked={!!draft.askPhotoConsent} onChange={(v) => setDraft({ ...draft, askPhotoConsent: v })} label="Chiedi il consenso a foto e video" description="Consenso facoltativo e separato: chi non lo dà può comunque iscriversi." />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-2">Campi del modulo</p>
                <Button size="sm" variant="ghost" icon={<Plus size={15} />} onClick={() => setDraft({ ...draft, fields: [...draft.fields, { label: '', type: 'text', required: false }] })}>
                  Aggiungi campo
                </Button>
              </div>
              <div className="space-y-2">
                {draft.fields.map((f, i) => (
                  <div key={i} className="rounded-2xl border border-line bg-surface-2/40 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input aria-label="Nome del campo" placeholder="Nome del campo" value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} className="min-w-0 flex-[2_1_180px] rounded-xl border border-line bg-surface px-3 py-2 text-sm" />
                      <select aria-label="Tipo" value={f.type} onChange={(e) => updateField(i, { type: e.target.value as FieldType })} className="flex-[1_1_140px] rounded-xl border border-line bg-surface px-3 py-2 text-sm">
                        {FIELD_TYPES.map((t) => (
                          <option key={t.v} value={t.v}>{t.label}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1.5 text-sm text-ink-2">
                        <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} className="h-4 w-4 accent-[var(--color-primary)]" /> Obbligatorio
                      </label>
                      <div className="ml-auto flex">
                        <IconButton label="Sposta su" onClick={() => moveField(i, -1)} disabled={i === 0} className="h-8 w-8 disabled:opacity-30"><ArrowUp size={15} /></IconButton>
                        <IconButton label="Sposta giù" onClick={() => moveField(i, 1)} disabled={i === draft.fields.length - 1} className="h-8 w-8 disabled:opacity-30"><ArrowDown size={15} /></IconButton>
                        <IconButton label="Rimuovi campo" onClick={() => setDraft({ ...draft, fields: draft.fields.filter((_, j) => j !== i) })} className="h-8 w-8 hover:text-danger"><Trash2 size={15} /></IconButton>
                      </div>
                    </div>
                    {f.type === 'select' && (
                      <input
                        aria-label="Opzioni"
                        placeholder="Opzioni separate da virgola (es. S, M, L, XL)"
                        value={(f.options ?? []).join(', ')}
                        onChange={(e) => updateField(i, { options: e.target.value.split(',').map((s) => s.trimStart()) })}
                        className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>
        )}
      </Modal>

      {viewing && <SubmissionsModal form={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

function SubmissionsModal({ form, onClose }: { form: RegistrationForm; onClose: () => void }) {
  const { remove } = useAction();
  const { data, loading } = useCol<FormSubmission>(query(collection(db, 'form_submissions'), where('formId', '==', form.id)));
  const subs = [...data].sort((a, b) => a.timestamp - b.timestamp);
  // colonne: campi attuali del modulo + eventuali campi presenti solo nelle vecchie iscrizioni
  const cols = Array.from(new Set([...(form.fields ?? []).map((f) => f.label), ...subs.flatMap((s) => Object.keys(s.data ?? {}))]));
  const show = (v: unknown) => (typeof v === 'boolean' ? (v ? 'Sì' : 'No') : (v as string) || '—');
  const yn = (v?: boolean) => (v === undefined ? '—' : v ? 'Sì' : 'No');
  const consentCols: { label: string; get: (s: FormSubmission) => string }[] = [
    ...(form.forMinors ? [{ label: 'Resp. genitoriale', get: (s: FormSubmission) => yn(s.consents?.guardian) }] : []),
    ...(form.askPhotoConsent ? [{ label: 'Consenso foto/video', get: (s: FormSubmission) => yn(s.consents?.photos) }] : []),
    { label: 'Informativa letta', get: (s: FormSubmission) => (s.consents ? `Sì (v. ${s.consents.privacyVersion})` : '—') },
  ];

  const exportCsv = () =>
    downloadCSV(`iscrizioni_${form.title.replace(/[^\w]+/g, '_')}`, [
      ['#', 'Data invio', 'Account', ...cols, ...consentCols.map((c) => c.label)],
      ...subs.map((s, i) => [i + 1, formatDateTime(s.timestamp), s.userEmail, ...cols.map((c) => s.data?.[c] as string | boolean), ...consentCols.map((c) => c.get(s))]),
    ]);

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`${form.title} · ${subs.length} iscrizioni`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Chiudi</Button>
          <Button icon={<Download size={16} />} disabled={!subs.length} onClick={exportCsv}>Esporta CSV (Excel)</Button>
        </>
      }
    >
      {loading ? (
        <SkeletonList count={3} className="h-10" />
      ) : subs.length === 0 ? (
        <EmptyState title="Nessuna iscrizione ricevuta" />
      ) : (
        <div className="-mx-5 overflow-x-auto sm:-mx-6">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">#</th>
                <th className="px-4 py-2.5 font-semibold">Inviata</th>
                {cols.map((c) => (
                  <th key={c} className="px-4 py-2.5 font-semibold">{c}</th>
                ))}
                {consentCols.map((c) => (
                  <th key={c.label} className="px-4 py-2.5 font-semibold">{c.label}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subs.map((s, i) => (
                <tr key={s.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-2.5 text-muted">{i + 1}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{formatDateTime(s.timestamp)}</td>
                  {cols.map((c) => (
                    <td key={c} className="max-w-[240px] truncate px-4 py-2.5 text-ink">{show(s.data?.[c])}</td>
                  ))}
                  {consentCols.map((c) => (
                    <td key={c.label} className="px-4 py-2.5 text-ink-2">{c.get(s)}</td>
                  ))}
                  <td className="px-2">
                    <IconButton label="Elimina iscrizione" className="h-8 w-8 hover:text-danger" onClick={() => remove("l'iscrizione", () => deleteDoc(doc(db, 'form_submissions', s.id)))}>
                      <Trash2 size={14} />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
