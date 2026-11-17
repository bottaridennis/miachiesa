import { useEffect, useState } from 'react';
import { addDoc, collection, orderBy, query } from 'firebase/firestore';
import { CheckCircle2, Clock, Mail, MapPin, MessageSquareText, Phone, Send } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCol } from '../lib/useCol';
import { useSession } from '../lib/session';
import { useSiteConfig } from '../lib/siteConfig';
import { DEFAULT_SERVICE_OPTIONS } from '../lib/defaults';
import { Page, PageHeader } from '../components/ui/Page';
import { Card } from '../components/ui/Card';
import { Input, Select, Textarea } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import type { ServiceOption } from '../types';

export default function ServicesView() {
  const { user } = useSession();
  const { config } = useSiteConfig();
  const toast = useToast();
  const { data: dynamic } = useCol<ServiceOption>(query(collection(db, 'service_options'), orderBy('timestamp', 'asc')));
  const options = dynamic.length > 0 ? dynamic : DEFAULT_SERVICE_OPTIONS;

  const empty = { name: '', email: '', phone: '', service: '', message: '' };
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  // Precompila i dati dell'utente autenticato
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.displayName || '', email: f.email || user.email || '' }));
  }, [user]);

  // Se le opzioni cambiano (caricamento da Firestore), il valore selezionato deve restare valido
  const serviceValue = options.some((o) => o.value === form.service) ? form.service : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceValue) {
      toast.error('Seleziona il tipo di richiesta.');
      return;
    }
    setSubmitting(true);
    try {
      const label = options.find((o) => o.value === serviceValue)?.label ?? serviceValue;
      await addDoc(collection(db, 'messages'), {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        service: label,
        message: form.message.trim(),
        status: 'nuova',
        userId: user?.uid ?? null,
        timestamp: Date.now(),
      });
      setSent(label);
      setForm({ ...empty, name: user?.displayName ?? '', email: user?.email ?? '' });
    } catch (err) {
      console.error(err);
      toast.error("Invio non riuscito. Riprova più tardi o contattaci telefonicamente.");
    }
    setSubmitting(false);
  };

  return (
    <Page wide>
      <PageHeader eyebrow="Segreteria" title="Come possiamo aiutarti?" description="Richiedi certificati, prenota un colloquio con il parroco o chiedi informazioni: ti risponderemo il prima possibile." icon={<MessageSquareText size={26} />} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="min-w-0 p-5 sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
                <CheckCircle2 size={32} />
              </span>
              <h2 className="text-2xl font-semibold">Richiesta inviata!</h2>
              <p className="mt-2 max-w-sm text-muted">
                Abbiamo ricevuto la tua richiesta per <strong className="text-ink">{sent}</strong>. La segreteria ti contatterà al più presto.
              </p>
              <Button variant="secondary" className="mt-6" onClick={() => setSent(null)}>
                Invia un'altra richiesta
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <h2 className="text-xl font-semibold">Nuova richiesta</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Nome e cognome" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
                <Input label="Email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={200} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Select label="Tipo di richiesta" required value={serviceValue} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                  <option value="" disabled>
                    Seleziona…
                  </option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <Input label="Telefono" type="tel" autoComplete="tel" hint="Facoltativo, per essere ricontattato" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={30} />
              </div>
              <Textarea
                label="Dettagli"
                rows={5}
                placeholder="Es. per un certificato: nome dell'interessato, data e parrocchia del sacramento…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                maxLength={3000}
              />
              <p className="text-xs text-muted">I dati inseriti sono usati esclusivamente dalla segreteria parrocchiale per rispondere alla tua richiesta.</p>
              <Button type="submit" size="lg" block loading={submitting} icon={<Send size={18} />}>
                Invia richiesta
              </Button>
            </form>
          )}
        </Card>

        <aside className="min-w-0 space-y-4">
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Clock size={18} className="text-gold" /> Orari di apertura
            </h3>
            <dl className="divide-y divide-line">
              {config.officeHours.map((h, i) => (
                <div key={i} className="flex justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-ink-2">{h.label}</dt>
                  <dd className={h.hours.toLowerCase() === 'chiuso' ? 'text-muted' : 'font-semibold text-ink'}>{h.hours}</dd>
                </div>
              ))}
            </dl>
          </Card>
          {(config.phone || config.email || config.address) && (
            <Card className="space-y-1 p-2">
              {config.phone && (
                <a href={`tel:${config.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 rounded-xl p-3 hover:bg-surface-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Phone size={18} />
                  </span>
                  <span>
                    <span className="block text-xs text-muted">Telefono</span>
                    <span className="block font-semibold text-ink">{config.phone}</span>
                  </span>
                </a>
              )}
              {config.email && (
                <a href={`mailto:${config.email}`} className="flex items-center gap-3 rounded-xl p-3 hover:bg-surface-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Mail size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-muted">Email</span>
                    <span className="block truncate font-semibold text-ink">{config.email}</span>
                  </span>
                </a>
              )}
              {config.address && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(config.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl p-3 hover:bg-surface-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <MapPin size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-muted">Indirizzo</span>
                    <span className="block font-semibold text-ink">{config.address}</span>
                  </span>
                </a>
              )}
            </Card>
          )}
        </aside>
      </div>
    </Page>
  );
}
