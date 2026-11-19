import type { PrivacyConfig, SiteConfig } from '../types';

/**
 * Versione dell'informativa: va aumentata quando il testo cambia in modo sostanziale.
 * Viene salvata insieme a ogni consenso, così si sa quale testo l'utente aveva letto.
 */
export const PRIVACY_VERSION = '2026-11-19';

/** Le preferenze cookie vengono richieste di nuovo dopo 6 mesi (Linee guida Garante, 10/06/2021) */
export const CONSENT_MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000;

export const DEFAULT_PRIVACY: PrivacyConfig = {
  controllerName: "Parrocchie dell'Unità Pastorale di Oppeano e Ca' degli Oppi",
  controllerAddress: '',
  controllerEmail: '',
  controllerTaxCode: '',
  dpoContact: '',
};

export function privacyOf(config: SiteConfig): PrivacyConfig {
  return { ...DEFAULT_PRIVACY, ...(config.privacy ?? {}) };
}

/** true se mancano i dati minimi del titolare (da completare nell'area riservata) */
export function privacyIncomplete(p: PrivacyConfig) {
  return !p.controllerAddress?.trim() || !p.controllerEmail?.trim();
}
