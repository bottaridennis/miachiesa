import { useEffect, useState } from 'react';
import { setDoc } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';
import { siteConfigRef, useSiteConfig } from '../lib/siteConfig';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Field';
import { SkeletonList } from '../components/ui/Feedback';
import { SectionHeader, useAction } from './common';
import type { DonationAccount, SiteConfig } from '../types';

const IBAN_RE = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;

export default function SiteSettingsManager() {
  const { config, loading } = useSiteConfig();
  const { run, toast } = useAction();
  const [form, setForm] = useState<SiteConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !form) setForm(config);
  }, [loading, config, form]);

  if (!form) return <SkeletonList count={3} className="h-40" />;

  const updateDonation = (i: number, patch: Partial<DonationAccount>) => setForm({ ...form, donations: form.donations.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const donations = form.donations.map((d) => ({ ...d, iban: d.iban.replace(/\s+/g, '').toUpperCase() }));
    const bad = donations.find((d) => !IBAN_RE.test(d.iban));
    if (bad) return toast.error(`IBAN non valido per "${bad.title || 'conto senza nome'}".`);
    setSaving(true);
    await run(() => setDoc(siteConfigRef(), { ...form, donations, officeHours: form.officeHours.filter((h) => h.label.trim()), updatedAt: Date.now() }), 'Impostazioni salvate');
    setSaving(false);
  };

  return (
    <form onSubmit={save}>
      <SectionHeader title="Impostazioni del sito" description="Contatti, orari della segreteria e coordinate per le donazioni." extra={<Button type="submit" loading={saving}>Salva tutto</Button>} />
      <div className="space-y-5">
        <Card className="space-y-5 p-5 sm:p-6">
          <h3 className="text-lg font-semibold">Home page</h3>
          <Input label="Messaggio di benvenuto" value={form.welcomeMessage ?? ''} onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })} maxLength={160} />
          <Input label="Immagine di copertina (URL)" type="url" placeholder="https://…" value={form.heroImageUrl ?? ''} onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })} hint="Lascia vuoto per usare l'immagine predefinita." />
        </Card>

        <Card className="space-y-5 p-5 sm:p-6">
          <h3 className="text-lg font-semibold">Contatti della segreteria</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Telefono" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Textarea label="Indirizzo" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-2">Orari di apertura</p>
              <Button size="sm" variant="ghost" icon={<Plus size={15} />} onClick={() => setForm({ ...form, officeHours: [...form.officeHours, { label: '', hours: '' }] })}>Aggiungi</Button>
            </div>
            <div className="space-y-2">
              {form.officeHours.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input aria-label="Giorni" placeholder="Giorni (es. Lun – Mer)" value={h.label} onChange={(e) => setForm({ ...form, officeHours: form.officeHours.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm" />
                  <input aria-label="Orario" placeholder="Orario (es. 9:30 – 12:00 o Chiuso)" value={h.hours} onChange={(e) => setForm({ ...form, officeHours: form.officeHours.map((x, j) => (j === i ? { ...x, hours: e.target.value } : x)) })} className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm" />
                  <IconButton label="Rimuovi" onClick={() => setForm({ ...form, officeHours: form.officeHours.filter((_, j) => j !== i) })}><Trash2 size={15} /></IconButton>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Conti per le donazioni</h3>
            <Button size="sm" variant="secondary" icon={<Plus size={15} />} onClick={() => setForm({ ...form, donations: [...form.donations, { id: crypto.randomUUID?.() ?? String(Date.now()), title: '', iban: '', holder: '', reason: 'Erogazione liberale', description: '' }] })}>
              Aggiungi conto
            </Button>
          </div>
          {form.donations.length === 0 && <p className="text-sm text-muted">Nessun conto: la pagina Donazioni mostrerà un messaggio “coordinate in arrivo”.</p>}
          {form.donations.map((d, i) => (
            <div key={d.id} className="space-y-3 rounded-2xl border border-line p-4">
              <div className="flex items-start gap-2">
                <Input className="flex-1" label="Titolo" required placeholder="Parrocchia di Oppeano" value={d.title} onChange={(e) => updateDonation(i, { title: e.target.value })} />
                <IconButton label="Rimuovi conto" className="mt-7 hover:text-danger" onClick={() => setForm({ ...form, donations: form.donations.filter((_, j) => j !== i) })}><Trash2 size={16} /></IconButton>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="IBAN" required value={d.iban} onChange={(e) => updateDonation(i, { iban: e.target.value })} className="font-mono" />
                <Input label="Intestatario" value={d.holder ?? ''} onChange={(e) => updateDonation(i, { holder: e.target.value })} />
              </div>
              <Input label="Causale consigliata" value={d.reason} onChange={(e) => updateDonation(i, { reason: e.target.value })} />
              <Input label="Descrizione breve" value={d.description} onChange={(e) => updateDonation(i, { description: e.target.value })} />
            </div>
          ))}
        </Card>
        <Button type="submit" size="lg" loading={saving}>Salva tutto</Button>
      </div>
    </form>
  );
}
