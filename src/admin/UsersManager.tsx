import { useState } from 'react';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { Download, Search, Shield } from 'lucide-react';
import { db, SUPER_ADMIN_EMAIL } from '../lib/firebase';
import { useCol } from '../lib/useCol';
import { relativeTime } from '../lib/format';
import { downloadCSV } from '../lib/csv';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SkeletonList } from '../components/ui/Feedback';
import { ListCard, SectionHeader, useAction } from './common';
import type { UserProfile } from '../types';

export default function UsersManager() {
  const { run, confirm } = useAction();
  const { data: users, loading } = useCol<UserProfile>(query(collection(db, 'users'), orderBy('lastLogin', 'desc')));
  const [q, setQ] = useState('');
  const filtered = users.filter((u) => `${u.name ?? ''} ${u.email ?? ''}`.toLowerCase().includes(q.toLowerCase()));

  const toggleAdmin = async (u: UserProfile) => {
    const making = !u.isAdmin;
    const ok = await confirm({
      title: making ? 'Rendere amministratore?' : 'Revocare i permessi?',
      message: making ? `${u.name || u.email} potrà gestire tutti i contenuti dell'app.` : `${u.name || u.email} non potrà più gestire i contenuti.`,
      confirmLabel: making ? 'Rendi admin' : 'Revoca',
      danger: !making,
    });
    if (ok) await run(() => updateDoc(doc(db, 'users', u.id), { isAdmin: making }), making ? 'Permessi concessi' : 'Permessi revocati');
  };

  const exportNewsletter = () =>
    run(async () => {
      const snap = await getDocs(collection(db, 'user_settings'));
      const rows = snap.docs.map((d) => d.data()).filter((s) => s.emailNotifications && s.email);
      downloadCSV('iscritti_newsletter', [['Nome', 'Email', 'Parrocchia', 'Telefono'], ...rows.map((s) => [s.name, s.email, s.preferredParish, s.phone])]);
    });

  return (
    <>
      <SectionHeader
        title="Utenti e amministratori"
        description={`${users.length} utenti registrati.`}
        extra={<Button variant="secondary" icon={<Download size={16} />} onClick={exportNewsletter}>Esporta iscritti newsletter</Button>}
      />
      <div className="relative mb-4">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per nome o email…" aria-label="Cerca utenti" className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-[15px] focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15" />
      </div>
      {loading ? (
        <SkeletonList count={5} className="h-14" />
      ) : (
        <ListCard>
          {filtered.map((u) => {
            const isSuper = u.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
            return (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar src={u.photoUrl} name={u.name || u.email} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-semibold text-ink">
                    {u.name || 'Utente'}
                    {(u.isAdmin || isSuper) && <Badge tone="gold" icon={<Shield size={10} />}>{isSuper ? 'Super admin' : 'Admin'}</Badge>}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {u.email}
                    {u.lastLogin && ` · ultimo accesso ${relativeTime(new Date(u.lastLogin).getTime())}`}
                  </p>
                </div>
                {!isSuper && (
                  <Button size="sm" variant={u.isAdmin ? 'danger' : 'outline'} onClick={() => toggleAdmin(u)}>
                    {u.isAdmin ? 'Revoca' : 'Rendi admin'}
                  </Button>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted">Nessun utente trovato.</p>}
        </ListCard>
      )}
    </>
  );
}
