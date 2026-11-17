import { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Monitor, Moon, Sun } from 'lucide-react';
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
  const { run } = useAction();
  const { data } = useDocData<UserSettings & { id: string }>(user ? doc(db, 'user_settings', user.uid) : null);
  const [settings, setSettings] = useState<UserSettings>({ emailNotifications: true, preferredParish: 'Unità Pastorale', phone: '' });
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    if (data) setSettings({ emailNotifications: data.emailNotifications ?? true, preferredParish: data.preferredParish ?? 'Unità Pastorale', phone: data.phone ?? '' });
  }, [data]);

  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await run(
      () => setDoc(doc(db, 'user_settings', user.uid), { ...settings, email: user.email, name: user.displayName, updatedAt: Date.now() }),
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
                description="Acconsento a ricevere via email le comunicazioni della parrocchia."
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

        <Button variant="outline" onClick={logout}>
          Esci dall'account
        </Button>
      </div>
    </>
  );
}
