import { BookOpen, ClipboardList, HandHeart, Home, MessageSquareText, Users, type LucideIcon } from 'lucide-react';
import { routes } from './lib/router';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: routes.home, label: 'Home', icon: Home, description: 'Avvisi e novità' },
  { path: routes.liturgy, label: 'Liturgia', icon: BookOpen, description: 'Letture e orari delle Messe' },
  { path: routes.community, label: 'Comunità', icon: Users, description: 'Eventi e gruppi' },
  { path: routes.registrations, label: 'Iscrizioni', icon: ClipboardList, description: 'Moduli online' },
  { path: routes.services, label: 'Segreteria', icon: MessageSquareText, description: 'Certificati e richieste' },
  { path: routes.donations, label: 'Donazioni', icon: HandHeart, description: 'Sostieni la parrocchia' },
];

/** Le prime 4 voci vanno nella tab bar mobile, il resto nel menu "Altro" */
export const MOBILE_TABS = NAV_ITEMS.slice(0, 4);
export const MOBILE_MORE = NAV_ITEMS.slice(4);

export function isActive(current: string, path: string) {
  if (path === '/') return current === '/' || current.startsWith('/avvisi');
  return current === path || current.startsWith(path + '/');
}
