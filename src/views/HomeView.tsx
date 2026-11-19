import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, CalendarDays, ClipboardList, Clock, HandHeart, Megaphone, MessageSquareText, Sparkles } from 'lucide-react';
import { useNotices, useMassTimes, useUpcomingEvents, useLiturgy } from '../lib/data';
import { useFavorites } from '../lib/favorites';
import { useSiteConfig } from '../lib/siteConfig';
import { useSession } from '../lib/session';
import { nextMass, nextMassLabel } from '../lib/format';
import { routes } from '../lib/router';
import { cn } from '../lib/cn';
import { NoticeCard } from '../components/NoticeCard';
import { EventCard } from '../components/EventCard';
import { Card } from '../components/ui/Card';
import { EmptyState, Skeleton, SkeletonList } from '../components/ui/Feedback';
import { SectionTitle } from '../components/ui/Page';
import type { Notice, ParishScope } from '../types';

type Filter = 'Tutte' | ParishScope;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

function readFilter(): Filter {
  try {
    return (localStorage.getItem('home_filter') as Filter) || 'Tutte';
  } catch {
    return 'Tutte';
  }
}

export default function HomeView() {
  const { user } = useSession();
  const { config } = useSiteConfig();
  const { data: notices, loading: noticesLoading } = useNotices(40);
  const { data: masses, loading: massesLoading } = useMassTimes();
  const { data: events, loading: eventsLoading } = useUpcomingEvents(3);
  const { current: reading } = useLiturgy(5);
  const { ids, toggle } = useFavorites();
  const [filter, setFilterState] = useState<Filter>(readFilter);

  const setFilter = (f: Filter) => {
    setFilterState(f);
    try {
      localStorage.setItem('home_filter', f);
    } catch {
      /* ignore */
    }
  };

  const next = useMemo(() => nextMass(masses), [masses]);

  const filtered = useMemo(() => {
    const list = notices.filter((n) => filter === 'Tutte' || !n.parish || n.parish === 'Unità Pastorale' || n.parish === filter);
    // Prima gli avvisi fissati e urgenti, poi in ordine cronologico
    const rank = (n: Notice) => (n.pinned ? 2 : 0) + (n.category === 'Urgente' ? 1 : 0);
    return [...list].sort((a, b) => rank(b) - rank(a) || (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }, [notices, filter]);

  const [featured, ...rest] = filtered;
  const firstName = user?.displayName?.split(' ')[0];

  const quick = [
    { href: routes.liturgy, icon: BookOpen, label: 'Liturgia', sub: 'Letture e Messe' },
    { href: routes.registrations, icon: ClipboardList, label: 'Iscrizioni', sub: 'Moduli online' },
    { href: routes.services, icon: MessageSquareText, label: 'Segreteria', sub: 'Certificati' },
    { href: routes.donations, icon: HandHeart, label: 'Donazioni', sub: 'Sostienici' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 sm:px-6 md:pt-8">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative isolate overflow-hidden rounded-3xl bg-[#0f1d36] text-white shadow-float"
      >
        {config.heroImageUrl ? (
          <img src={config.heroImageUrl} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" onError={(e) => (e.currentTarget.style.display = 'none')} />
        ) : (
          // Decorazione disegnata in CSS/SVG: nessuna immagine caricata da siti esterni
          <svg aria-hidden className="absolute inset-0 -z-10 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-cross" width="56" height="56" patternUnits="userSpaceOnUse">
                <path d="M28 18v20M21 25h14" stroke="#e2b65a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-cross)" />
          </svg>
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0b1528] via-[#0f1d36]/80 to-[#0f1d36]/20" />
        <div className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-gold-bright/20 blur-3xl" />
        <div className="flex min-h-[340px] flex-col justify-end p-6 sm:min-h-[400px] sm:p-10">
          <p className="mb-3 text-sm font-medium text-white/70">
            {greeting()}
            {firstName ? `, ${firstName}` : ''} ·{' '}
            {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="max-w-2xl font-serif text-4xl font-semibold leading-[1.05] text-white sm:text-6xl">
            Unità Pastorale
            <span className="block text-[0.66em] text-gold-bright sm:text-[1em]">Oppeano · Ca' degli Oppi</span>
          </h1>
          {config.welcomeMessage && <p className="mt-4 max-w-lg text-base text-white/80 sm:text-lg">{config.welcomeMessage}</p>}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            {massesLoading ? (
              <Skeleton className="h-14 w-72 !bg-white/10" />
            ) : next ? (
              <a href={`#${routes.liturgy}`} className="group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md transition-colors hover:bg-white/15">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/60">Prossima S. Messa</span>
                  <span className="block text-sm font-semibold">{nextMassLabel(next.at)}</span>
                  <span className="block truncate text-xs text-white/70">{next.mass.location}</span>
                </span>
                <ArrowRight size={16} className="ml-1 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
              </a>
            ) : (
              <a href={`#${routes.liturgy}`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0f1d36]">
                <Clock size={17} /> Orari delle Messe
              </a>
            )}
          </div>
        </div>
      </motion.section>

      {/* AZIONI RAPIDE */}
      <motion.nav
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4 }}
        className="mt-5 grid grid-cols-4 gap-2 sm:gap-4"
        aria-label="Accesso rapido"
      >
        {quick.map((q) => (
          <a
            key={q.href}
            href={`#${q.href}`}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center shadow-card transition-all hover:-translate-y-0.5 hover:shadow-float sm:flex-row sm:p-4 sm:text-left"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
              <q.icon size={21} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-ink sm:text-sm">{q.label}</span>
              <span className="hidden truncate text-xs text-muted sm:block">{q.sub}</span>
            </span>
          </a>
        ))}
      </motion.nav>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        {/* AVVISI */}
        <section aria-labelledby="avvisi-title" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="avvisi-title" className="flex items-center gap-2.5 text-2xl font-semibold">
              <Megaphone size={22} className="text-gold" /> Avvisi e notizie
            </h2>
            <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Filtra per parrocchia">
              {(['Tutte', 'Oppeano', "Ca' degli Oppi"] as Filter[]).map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                    filter === f ? 'bg-ink text-bg' : 'bg-surface-2 text-ink-2 hover:bg-surface-3',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {noticesLoading ? (
            <SkeletonList count={3} className="h-40" />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Megaphone size={26} />} title="Nessun avviso" description="Non ci sono avvisi pubblicati per questa parrocchia. Torna a trovarci presto!" />
          ) : (
            <div className="space-y-4">
              {featured && <NoticeCard notice={featured} featured favorite={ids.has(featured.id)} onToggleFavorite={() => toggle(featured)} />}
              {rest.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.04 }}>
                  <NoticeCard notice={n} favorite={ids.has(n.id)} onToggleFavorite={() => toggle(n)} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* COLONNA LATERALE */}
        <aside className="min-w-0 space-y-10">
          {reading && (
            <section>
              <SectionTitle title="Il Vangelo di oggi" icon={<Sparkles size={20} />} />
              <a href={`#${routes.liturgy}`} className="block">
                <Card interactive className="relative overflow-hidden p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-gold">{reading.gospel?.reference}</p>
                  <p className="prose-reading mt-2 line-clamp-6 !text-[15px]">{reading.gospel?.text}</p>
                  <p className="mt-3 text-sm font-semibold text-primary">Leggi tutte le letture →</p>
                </Card>
              </a>
            </section>
          )}

          <section>
            <SectionTitle
              title="Prossimi eventi"
              icon={<CalendarDays size={20} />}
              action={
                <a href={`#${routes.community}`} className="text-sm font-semibold text-primary hover:underline">
                  Tutti
                </a>
              }
            />
            {eventsLoading ? (
              <SkeletonList count={2} className="h-24" />
            ) : events.length === 0 ? (
              <EmptyState className="py-8" title="Nessun evento in programma" />
            ) : (
              <div className="space-y-3">
                {events.map((e) => (
                  <EventCard key={e.id} event={e} compact />
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
