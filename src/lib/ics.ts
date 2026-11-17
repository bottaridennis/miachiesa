import type { ParishEvent } from '../types';
import { parseISODate } from './format';

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const esc = (s = '') => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Genera e scarica un file .ics per aggiungere l'evento al calendario del telefono */
export function downloadEventICS(e: ParishEvent) {
  const day = parseISODate(e.date);
  if (!day) return;
  const [h, m] = (e.time || '00:00').split(':').map((x) => parseInt(x, 10) || 0);
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
  let end = new Date(start.getTime() + 90 * 60000);
  if (e.endTime && /^\d{1,2}:\d{2}$/.test(e.endTime)) {
    const [eh, em] = e.endTime.split(':').map(Number);
    end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), eh, em);
  }
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mia Chiesa//IT',
    'BEGIN:VEVENT',
    `UID:${e.id}@miachiesa`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc(e.location)}`,
    `DESCRIPTION:${esc([e.description, e.group].filter(Boolean).join(' — '))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${e.title.replace(/[^\w\- ]+/g, '').trim() || 'evento'}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
