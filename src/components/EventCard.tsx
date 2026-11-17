import { CalendarPlus, Clock, MapPin } from 'lucide-react';
import type { ParishEvent } from '../types';
import { Card } from './ui/Card';
import { ParishBadge } from './ui/Badge';
import { daysUntil, parseISODate } from '../lib/format';
import { downloadEventICS } from '../lib/ics';
import { cn } from '../lib/cn';

export function DateTile({ date, className }: { date: string; className?: string }) {
  const d = parseISODate(date);
  return (
    <div className={cn('flex w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary-soft py-2.5 text-primary', className)}>
      <span className="text-[11px] font-bold uppercase tracking-wider">{d ? d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '') : '—'}</span>
      <span className="font-serif text-2xl font-semibold leading-none">{d ? d.getDate() : '?'}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase opacity-75">{d ? d.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '') : ''}</span>
    </div>
  );
}

export function EventCard({ event, compact }: { event: ParishEvent; compact?: boolean }) {
  const days = daysUntil(event.date);
  const soon = days === 0 ? 'Oggi' : days === 1 ? 'Domani' : null;
  return (
    <Card className="flex items-stretch gap-4 p-4">
      <DateTile date={event.date} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {soon && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-gold">{soon}</span>}
          {event.group && <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted">{event.group}</span>}
        </div>
        <h3 className="font-sans text-base font-semibold leading-snug text-ink">{event.title}</h3>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Clock size={14} /> {event.time}
            {event.endTime ? ` – ${event.endTime}` : ''}
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin size={14} className="shrink-0" /> <span className="truncate">{event.location}</span>
          </span>
        </div>
        {!compact && event.description && <p className="mt-2 line-clamp-3 text-sm text-ink-2">{event.description}</p>}
        {!compact && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <ParishBadge parish={event.parish} />
            <button onClick={() => downloadEventICS(event)} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-soft">
              <CalendarPlus size={14} /> Aggiungi al calendario
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
