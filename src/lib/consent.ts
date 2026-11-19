import { useEffect, useState } from 'react';
import { CONSENT_MAX_AGE_MS } from './legal';

/**
 * Preferenze sui cookie e strumenti simili.
 * - "necessari": sempre attivi (accesso, sicurezza, preferenze scelte dall'utente come il tema)
 * - "statistiche": conteggio anonimo dei visitatori, solo con consenso
 * Il sito non usa cookie di profilazione né di terze parti.
 */
export interface ConsentState {
  statistics: boolean;
  date: number;
  version: 1;
}

const KEY = 'miachiesa_consent';
const EVENT = 'miachiesa:consent';
const OPEN_EVENT = 'miachiesa:consent-open';

export function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as ConsentState;
    if (c.version !== 1 || Date.now() - c.date > CONSENT_MAX_AGE_MS) return null;
    return c;
  } catch {
    return null;
  }
}

export function saveConsent(statistics: boolean) {
  const c: ConsentState = { statistics, date: Date.now(), version: 1 };
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
    // Revoca: eliminiamo subito l'identificativo statistico
    if (!statistics) localStorage.removeItem('visitor_id');
  } catch {
    /* storage non disponibile: la scelta vale solo per questa visita */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: c }));
}

/** Riapre il pannello delle preferenze (link "Preferenze cookie" nel footer) */
export function openConsentPanel() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function useConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(readConsent);
  useEffect(() => {
    const onChange = (e: Event) => setConsent((e as CustomEvent<ConsentState>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return consent;
}

export function useConsentPanelRequests(onOpen: () => void) {
  useEffect(() => {
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [onOpen]);
}
