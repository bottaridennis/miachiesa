import { useEffect, useState } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';

function read(): ThemePref {
  try {
    return (localStorage.getItem('theme') as ThemePref) || 'system';
  } catch {
    return 'system';
  }
}

function apply(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function initTheme() {
  apply(read());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => apply(read()));
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(read);
  useEffect(() => {
    apply(pref);
    try {
      localStorage.setItem('theme', pref);
    } catch {
      /* ignore */
    }
  }, [pref]);
  return [pref, setPref] as const;
}
