import { useEffect, useState } from 'react';
import { addDoc, collection, doc, orderBy, query, where } from 'firebase/firestore';
import { ArrowLeft, CalendarClock, CheckCircle2, ClipboardList, LogIn, Send } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol, useDocData } from '../lib/useCol';
import { useSession } from '../lib/session';
import { daysUntil, formatDate, isDeadlinePassed } from '../lib/format';
import { navigate, routes } from '../lib/router';
import { Page, PageHeader } from '../components/ui/Page';
import { Card } from '../components/ui/Card';
import { Badge, ParishBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Field';
import { EmptyState, Notice, Skeleton, SkeletonList } from '../components/ui/Feedback';
import { useToast } from '../components/ui/Toast';
import type { FormField, FormSubmission, RegistrationForm } from '../types';

export default function RegistrationsView({ formId }: { formId?: string }) {
  return formId ? <FormDetail id={formId} /> : <FormList />;
}

function useMySubmissions() {
  const { user } = useSession();
  const { data } = useCol<FormSubmission>(user ? query(collection(db, 'form_submissions'), where('userId', '==', user.uid)) : null);
  return new Set(data.map((s) => s.formId));
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  if (isDeadlinePassed(deadline)) return <Badge tone="neutral">Chiuso</Badge>;
  const d = daysUntil(deadline);
  if (d <= 3) return <Badge tone="warning">{d === 0 ? 'Scade oggi' : d === 1 ? 'Scade domani' : `Ancora ${d} giorni`}</Badge>;
  return <Badge tone="success">Aperto</Badge>;
}

function FormList() {
  const { data: forms, loading } = useCol<RegistrationForm>(query(collection(db, 'forms'), orderBy('timestamp', 'desc')));
  const mine = useMySubmissions();
  const open = forms.filter((f) => !isDeadlinePassed(f.deadline)).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const closed = forms.filter((f) => isDeadlinePassed(f.deadline));

  const renderCard = (f: RegistrationForm) => {
    const expired = isDeadlinePassed(f.deadline);
    return (
      <Card key={f.id} interactive={!expired} onClick={() => !expired && navigate(routes.registration(f.id))} className={`flex flex-col p-5 ${expired ? 'opacity-60' : ''}`}>
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <DeadlineBadge deadline={f.deadline} />
          {mine.has(f.id) && <Badge tone="primary" icon={<CheckCircle2 size={11} />}>Iscritto</Badge>}
          {f.parish && f.parish !== 'Unità Pastorale' && <ParishBadge parish={f.parish} />}
        </div>
        <h3 className="text-lg font-semibold leading-snug">{f.title}</h3>
        <p className="mt-1.5 line-clamp-3 flex-1 whitespace-pre-line text-sm text-muted">{f.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
          <span className="flex items-center gap-1.5 text-muted">
            <CalendarClock size={15} /> entro il {formatDate(f.deadline, { day: 'numeric', month: 'long' })}
          </span>
          {!expired && <span className="font-semibold text-primary">Iscriviti →</span>}
        </div>
      </Card>
    );
  };

  return (
    <Page wide>
      <PageHeader eyebrow="Iscrizioni" title="Partecipa alle attività" description="Grest, campi scuola, catechismo, pellegrinaggi: iscriviti online in pochi istanti." icon={<ClipboardList size={26} />} />
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <EmptyState icon={<ClipboardList size={26} />} title="Nessuna iscrizione aperta" description="Al momento non ci sono moduli di iscrizione attivi. Torna a trovarci!" />
      ) : (
        <>
          {open.length === 0 ? (
            <EmptyState className="mb-10" title="Nessuna iscrizione aperta" description="Tutte le iscrizioni sono attualmente chiuse." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{open.map(renderCard)}</div>
          )}
          {closed.length > 0 && (
            <>
              <h2 className="mb-4 mt-12 text-lg font-semibold text-muted">Iscrizioni chiuse</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{closed.slice(0, 6).map(renderCard)}</div>
            </>
          )}
        </>
      )}
    </Page>
  );
}

function fieldKey(f: FormField) {
  return f.label;
}

function FieldInput({ field, value, onChange }: { field: FormField; value: string | boolean | undefined; onChange: (v: string | boolean) => void }) {
  const common = { label: field.label, required: field.required };
  switch (field.type) {
    case 'textarea':
      return <Textarea {...common} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} maxLength={3000} />;
    case 'select':
      return (
        <Select {...common} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Seleziona…</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      );
    case 'checkbox':
      return (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-2/50 p-4">
          <input type="checkbox" required={field.required} checked={!!value} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]" />
          <span className="text-sm text-ink-2">
            {field.label}
            {field.required && <span className="text-danger"> *</span>}
          </span>
        </label>
      );
    default:
      return <Input {...common} type={field.type} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} maxLength={500} />;
  }
}

function FormDetail({ id }: { id: string }) {
  const { user, login } = useSession();
  const toast = useToast();
  const { data: form, loading } = useDocData<RegistrationForm>(doc(db, 'forms', id));
  const mine = useMySubmissions();
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Precompila nome ed email se l'utente è autenticato
  useEffect(() => {
    if (!form || !user) return;
    setValues((v) => {
      const next = { ...v };
      for (const f of form.fields ?? []) {
        const l = f.label.toLowerCase();
        if (next[fieldKey(f)]) continue;
        if (f.type === 'email' || l === 'email') next[fieldKey(f)] = user.email ?? '';
        else if (/(nome e cognome|nominativo|^nome$)/.test(l) && user.displayName) next[fieldKey(f)] = user.displayName;
      }
      return next;
    });
  }, [form, user]);

  if (loading)
    return (
      <Page>
        <Skeleton className="h-96" />
      </Page>
    );
  if (!form)
    return (
      <Page>
        <EmptyState title="Modulo non trovato" action={<a href={`#${routes.registrations}`} className="font-semibold text-primary">Torna alle iscrizioni</a>} />
      </Page>
    );

  const expired = isDeadlinePassed(form.deadline);
  const already = mine.has(form.id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data: Record<string, string | boolean> = {};
      for (const f of form.fields) data[fieldKey(f)] = typeof values[fieldKey(f)] === 'string' ? (values[fieldKey(f)] as string).trim() : values[fieldKey(f)] ?? (f.type === 'checkbox' ? false : '');
      await addDoc(collection(db, 'form_submissions'), {
        formId: form.id,
        formTitle: form.title,
        userId: user?.uid ?? 'anonymous',
        userEmail: user?.email ?? (Object.entries(data).find(([k]) => k.toLowerCase().includes('email'))?.[1] as string) ?? '',
        data,
        timestamp: Date.now(),
      });
      setDone(true);
      setValues({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      toast.error("Invio non riuscito. Controlla i dati e riprova.");
    }
    setSubmitting(false);
  };

  return (
    <Page>
      <a href={`#${routes.registrations}`} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={18} /> Tutte le iscrizioni
      </a>

      {done ? (
        <Card className="flex flex-col items-center px-6 py-14 text-center">
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={32} />
          </span>
          <h1 className="text-3xl font-semibold">Iscrizione inviata!</h1>
          <p className="mt-2 max-w-md text-muted">
            Grazie! La tua iscrizione a <strong className="text-ink">{form.title}</strong> è stata registrata correttamente.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => setDone(false)}>
              Iscrivi un'altra persona
            </Button>
            <Button onClick={() => navigate(routes.registrations)}>Torna alle iscrizioni</Button>
          </div>
        </Card>
      ) : (
        <>
          <header className="mb-8">
            <div className="mb-3 flex flex-wrap gap-1.5">
              <DeadlineBadge deadline={form.deadline} />
              <ParishBadge parish={form.parish} />
            </div>
            <h1 className="text-3xl font-semibold sm:text-4xl">{form.title}</h1>
            <p className="mt-3 whitespace-pre-line text-ink-2">{form.description}</p>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
              <CalendarClock size={15} /> Iscrizioni entro {formatDate(form.deadline, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </header>

          {expired ? (
            <Notice tone="warning">Le iscrizioni per questa attività sono chiuse.</Notice>
          ) : (
            <Card className="p-5 sm:p-8">
              {already && (
                <div className="mb-6">
                  <Notice tone="success" icon={<CheckCircle2 size={18} />}>
                    Hai già inviato un'iscrizione per questa attività. Puoi comunque iscrivere un'altra persona (es. un familiare).
                  </Notice>
                </div>
              )}
              {!user && (
                <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl bg-surface-2 p-4 sm:flex-row sm:items-center">
                  <p className="text-sm text-ink-2">Accedi per ritrovare le tue iscrizioni nell'area personale.</p>
                  <Button size="sm" variant="outline" icon={<LogIn size={15} />} onClick={login}>
                    Accedi
                  </Button>
                </div>
              )}
              <form onSubmit={submit} className="space-y-5">
                {(form.fields ?? []).map((f, i) => (
                  <FieldInput key={f.id ?? i} field={f} value={values[fieldKey(f)]} onChange={(v) => setValues((s) => ({ ...s, [fieldKey(f)]: v }))} />
                ))}
                <p className="text-xs text-muted">I dati sono trattati dalla parrocchia esclusivamente per l'organizzazione dell'attività.</p>
                <Button type="submit" size="lg" block loading={submitting} icon={<Send size={18} />}>
                  Invia iscrizione
                </Button>
              </form>
            </Card>
          )}
        </>
      )}
    </Page>
  );
}
