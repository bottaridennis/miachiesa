import { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Download, Monitor, Moon, ShieldCheck, Sun, Trash2 } from 'lucide-react';
import { PrivacyLink } from '../components/ConsentCheckbox';
import { PRIVACY_VERSION } from '../lib/legal';
import { deleteAccount, exportUserData } from '../lib/userData';
import { formatDateTime } from '../lib/format';
import { navigate, routes } from '../lib/router';
import { db } from '../lib/firebase';
import { useSession } from '../lib/session';
import { useDocData } from '../lib/useCol';
import { useTheme, type ThemePref } from '../lib/theme';
import { cn } from '../lib/cn';
import { Card } from '../components/ui/Card';
import { Input, Toggle } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { SectionHeader, ParishSelect, useAction } from './common';
import type { UserSettings } from '../types';

export default function ProfileSection() {
  const { user, logout } = useSession();
  const { run, confirm, toast } = useAction();
  const { data } = useDocData<UserSettings & { id: string }>(user ? doc(db, 'user_settings', user.uid) : null);
  // Newsletter disattivata finché l'utente non sceglie di attivarla (niente caselle preselezionate)
  const [settings, setSettings] = useState<UserSettings>({ emailNotifications: false, preferredParish: 'Unità Pastorale', phone: '' });
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    if (data) setSettings({ emailNotifications: data.emailNotifications ?? false, emailNotificationsChangedAt: data.emailNotificationsChangedAt, preferredParish: data.preferredParish ?? 'Unità Pastorale', phone: data.phone ?? '' });
  }, [data]);

  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await run(
      () =>
        setDoc(doc(db, 'user_settings', user.uid), {
          ...settings,
          // registriamo quando il consenso è stato dato o revocato
          emailNotificationsChangedAt: settings.emailNotifications !== (data?.emailNotifications ?? false) ? Date.now() : settings.emailNotificationsChangedAt ?? null,
          privacyVersion: PRIVACY_VERSION,
          email: user.email,
          name: user.displayName,
          updatedAt: Date.now(),
        }),
      'Preferenze salvate',
    );
    try {
      if (settings.preferredParish !== 'Unità Pastorale') localStorage.setItem('home_filter', settings.preferredParish);
    } catch {
      /* ignore */
    }
    setSaving(false);
  };

  const themes: { v: ThemePref; label: string; icon: typeof Sun }[] = [
    { v: 'light', label: 'Chiaro', icon: Sun },
    { v: 'dark', label: 'Scuro', icon: Moon },
    { v: 'system', label: 'Automatico', icon: Monitor },
  ];

  return (
    <>
      <SectionHeader title="Profilo e preferenze" />
      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-subtle">Account Google collegato</p>
          <p className="mt-1 font-semibold text-ink">{user.displayName}</p>
          <p className="text-sm text-muted">{user.email}</p>
        </Card>

        <Card className="p-5 sm:p-6">
          <form onSubmit={save} className="space-y-5">
            <h3 className="text-lg font-semibold">Preferenze</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <ParishSelect label="La mia parrocchia" value={settings.preferredParish} onChange={(v) => setSettings({ ...settings, preferredParish: v as UserSettings['preferredParish'] })} />
              <Input label="Telefono" type="tel" hint="Facoltativo, visibile solo alla segreteria" value={settings.phone ?? ''} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} maxLength={30} />
            </div>
            <div className="border-t border-line pt-4">
              <Toggle
                checked={settings.emailNotifications}
                onChange={(v) => setSettings({ ...settings, emailNotifications: v })}
                label="Newsletter parrocchiale"
                description={
                  <>
                    Acconsento a ricevere via email le comunicazioni della parrocchia, come descritto nell'<PrivacyLink />. Posso revocare il consenso in qualsiasi momento.
                    {settings.emailNotificationsChangedAt && <span className="mt-1 block text-xs text-subtle">Ultima modifica: {formatDateTime(settings.emailNotificationsChangedAt)}</span>}
                  </>
                }
              />
            </div>
            <Button type="submit" loading={saving}>
              Salva preferenze
            </Button>
          </form>
        </Card>

        <Card className="p-5 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold">Aspetto</h3>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <button
                key={t.v}
                onClick={() => setTheme(t.v)}
                aria-pressed={theme === t.v}
                className={cn('flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition-colors', theme === t.v ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2 hover:bg-surface-2')}
              >
                <t.icon size={20} />
                {t.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck size={19} className="text-gold" /> I tuoi dati
          </h3>
          <p className="mt-1 text-sm text-muted">
            Puoi scaricare una copia dei dati collegati al tuo account o eliminarlo definitivamente. Dettagli nell'<PrivacyLink />.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              loading={busy === 'export'}
              onClick={async () => {
                setBusy('export');
                await run(() => exportUserData(user), 'Download avviato');
                setBusy(null);
              }}
            >
              Scarica i miei dati
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 size={16} />}
              loading={busy === 'delete'}
              onClick={async () => {
                const ok = await confirm({
                  title: 'Eliminare il tuo account?',
                  message: (
                    <>
                      Verranno cancellati profilo, preferenze, preferiti e abilitazioni ai gruppi, e non potrai più accedere con questo account. Ti chiederemo di confermare l'accesso con Google.
                      <br />
                      <br />
                      Le iscrizioni già inviate restano alla parrocchia per l'organizzazione delle attività: per cancellarle scrivi alla segreteria.
                    </>
                  ),
                  confirmLabel: 'Elimina definitivamente',
                  danger: true,
                });
                if (!ok) return;
                setBusy('delete');
                try {
                  await deleteAccount(user);
                  toast.success('Il tuo account è stato eliminato.');
                  navigate(routes.home);
                } catch (e: any) {
                  if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
                    console.error(e);
                    toast.error("Non è stato possibile eliminare l'account. Riprova o contatta la segreteria.");
                  }
                }
                setBusy(null);
              }}
            >
              Elimina account
            </Button>
          </div>
        </Card>

        <Button variant="outline" onClick={logout}>
          Esci dall'account
        </Button>
      </div>
    </>
  );
}
