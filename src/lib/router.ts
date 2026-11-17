import { useEffect, useState } from 'react';

/**
 * Router minimale basato sull'hash (#/percorso): funziona su qualsiasi hosting statico,
 * mantiene la pagina al refresh e supporta il tasto "indietro" del browser/telefono.
 */
function currentPath() {
  const h = window.location.hash.replace(/^#/, '');
  return h.startsWith('/') ? h : '/';
}

export function navigate(path: string) {
  if (currentPath() === path) return;
  window.location.hash = path;
}

export function useRoute() {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => {
      setPath(currentPath());
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { path, segments };
}

export const routes = {
  home: '/',
  liturgy: '/liturgia',
  community: '/comunita',
  group: (id: string) => `/comunita/gruppo/${encodeURIComponent(id)}`,
  services: '/segreteria',
  registrations: '/iscrizioni',
  registration: (id: string) => `/iscrizioni/${encodeURIComponent(id)}`,
  donations: '/donazioni',
  notice: (id: string) => `/avvisi/${encodeURIComponent(id)}`,
  account: '/area',
  accountSection: (s: string) => `/area/${s}`,
};
