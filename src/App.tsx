import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, LogIn, LogOut, Monitor, Moon, Search, Shield, Sun, UserRound, X } from 'lucide-react';
import { ToastProvider } from './components/ui/Toast';
import { ConfirmProvider } from './components/ui/Dialog';
import { SessionProvider, useSession } from './lib/session';
import { navigate, routes, useRoute } from './lib/router';
import { useTheme, type ThemePref } from './lib/theme';
import { isFirebaseConfigured } from './lib/firebase';
import { DATA_ERROR_EVENT } from './lib/useCol';
import { cn } from './lib/cn';
import { isActive, MOBILE_MORE, MOBILE_TABS, NAV_ITEMS } from './nav';
import { Brand, BrandMark } from './components/Brand';
import { GlobalSearch, SearchTrigger } from './components/GlobalSearch';
import { Avatar } from './components/ui/Avatar';
import { Button } from './components/ui/Button';
import { SkeletonList } from './components/ui/Feedback';
import { Page } from './components/ui/Page';
import HomeView from './views/HomeView';
import LiturgyView from './views/LiturgyView';
import CommunityView from './views/CommunityView';
import ServicesView from './views/ServicesView';
import RegistrationsView from './views/RegistrationsView';
import DonationsView from './views/DonationsView';
import NoticeDetailView from './views/NoticeDetailView';
import NotFoundView from './views/NotFoundView';
import { CookieView, PrivacyView } from './views/LegalView';
import { CookieBanner } from './components/CookieBanner';
import { Footer, LoginPrivacyNote } from './components/Footer';

// L'area riservata è caricata solo quando serve: alleggerisce il bundle per i visitatori
const AccountView = lazy(() => import('./views/AccountView'));

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <SessionProvider>
          <Shell />
        </SessionProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

function Shell() {
  const { path, segments } = useRoute();
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    const onErr = (e: Event) => setDataError((e as CustomEvent<string>).detail);
    window.addEventListener(DATA_ERROR_EVENT, onErr);
    return () => window.removeEventListener(DATA_ERROR_EVENT, onErr);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => setMoreOpen(false), [path]);

  useEffect(() => {
    const item = NAV_ITEMS.find((n) => n.path !== '/' && isActive(path, n.path));
    document.title = item ? `${item.label} · Mia Chiesa` : path.startsWith('/area') ? 'Area personale · Mia Chiesa' : 'Mia Chiesa · Unità Pastorale';
  }, [path]);

  return (
    <div className="min-h-dvh bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">
        Vai al contenuto
      </a>
      <Sidebar path={path} onSearch={() => setSearchOpen(true)} />
      <MobileHeader onSearch={() => setSearchOpen(true)} />

      <main id="main" className="md:pl-72">
        {!isFirebaseConfigured && (
          <div className="bg-danger-soft px-4 py-2 text-center text-sm font-medium text-danger">
            Configurazione Firebase mancante: i dati non possono essere caricati.
          </div>
        )}
        {isFirebaseConfigured && dataError === 'permission-denied' && (
          <div role="alert" className="bg-warning-soft px-4 py-2 text-center text-sm font-medium text-warning">
            Alcuni contenuti non sono accessibili: le regole di sicurezza del database non sono aggiornate.
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={segments.slice(0, 2).join('/')}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Router segments={segments} />
          </motion.div>
        </AnimatePresence>
        <Footer />
      </main>

      <MobileTabBar path={path} onMore={() => setMoreOpen(true)} moreOpen={moreOpen} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} path={path} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CookieBanner />
    </div>
  );
}

function Router({ segments }: { segments: string[] }) {
  const [first, second, third] = segments;
  switch (first) {
    case undefined:
      return <HomeView />;
    case 'avvisi':
      return second ? <NoticeDetailView id={second} /> : <HomeView />;
    case 'liturgia':
      return <LiturgyView />;
    case 'comunita':
      return <CommunityView groupId={second === 'gruppo' ? third : undefined} />;
    case 'segreteria':
      return <ServicesView />;
    case 'iscrizioni':
      return <RegistrationsView formId={second} />;
    case 'donazioni':
      return <DonationsView />;
    case 'privacy':
      return <PrivacyView />;
    case 'cookie':
      return <CookieView />;
    case 'area':
      return (
        <Suspense
          fallback={
            <Page>
              <SkeletonList count={4} />
            </Page>
          }
        >
          <AccountView section={second} />
        </Suspense>
      );
    default:
      return <NotFoundView />;
  }
}

function UserBox() {
  const { user, loading, login, logout, isAdmin, profile } = useSession();
  if (loading) return <div className="skeleton h-14 rounded-2xl" />;
  if (!user)
    return (
      <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
        <p className="text-sm font-semibold text-ink">Entra nella comunità</p>
        <p className="mb-3 mt-0.5 text-xs text-muted">Salva gli avvisi preferiti e gestisci le tue iscrizioni.</p>
        <Button block size="sm" icon={<LogIn size={16} />} onClick={login}>
          Accedi con Google
        </Button>
        <LoginPrivacyNote className="mt-2" />
      </div>
    );
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
      <button onClick={() => navigate(routes.account)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left">
        <Avatar src={user.photoURL} name={profile?.name || user.displayName} size={38} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{user.displayName || user.email}</span>
          <span className="flex items-center gap-1 truncate text-xs text-muted">
            {isAdmin && <Shield size={11} className="text-gold" />}
            {isAdmin ? 'Amministratore' : 'Area personale'}
          </span>
        </span>
      </button>
      <button onClick={logout} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Esci" title="Esci">
        <LogOut size={17} />
      </button>
    </div>
  );
}

function ThemeSwitch() {
  const [pref, setPref] = useTheme();
  const opts: { v: ThemePref; icon: typeof Sun; label: string }[] = [
    { v: 'light', icon: Sun, label: 'Chiaro' },
    { v: 'system', icon: Monitor, label: 'Automatico' },
    { v: 'dark', icon: Moon, label: 'Scuro' },
  ];
  return (
    <div className="flex rounded-xl bg-surface-2 p-1" role="radiogroup" aria-label="Tema">
      {opts.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={pref === o.v}
          title={o.label}
          onClick={() => setPref(o.v)}
          className={cn('flex flex-1 items-center justify-center rounded-lg py-1.5 transition-all', pref === o.v ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}
        >
          <o.icon size={15} />
          <span className="sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function Sidebar({ path, onSearch }: { path: string; onSearch: () => void }) {
  const { user } = useSession();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-line bg-surface/70 backdrop-blur-xl md:flex">
      <div className="px-5 pb-4 pt-6">
        <a href="#/" className="block rounded-xl">
          <Brand />
        </a>
      </div>
      <div className="px-4 pb-3">
        <SearchTrigger onOpen={onSearch} />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Navigazione principale">
        {NAV_ITEMS.map((item) => {
          const active = isActive(path, item.path);
          return (
            <a
              key={item.path}
              href={`#${item.path}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors',
                active ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
              )}
            >
              <item.icon size={19} className={active ? 'text-primary' : 'text-muted group-hover:text-ink'} />
              {item.label}
            </a>
          );
        })}
        {user && (
          <>
            <div className="mx-3 my-3 border-t border-line" />
            <a
              href={`#${routes.account}`}
              aria-current={path.startsWith('/area') ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors',
                path.startsWith('/area') ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
              )}
            >
              <UserRound size={19} className={path.startsWith('/area') ? 'text-primary' : 'text-muted'} />
              Area personale
            </a>
          </>
        )}
      </nav>
      <div className="space-y-3 p-4">
        <ThemeSwitch />
        <UserBox />
      </div>
    </aside>
  );
}

function MobileHeader({ onSearch }: { onSearch: () => void }) {
  const { user, login, loading } = useSession();
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:hidden">
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <a href="#/" className="min-w-0">
          <Brand />
        </a>
        <div className="flex items-center gap-1">
          <button onClick={onSearch} className="rounded-xl p-2.5 text-ink-2 hover:bg-surface-2" aria-label="Cerca">
            <Search size={21} />
          </button>
          {!loading &&
            (user ? (
              <a href={`#${routes.account}`} className="rounded-full p-1" aria-label="Area personale">
                <Avatar src={user.photoURL} name={user.displayName} size={32} />
              </a>
            ) : (
              <button onClick={login} className="rounded-xl p-2.5 text-ink-2 hover:bg-surface-2" aria-label="Accedi">
                <LogIn size={21} />
              </button>
            ))}
        </div>
      </div>
    </header>
  );
}

function MobileTabBar({ path, onMore, moreOpen }: { path: string; onMore: () => void; moreOpen: boolean }) {
  const moreActive = moreOpen || MOBILE_MORE.some((m) => isActive(path, m.path)) || path.startsWith('/area');
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/90 pb-safe backdrop-blur-xl md:hidden" aria-label="Navigazione">
      <div className="mx-auto grid h-16 max-w-md grid-cols-5">
        {MOBILE_TABS.map((item) => {
          const active = isActive(path, item.path);
          return (
            <a
              key={item.path}
              href={`#${item.path}`}
              aria-current={active ? 'page' : undefined}
              className={cn('relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors', active ? 'text-primary' : 'text-muted')}
            >
              {active && <motion.span layoutId="tab-pill" className="absolute top-1.5 h-8 w-14 rounded-full bg-primary-soft" transition={{ type: 'spring', damping: 30, stiffness: 400 }} />}
              <item.icon size={21} className="relative" strokeWidth={active ? 2.3 : 2} />
              <span className="relative">{item.label}</span>
            </a>
          );
        })}
        <button onClick={onMore} className={cn('relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold', moreActive ? 'text-primary' : 'text-muted')} aria-haspopup="dialog">
          {moreActive && <span className="absolute top-1.5 h-8 w-14 rounded-full bg-primary-soft" />}
          <LayoutGrid size={21} className="relative" />
          <span className="relative">Altro</span>
        </button>
      </div>
    </nav>
  );
}

function MoreSheet({ open, onClose, path }: { open: boolean; onClose: () => void; path: string }) {
  const { user, login, logout, isAdmin } = useSession();
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Altre sezioni">
          <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 380 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => info.offset.y > 80 && onClose()}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-float"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line-strong" />
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-3">
                <BrandMark className="h-9 w-9" />
                <span className="font-serif text-lg font-semibold">Altro</span>
              </span>
              <button onClick={onClose} className="rounded-xl p-2 text-muted hover:bg-surface-2" aria-label="Chiudi">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[...MOBILE_MORE, ...(user ? [{ path: routes.account, label: isAdmin ? 'Area riservata' : 'Area personale', icon: isAdmin ? Shield : UserRound, description: isAdmin ? 'Gestione contenuti' : 'Preferiti e profilo' }] : [])].map((item) => (
                <a
                  key={item.path}
                  href={`#${item.path}`}
                  className={cn('flex flex-col gap-3 rounded-2xl border p-4 transition-colors', isActive(path, item.path) ? 'border-primary/30 bg-primary-soft' : 'border-line bg-surface-2/50')}
                >
                  <item.icon size={22} className="text-primary" />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{item.label}</span>
                    <span className="block text-xs text-muted">{item.description}</span>
                  </span>
                </a>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              <ThemeSwitch />
              {user ? (
                <Button variant="outline" block icon={<LogOut size={17} />} onClick={() => { logout(); onClose(); }}>
                  Esci da {user.email}
                </Button>
              ) : (
                <>
                  <Button block icon={<LogIn size={17} />} onClick={() => { login(); onClose(); }}>
                    Accedi con Google
                  </Button>
                  <LoginPrivacyNote className="text-center" />
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
