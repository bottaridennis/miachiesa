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
import { RoseWindow } from '../components/RoseWindow';
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
    { href: routes.liturgy, icon: BookOpen, label: 'Liturgia', sub: 'Letture e Messe', glass: 'from-[#13a37e] to-[#0b6e56]' },
    { href: routes.registrations, icon: ClipboardList, label: 'Iscrizioni', sub: 'Moduli online', glass: 'from-[#8a4fe0] to-[#5a2fb0]' },
    { href: routes.services, icon: MessageSquareText, label: 'Segreteria', sub: 'Certificati', glass: 'from-[#3c6df0] to-[#1e2a78]' },
    { href: routes.donations, icon: HandHeart, label: 'Donazioni', sub: 'Sostienici', glass: 'from-[#e04a66] to-[#a01d36]' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 sm:px-6 md:pt-8">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-vetrata relative isolate overflow-hidden rounded-[2rem] text-white shadow-float ring-1 ring-white/10"
      >
        {config.heroImageUrl ? (
          <>
            <img src={config.heroImageUrl} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0b1033] via-[#0b1033]/75 to-[#0b1033]/10" />
          </>
        ) : (
          <>
            {/* Raggi di luce colorata che entrano dalla vetrata */}
            <div className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[46rem] w-[46rem] animate-drift rounded-full opacity-60 blur-2xl [background:conic-gradient(from_200deg,transparent_0deg,rgb(138_79_224/0.45)_30deg,transparent_60deg,rgb(19_163_126/0.35)_95deg,transparent_130deg,rgb(210_58_85/0.35)_170deg,transparent_210deg)]" />
            {/* Rosone (solo SVG: nessuna immagine esterna) */}
            <RoseWindow className="pointer-events-none absolute -right-20 -top-20 -z-10 h-[220px] w-[220px] opacity-30 drop-shadow-[0_0_40px_rgba(138,79,224,0.55)] sm:-right-10 sm:top-1/2 sm:h-[420px] sm:w-[420px] sm:-translate-y-1/2 sm:opacity-95" />
          </>
        )}
        <div className="flex min-h-[360px] flex-col justify-end p-6 sm:min-h-[440px] sm:p-10 sm:pr-[400px] lg:p-12 lg:pr-[440px]">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-bright" />
            {greeting()}
            {firstName ? `, ${firstName}` : ''} ·{' '}
            {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="max-w-2xl font-serif text-[2.6rem] font-semibold leading-[1.02] text-white sm:text-6xl">
            Unità Pastorale
            <span className="text-gradient block pb-1 text-[0.66em] italic sm:text-[0.9em]">Oppeano · Ca' degli Oppi</span>
          </h1>
          {config.welcomeMessage && <p className="mt-4 max-w-lg text-base text-white/80 sm:text-lg">{config.welcomeMessage}</p>}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            {massesLoading ? (
              <Skeleton className="h-14 w-72 !bg-white/10" />
            ) : next ? (
              <a href={`#${routes.liturgy}`} className="group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.1)] backdrop-blur-md transition-colors hover:bg-white/[0.14]">
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
              <a href={`#${routes.liturgy}`} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3c86a] to-[#e8a13a] px-5 py-3 text-sm font-bold text-[#2a1f0a] shadow-lg">
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
            className="glass group flex flex-col items-center gap-2 rounded-2xl border border-white/70 p-3 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float dark:border-white/[0.06] sm:flex-row sm:p-4 sm:text-left"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_6px_16px_-6px_rgb(0_0_0/0.35)] transition-transform group-hover:scale-110 ${q.glass}`}>
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
                    filter === f ? 'bg-gradient-primary text-white shadow-glow' : 'glass border border-line text-ink-2 hover:border-violet/40',
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
