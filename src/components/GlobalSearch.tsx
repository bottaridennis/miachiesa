import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { BookOpen, CalendarDays, ClipboardList, CornerDownLeft, FileText, Megaphone, Search, Users, X, type LucideIcon } from 'lucide-react';
import { db } from '../lib/firebase';
import { navigate, routes } from '../lib/router';
import { NAV_ITEMS } from '../nav';
import { formatDate, massDayLabel } from '../lib/format';
import type { MassTime } from '../types';

interface Result {
  key: string;
  label: string;
  sub?: string;
  section: string;
  icon: LucideIcon;
  path: string;
  haystack: string;
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

async function loadIndex(): Promise<Result[]> {
  const get = async (name: string) => {
    try {
      return (await getDocs(collection(db, name))).docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    } catch {
      return [];
    }
  };
  const [notices, events, groups, masses, liturgy, forms, services] = await Promise.all(
    ['notices', 'events', 'groups', 'mass_times', 'liturgy', 'forms', 'service_options'].map(get),
  );
  const out: Result[] = [];
  notices.forEach((n) =>
    out.push({ key: 'n' + n.id, label: n.title, sub: n.parish, section: 'Avvisi', icon: Megaphone, path: routes.notice(n.id), haystack: `${n.title} ${n.content} ${n.parish}` }),
  );
  events.forEach((e) =>
    out.push({ key: 'e' + e.id, label: e.title, sub: `${formatDate(e.date, { day: 'numeric', month: 'short' })} · ${e.location}`, section: 'Eventi', icon: CalendarDays, path: routes.community, haystack: `${e.title} ${e.location} ${e.group} ${e.description ?? ''}` }),
  );
  groups.forEach((g) =>
    out.push({ key: 'g' + g.id, label: g.name, sub: g.parish, section: 'Gruppi', icon: Users, path: routes.group(g.id), haystack: `${g.name} ${g.description ?? ''} ${g.parish}` }),
  );
  masses.forEach((m: MassTime) =>
    out.push({ key: 'm' + m.id, label: `S. Messa ${massDayLabel(m)} ore ${m.time}`, sub: m.location, section: 'Messe', icon: BookOpen, path: routes.liturgy, haystack: `messa ${massDayLabel(m)} ${m.time} ${m.location} ${m.title ?? ''}` }),
  );
  liturgy.forEach((l) =>
    out.push({ key: 'l' + l.id, label: `Letture: ${l.date}`, sub: l.gospel?.reference, section: 'Liturgia', icon: BookOpen, path: routes.liturgy, haystack: `letture vangelo ${l.date} ${l.gospel?.reference ?? ''}` }),
  );
  forms.forEach((f) =>
    out.push({ key: 'f' + f.id, label: f.title, sub: `Scadenza ${formatDate(f.deadline, { day: 'numeric', month: 'short' })}`, section: 'Iscrizioni', icon: ClipboardList, path: routes.registration(f.id), haystack: `${f.title} ${f.description} iscrizione` }),
  );
  services.forEach((s) =>
    out.push({ key: 's' + s.id, label: s.label, section: 'Segreteria', icon: FileText, path: routes.services, haystack: `${s.label} ${s.description ?? ''}` }),
  );
  return out.map((r) => ({ ...r, haystack: norm(r.haystack) }));
}

export function SearchTrigger({ onOpen, className, dark }: { onOpen: () => void; className?: string; dark?: boolean }) {
  return (
    <button
      onClick={onOpen}
      className={`flex h-11 w-full items-center gap-3 rounded-xl border px-3.5 text-sm transition-colors ${
        dark ? 'border-white/10 bg-white/[0.07] text-white/55 hover:border-white/20 hover:bg-white/10' : 'border-line bg-surface text-subtle shadow-sm hover:border-line-strong'
      } ${className ?? ''}`}
    >
      <Search size={17} />
      <span className="flex-1 truncate text-left">Cerca…</span>
      <kbd className={`hidden rounded-md border px-1.5 py-0.5 font-sans text-[11px] font-semibold md:inline ${dark ? 'border-white/15 bg-white/10 text-white/60' : 'border-line bg-surface-2 text-muted'}`}>Ctrl K</kbd>
    </button>
  );
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<Result[] | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // I dati vengono caricati solo quando la ricerca viene aperta (prima: 7 listener sempre attivi, duplicati)
  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(0);
    loadIndex().then(setIndex);
    setTimeout(() => inputRef.current?.focus(), 30);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const results = useMemo(() => {
    const term = norm(q.trim());
    const pages: Result[] = NAV_ITEMS.map((n) => ({ key: 'p' + n.path, label: n.label, sub: n.description, section: 'Pagine', icon: n.icon, path: n.path, haystack: norm(`${n.label} ${n.description}`) }));
    if (!term) return pages;
    const words = term.split(/\s+/);
    return [...pages, ...(index ?? [])].filter((r) => words.every((w) => r.haystack.includes(w))).slice(0, 40);
  }, [q, index]);

  const go = (r: Result) => {
    navigate(r.path);
    onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      go(results[active]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let lastSection = '';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95] flex justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-6 sm:pt-[12vh]" role="dialog" aria-modal="true" aria-label="Ricerca">
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative flex max-h-[80dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-float"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={20} className="text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKey}
                placeholder="Cerca in tutta l'app…"
                className="h-14 flex-1 bg-transparent text-base text-ink placeholder:text-subtle focus:outline-none"
                aria-label="Cerca"
              />
              <button onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-surface-2" aria-label="Chiudi ricerca">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {q && index === null && <p className="px-3 py-6 text-center text-sm text-muted">Caricamento…</p>}
              {results.length === 0 && index !== null && (
                <p className="px-3 py-10 text-center text-sm text-muted">Nessun risultato per “{q}”.</p>
              )}
              <ul>
                {results.map((r, i) => {
                  const header = r.section !== lastSection ? r.section : null;
                  lastSection = r.section;
                  return (
                    <li key={r.key}>
                      {header && <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-subtle">{header}</p>}
                      <button
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(r)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${i === active ? 'bg-primary-soft' : ''}`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${i === active ? 'bg-surface text-primary' : 'bg-surface-2 text-muted'}`}>
                          <r.icon size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">{r.label}</span>
                          {r.sub && <span className="block truncate text-xs text-muted">{r.sub}</span>}
                        </span>
                        {i === active && <CornerDownLeft size={15} className="text-primary" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
