import type { MassTime } from '../types';

export const WEEKDAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
export const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

/** YYYY-MM-DD nel fuso orario locale (evita lo slittamento UTC di toISOString) */
export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Interpreta YYYY-MM-DD come data locale (new Date('2026-06-01') sarebbe UTC) */
export function parseISODate(s?: string): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(s: string | number | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (s === undefined || s === '') return '';
  const d = typeof s === 'number' ? new Date(s) : parseISODate(s);
  if (!d) return String(s);
  return d.toLocaleDateString('it-IT', opts);
}

export function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
}

export function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'adesso';
  if (min < 60) return `${min} min fa`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ${h === 1 ? 'ora' : 'ore'} fa`;
  const d = Math.round(h / 24);
  if (d === 1) return 'ieri';
  if (d < 7) return `${d} giorni fa`;
  return formatDate(ts, { day: 'numeric', month: 'short', year: d > 300 ? 'numeric' : undefined });
}

export function isDeadlinePassed(deadline: string) {
  const d = parseISODate(deadline);
  if (!d) return false;
  d.setHours(23, 59, 59, 999);
  return d.getTime() < Date.now();
}

export function daysUntil(dateStr: string) {
  const d = parseISODate(dateStr);
  if (!d) return Infinity;
  const today = parseISODate(toISODate())!;
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function massDayLabel(m: MassTime): string {
  if (m.date) return formatDate(m.date, { weekday: 'long', day: 'numeric', month: 'long' });
  if (m.day === 'weekdays') return 'Lunedì – Venerdì';
  if (typeof m.day === 'number') return WEEKDAYS[m.day];
  // compatibilità con dati vecchi
  if (m.type === 'Festiva') return 'Domenica';
  if (m.type === 'Prefestiva') return 'Sabato';
  return 'Feriale';
}

/** Restituisce true se la messa si celebra nella data indicata */
export function massOccursOn(m: MassTime, date: Date): boolean {
  if (m.date) return m.date === toISODate(date);
  const wd = date.getDay();
  if (m.day === 'weekdays') return wd >= 1 && wd <= 5;
  if (typeof m.day === 'number') return m.day === wd;
  if (m.type === 'Festiva') return wd === 0;
  if (m.type === 'Prefestiva') return wd === 6;
  if (m.type === 'Feriale') return wd >= 1 && wd <= 5;
  return false;
}

/** Trova la prossima celebrazione nei prossimi 8 giorni */
export function nextMass(masses: MassTime[], now = new Date()) {
  for (let offset = 0; offset < 8; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const candidates = masses
      .filter((m) => massOccursOn(m, day) && /^\d{1,2}:\d{2}$/.test(m.time))
      .map((m) => {
        const [h, min] = m.time.split(':').map(Number);
        const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, min);
        return { mass: m, at };
      })
      .filter((c) => c.at.getTime() > now.getTime() - 30 * 60000) // include quella iniziata da <30 min
      .sort((a, b) => a.at.getTime() - b.at.getTime());
    if (candidates.length) return candidates[0];
  }
  return null;
}

export function nextMassLabel(at: Date, now = new Date()) {
  const today = toISODate(now);
  const tomorrow = toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const time = at.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const iso = toISODate(at);
  if (at.getTime() <= now.getTime()) return `In corso · ${time}`;
  if (iso === today) return `Oggi · ${time}`;
  if (iso === tomorrow) return `Domani · ${time}`;
  return `${WEEKDAYS[at.getDay()]} · ${time}`;
}

export function initials(name?: string | null) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function isSafeUrl(url?: string) {
  if (!url) return false;
  return /^https?:\/\//i.test(url) || url.startsWith('data:image/');
}
