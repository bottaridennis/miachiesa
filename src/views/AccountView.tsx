import { Fragment, type ComponentType } from 'react';
import {
  BarChart3, Bookmark, BookOpen, CalendarDays, Church, ClipboardCheck, ClipboardList, Inbox, LogIn, Megaphone, Settings2, Shield, SlidersHorizontal, UserCheck, UserRound, Users, UsersRound, ArrowLeft, type LucideIcon,
} from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSession } from '../lib/session';
import { useCol } from '../lib/useCol';
import { routes } from '../lib/router';
import { cn } from '../lib/cn';
import { Page } from '../components/ui/Page';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { Badge } from '../components/ui/Badge';
import { LoginPrivacyNote } from '../components/Footer';
import FavoritesSection from '../admin/FavoritesSection';
import MySubmissionsSection from '../admin/MySubmissionsSection';
import ProfileSection from '../admin/ProfileSection';
import NoticesManager from '../admin/NoticesManager';
import GroupsManager from '../admin/GroupsManager';
import EventsManager from '../admin/EventsManager';
import LiturgyManager from '../admin/LiturgyManager';
import MassesManager from '../admin/MassesManager';
import FormsManager from '../admin/FormsManager';
import MembershipsManager from '../admin/MembershipsManager';
import CommunityManager from '../admin/CommunityManager';
import MessagesManager from '../admin/MessagesManager';
import ServiceOptionsManager from '../admin/ServiceOptionsManager';
import SiteSettingsManager from '../admin/SiteSettingsManager';
import UsersManager from '../admin/UsersManager';
import StatsManager from '../admin/StatsManager';

type Level = 'user' | 'admin' | 'super';
interface Section {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  level: Level;
  component: ComponentType;
}

const SECTIONS: Section[] = [
  { id: 'preferiti', label: 'Preferiti', description: 'Avvisi salvati', icon: Bookmark, level: 'user', component: FavoritesSection },
  { id: 'mie-iscrizioni', label: 'Le mie iscrizioni', description: 'Moduli inviati', icon: ClipboardCheck, level: 'user', component: MySubmissionsSection },
  { id: 'avvisi', label: 'Avvisi', description: 'Pubblica e gestisci', icon: Megaphone, level: 'user', component: NoticesManager },
  { id: 'gruppi', label: 'Gruppi', description: 'Gruppi parrocchiali', icon: Users, level: 'user', component: GroupsManager },
  { id: 'profilo', label: 'Profilo', description: 'Preferenze e tema', icon: UserRound, level: 'user', component: ProfileSection },
  { id: 'segreteria', label: 'Richieste', description: 'Messaggi dalla segreteria', icon: Inbox, level: 'admin', component: MessagesManager },
  { id: 'eventi', label: 'Eventi', description: 'Calendario', icon: CalendarDays, level: 'admin', component: EventsManager },
  { id: 'liturgia', label: 'Letture', description: 'Letture del giorno', icon: BookOpen, level: 'admin', component: LiturgyManager },
  { id: 'messe', label: 'Orari Messe', description: 'Celebrazioni', icon: Church, level: 'admin', component: MassesManager },
  { id: 'moduli', label: 'Moduli', description: 'Iscrizioni online', icon: ClipboardList, level: 'admin', component: FormsManager },
  { id: 'membri', label: 'Abilitazioni', description: 'Richieste di pubblicazione', icon: UserCheck, level: 'admin', component: MembershipsManager },
  { id: 'comunita', label: 'Chi siamo', description: 'Sacerdoti e collaboratori', icon: UsersRound, level: 'admin', component: CommunityManager },
  { id: 'servizi', label: 'Tipi di richiesta', description: 'Opzioni segreteria', icon: SlidersHorizontal, level: 'admin', component: ServiceOptionsManager },
  { id: 'sito', label: 'Impostazioni sito', description: 'Contatti, orari, IBAN', icon: Settings2, level: 'admin', component: SiteSettingsManager },
  { id: 'statistiche', label: 'Statistiche', description: 'Panoramica', icon: BarChart3, level: 'admin', component: StatsManager },
  { id: 'utenti', label: 'Utenti', description: 'Amministratori', icon: Shield, level: 'super', component: UsersManager },
];

function useBadges(isAdmin: boolean) {
  // i messaggi vecchi non hanno il campo status: li contiamo come "nuovi"
  const { data: messages } = useCol<{ id: string; status?: string }>(isAdmin ? collection(db, 'messages') : null);
  const newMessages = messages.filter((m) => (m.status ?? 'nuova') === 'nuova');
  const { data: pending } = useCol<{ id: string }>(isAdmin ? query(collection(db, 'group_members'), where('isVerified', '==', false)) : null);
  return { segreteria: newMessages.length, membri: pending.length } as Record<string, number>;
}

export default function AccountView({ section }: { section?: string }) {
  const { user, loading, login, isAdmin, isSuperAdmin, profile } = useSession();
  const badges = useBadges(isAdmin);

  if (loading)
    return (
      <Page>
        <SkeletonList count={4} />
      </Page>
    );

  if (!user)
    return (
      <Page>
        <EmptyState
          className="mt-8"
          icon={<UserRound size={26} />}
          title="Accedi alla tua area personale"
          description="Salva gli avvisi preferiti, ritrova le tue iscrizioni e, se sei animatore di un gruppo, pubblica gli avvisi."
          action={
            <div className="flex flex-col items-center gap-2">
              <Button icon={<LogIn size={17} />} onClick={login}>
                Accedi con Google
              </Button>
              <LoginPrivacyNote className="max-w-xs text-center" />
            </div>
          }
        />
      </Page>
    );

  const allowed = SECTIONS.filter((s) => s.level === 'user' || (s.level === 'admin' && isAdmin) || (s.level === 'super' && isSuperAdmin));
  const current = allowed.find((s) => s.id === section);
  const userSections = allowed.filter((s) => s.level === 'user');
  const adminSections = allowed.filter((s) => s.level !== 'user');

  const NavList = ({ items }: { items: Section[] }) => (
    <div className="space-y-0.5">
      {items.map((s) => (
        <a
          key={s.id}
          href={`#${routes.accountSection(s.id)}`}
          aria-current={current?.id === s.id ? 'page' : undefined}
          className={cn('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors', current?.id === s.id ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-surface-2')}
        >
          <s.icon size={17} className={current?.id === s.id ? '' : 'text-muted'} />
          <span className="flex-1">{s.label}</span>
          {!!badges[s.id] && <span className="rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">{badges[s.id]}</span>}
        </a>
      ))}
    </div>
  );

  const Tile = ({ s }: { s: Section }) => (
    <a href={`#${routes.accountSection(s.id)}`} className="group relative flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-float">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
        <s.icon size={20} />
      </span>
      <span>
        <span className="block font-semibold text-ink">{s.label}</span>
        <span className="block text-xs text-muted">{s.description}</span>
      </span>
      {!!badges[s.id] && <span className="absolute right-3 top-3 rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">{badges[s.id]}</span>}
    </a>
  );

  const Current = current?.component;

  return (
    <Page wide>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Navigazione laterale (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-6">
            <div className="flex items-center gap-3 px-1">
              <Avatar src={user.photoURL} name={profile?.name || user.displayName} size={44} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{user.displayName}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-subtle">Personale</p>
              {NavList({ items: userSections })}
            </div>
            {adminSections.length > 0 && (
              <div>
                <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-subtle">Amministrazione</p>
                {NavList({ items: adminSections })}
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {Current ? (
            <>
              <a href={`#${routes.account}`} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink lg:hidden">
                <ArrowLeft size={18} /> Area personale
              </a>
              <Current />
            </>
          ) : (
            <>
              <header className="mb-8 flex items-center gap-4">
                <Avatar src={user.photoURL} name={user.displayName} size={60} className="ring-4 ring-surface-2" />
                <div className="min-w-0">
                  <h1 className="truncate text-3xl font-semibold">Ciao, {user.displayName?.split(' ')[0] || 'benvenuto'}</h1>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="truncate text-sm text-muted">{user.email}</span>
                    {isAdmin && (
                      <Badge tone="gold" icon={<Shield size={11} />}>
                        {isSuperAdmin ? 'Super admin' : 'Admin'}
                      </Badge>
                    )}
                  </div>
                </div>
              </header>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-subtle">Personale</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {userSections.map((s) => (
                  <Fragment key={s.id}>{Tile({ s })}</Fragment>
                ))}
              </div>
              {adminSections.length > 0 && (
                <>
                  <h2 className="mb-3 mt-10 text-sm font-bold uppercase tracking-wider text-subtle">Amministrazione</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {adminSections.map((s) => (
                      <Fragment key={s.id}>{Tile({ s })}</Fragment>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
