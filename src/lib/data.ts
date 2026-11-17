import { collection, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { useCol } from './useCol';
import { toISODate } from './format';
import type { Group, Liturgy, MassTime, Notice, ParishEvent } from '../types';

export function useNotices(max = 30) {
  return useCol<Notice>(query(collection(db, 'notices'), orderBy('timestamp', 'desc'), limit(max)));
}

export function useMassTimes() {
  const r = useCol<MassTime>(collection(db, 'mass_times'));
  const data = [...r.data].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  return { ...r, data };
}

/** Eventi da oggi in poi (prima venivano mostrati anche quelli passati) */
export function useUpcomingEvents(max = 50) {
  return useCol<ParishEvent>(query(collection(db, 'events'), where('date', '>=', toISODate()), orderBy('date', 'asc'), limit(max)));
}

export function useGroups() {
  const r = useCol<Group>(collection(db, 'groups'));
  return { ...r, data: [...r.data].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it')) };
}

export function useLiturgy(max = 30) {
  const r = useCol<Liturgy>(query(collection(db, 'liturgy'), orderBy('timestamp', 'desc'), limit(max)));
  const today = toISODate();
  // Ordina per giorno liturgico (se presente) e sceglie le letture di oggi, altrimenti le più recenti passate
  const sorted = [...r.data].sort((a, b) => (b.day || '').localeCompare(a.day || '') || b.timestamp - a.timestamp);
  const current = sorted.find((l) => l.day === today) ?? sorted.find((l) => !l.day || l.day <= today) ?? sorted[0] ?? null;
  return { ...r, data: sorted, current };
}
