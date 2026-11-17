import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Church, Clock, MapPin } from 'lucide-react';
import { useLiturgy, useMassTimes } from '../lib/data';
import { formatDate, massDayLabel, massOccursOn, nextMass, nextMassLabel, toISODate, WEEKDAYS, WEEKDAYS_SHORT } from '../lib/format';
import { cn } from '../lib/cn';
import { Page, PageHeader, SectionTitle } from '../components/ui/Page';
import { Card } from '../components/ui/Card';
import { Badge, ParishBadge } from '../components/ui/Badge';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { Select } from '../components/ui/Field';
import type { LiturgicalColor, Liturgy, MassTime, Reading } from '../types';

const COLORS: Record<LiturgicalColor, { label: string; swatch: string }> = {
  green: { label: 'Verde · Tempo ordinario', swatch: 'bg-emerald-600' },
  red: { label: 'Rosso', swatch: 'bg-red-600' },
  white: { label: 'Bianco', swatch: 'bg-white ring-1 ring-line-strong' },
  purple: { label: 'Viola', swatch: 'bg-purple-700' },
  rose: { label: 'Rosaceo', swatch: 'bg-rose-400' },
};

export default function LiturgyView() {
  return (
    <Page wide>
      <PageHeader eyebrow="Liturgia" title="Parola e celebrazioni" description="Le letture della Messa e gli orari delle celebrazioni nelle nostre chiese." icon={<BookOpen size={26} />} />
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <Readings />
        <MassSchedule />
      </div>
    </Page>
  );
}

function Readings() {
  const { data, current, loading } = useLiturgy(30);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const reading: Liturgy | null = (selectedId && data.find((l) => l.id === selectedId)) || current;
  const [tab, setTab] = useState(0);

  if (loading) return <SkeletonList count={1} className="h-96" />;
  if (!reading) return <EmptyState icon={<BookOpen size={26} />} title="Letture non disponibili" description="Le letture del giorno non sono ancora state inserite." />;

  const parts: { key: string; label: string; r?: Reading }[] = [
    { key: 'first', label: 'Prima lettura', r: reading.firstReading },
    { key: 'psalm', label: 'Salmo', r: reading.psalm },
    { key: 'second', label: 'Seconda lettura', r: reading.secondReading },
    { key: 'gospel', label: 'Vangelo', r: reading.gospel },
  ].filter((p) => p.r?.text);
  const active = parts[Math.min(tab, parts.length - 1)];
  const color = COLORS[reading.liturgicalColor] ?? COLORS.green;
  const isToday = reading.day === toISODate();

  return (
    <section aria-labelledby="letture" className="min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 id="letture" className="text-2xl font-semibold">
          Letture {isToday ? 'di oggi' : ''}
        </h2>
        {data.length > 1 && (
          <Select
            aria-label="Scegli il giorno"
            value={reading.id}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setTab(0);
            }}
            className="w-full sm:w-64"
          >
            {data.map((l) => (
              <option key={l.id} value={l.id}>
                {l.day ? `${formatDate(l.day, { day: 'numeric', month: 'short' })} · ` : ''}
                {l.date}
              </option>
            ))}
          </Select>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-line bg-surface-2/60 px-5 py-5 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {reading.day && <p className="text-xs font-bold uppercase tracking-wider text-gold">{formatDate(reading.day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>}
              <h3 className="mt-1 text-xl font-semibold sm:text-2xl">{reading.date}</h3>
            </div>
            <span className="flex items-center gap-2 text-xs font-semibold text-muted">
              <span className={cn('h-3.5 w-3.5 rounded-full', color.swatch)} />
              {color.label}
            </span>
          </div>
          <div className="no-scrollbar -mx-1 mt-5 flex gap-1 overflow-x-auto px-1" role="tablist">
            {parts.map((p, i) => (
              <button
                key={p.key}
                role="tab"
                aria-selected={active.key === p.key}
                onClick={() => setTab(i)}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  active.key === p.key ? 'bg-primary text-on-primary' : 'text-ink-2 hover:bg-surface-3',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <motion.div key={active.key + reading.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 py-7 sm:px-10 sm:py-10" role="tabpanel">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">{active.r?.reference}</p>
          <div className="prose-reading whitespace-pre-line">{active.r?.text}</div>
          {active.key === 'gospel' && <p className="mt-6 font-serif italic text-muted">Parola del Signore.</p>}
        </motion.div>
        {reading.comment && (
          <div className="border-t border-line bg-gold-soft/40 px-5 py-6 sm:px-10">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gold">Un pensiero per oggi</p>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{reading.comment}</p>
          </div>
        )}
      </Card>
    </section>
  );
}

function MassSchedule() {
  const { data: masses, loading } = useMassTimes();
  const today = new Date();
  const [dayOffset, setDayOffset] = useState(0);
  const [parish, setParish] = useState<'Tutte' | 'Oppeano' | "Ca' degli Oppi">('Tutte');

  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
  const selected = days[dayOffset];

  const matchesParish = (m: MassTime) => {
    if (parish === 'Tutte') return true;
    if (m.parish) return m.parish === parish || m.parish === 'Unità Pastorale';
    // dati vecchi senza campo parrocchia: deduciamo dal luogo
    const loc = (m.location || '').toLowerCase();
    return parish === 'Oppeano' ? loc.includes('oppeano') || loc.includes('carmine') : loc.includes('oppi');
  };

  const ofDay = useMemo(() => masses.filter((m) => massOccursOn(m, selected) && matchesParish(m)), [masses, selected, parish]);
  const next = useMemo(() => nextMass(masses.filter(matchesParish)), [masses, parish]);
  const special = masses.filter((m) => m.date && m.date >= toISODate()).sort((a, b) => (a.date! + a.time).localeCompare(b.date! + b.time));

  return (
    <section aria-labelledby="orari" className="min-w-0">
      <SectionTitle title={<span id="orari">Orari delle Messe</span>} icon={<Clock size={20} />} />

      {next && (
        <div className="mb-4 rounded-2xl bg-primary p-5 text-on-primary shadow-float">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Prossima celebrazione</p>
          <p className="mt-1 font-serif text-2xl font-semibold">{nextMassLabel(next.at)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm opacity-85">
            <MapPin size={14} /> {next.mass.location}
          </p>
        </div>
      )}

      <div className="mb-3 flex gap-1 rounded-xl bg-surface-2 p-1">
        {(['Tutte', 'Oppeano', "Ca' degli Oppi"] as const).map((p) => (
          <button key={p} onClick={() => setParish(p)} className={cn('flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all', parish === p ? 'bg-surface text-ink shadow-sm' : 'text-muted')}>
            {p}
          </button>
        ))}
      </div>

      <div className="no-scrollbar -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 py-1">
        {days.map((d, i) => (
          <button
            key={i}
            onClick={() => setDayOffset(i)}
            aria-pressed={i === dayOffset}
            className={cn(
              'flex w-12 shrink-0 flex-col items-center rounded-xl border py-2 transition-all',
              i === dayOffset ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
              d.getDay() === 0 && i !== dayOffset && 'text-gold',
            )}
          >
            <span className="text-[10px] font-bold uppercase">{i === 0 ? 'Oggi' : WEEKDAYS_SHORT[d.getDay()]}</span>
            <span className="text-lg font-semibold">{d.getDate()}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList count={3} className="h-20" />
      ) : ofDay.length === 0 ? (
        <EmptyState className="py-8" icon={<Church size={24} />} title={`Nessuna Messa ${dayOffset === 0 ? 'oggi' : WEEKDAYS[selected.getDay()].toLowerCase()}`} description={parish !== 'Tutte' ? 'Prova a selezionare tutte le parrocchie.' : undefined} />
      ) : (
        <div className="space-y-2.5">
          {ofDay.map((m) => (
            <MassRow key={m.id} m={m} />
          ))}
        </div>
      )}

      {special.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-lg font-semibold">Celebrazioni straordinarie</h3>
          <div className="space-y-2.5">
            {special.map((m) => (
              <MassRow key={m.id} m={m} showDay />
            ))}
          </div>
        </div>
      )}

      {masses.length > 0 && (
        <details className="group mt-8 rounded-2xl border border-line bg-surface p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-ink marker:hidden">
            <span className="flex items-center justify-between">
              Orario settimanale completo <span className="text-muted transition-transform group-open:rotate-180">⌄</span>
            </span>
          </summary>
          <div className="mt-4 divide-y divide-line">
            {masses
              .filter((m) => !m.date)
              .map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{massDayLabel(m)}</span>
                    <span className="block truncate text-xs text-muted">{m.location}</span>
                  </span>
                  <span className="font-serif text-lg font-semibold">{m.time}</span>
                </div>
              ))}
          </div>
        </details>
      )}
    </section>
  );
}

function MassRow({ m, showDay }: { m: MassTime; showDay?: boolean }) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="w-16 shrink-0 text-center font-serif text-2xl font-semibold text-ink">{m.time}</div>
      <div className="min-w-0 flex-1 border-l border-line pl-4">
        {showDay && <p className="text-xs font-bold uppercase tracking-wide text-gold">{massDayLabel(m)}</p>}
        {m.title && <p className="font-semibold text-ink">{m.title}</p>}
        <p className="flex items-center gap-1.5 truncate text-sm text-ink-2">
          <MapPin size={13} className="shrink-0 text-muted" /> {m.location}
        </p>
        {m.description && <p className="mt-0.5 text-xs text-muted">{m.description}</p>}
        <div className="mt-1.5 flex gap-1.5">
          <Badge tone={m.type === 'Festiva' ? 'primary' : m.type === 'Prefestiva' ? 'gold' : 'neutral'}>{m.type}</Badge>
          {m.parish && m.parish !== 'Unità Pastorale' && <ParishBadge parish={m.parish} />}
        </div>
      </div>
    </Card>
  );
}
