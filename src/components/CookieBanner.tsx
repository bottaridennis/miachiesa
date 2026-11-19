import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Cookie, X } from 'lucide-react';
import { readConsent, saveConsent, useConsent, useConsentPanelRequests } from '../lib/consent';
import { routes } from '../lib/router';
import { Button } from './ui/Button';
import { Toggle } from './ui/Field';

/**
 * Banner cookie conforme alle Linee guida del Garante (10 giugno 2021):
 * - "Rifiuta" e "Accetta" con la stessa evidenza
 * - chiudere con la X equivale a rifiutare (restano solo gli strumenti necessari)
 * - nessuna casella preselezionata; scelta riapribile dal footer
 * - il banner non blocca la navigazione (niente "cookie wall")
 */
export function CookieBanner() {
  const consent = useConsent();
  const [forcedOpen, setForcedOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [stats, setStats] = useState(() => readConsent()?.statistics ?? false);

  const open = forcedOpen || !consent;
  const panelRef = useRef<HTMLElement>(null);
  // Aprendo i dettagli il pannello torna in cima (su schermi piccoli scorre internamente)
  useEffect(() => {
    if (details) panelRef.current?.scrollTo({ top: 0 });
  }, [details]);

  useConsentPanelRequests(
    useCallback(() => {
      setStats(readConsent()?.statistics ?? false);
      setDetails(true);
      setForcedOpen(true);
    }, []),
  );

  const decide = (statistics: boolean) => {
    saveConsent(statistics);
    setForcedOpen(false);
    setDetails(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[80] mx-auto max-h-[calc(100dvh-6.5rem-env(safe-area-inset-bottom))] max-w-xl overflow-y-auto overscroll-contain rounded-3xl border border-line bg-surface p-5 shadow-float md:bottom-6 md:left-auto md:right-6 md:mx-0 md:max-h-[calc(100dvh-3rem)]"
        >
          <button onClick={() => decide(false)} className="absolute right-3 top-3 rounded-xl p-2 text-muted hover:bg-surface-2" aria-label="Chiudi e rifiuta i cookie non necessari">
            <X size={18} />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <span className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold sm:flex">
              <Cookie size={20} />
            </span>
            <div>
              <h2 id="cookie-title" className="font-sans text-base font-semibold text-ink">
                Rispettiamo la tua privacy
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">
                Usiamo solo strumenti tecnici necessari al funzionamento del sito. Con il tuo consenso contiamo anche le visite in modo anonimo, per sapere quante persone usano il sito. Niente pubblicità né profilazione.{' '}
                <a href={`#${routes.cookies}`} className="font-semibold text-primary underline-offset-2 hover:underline">
                  Cookie policy
                </a>
              </p>
            </div>
          </div>

          {details && (
            <div className="mt-4 space-y-3 rounded-2xl bg-surface-2/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-semibold text-ink">Necessari</span>
                  <span className="block text-sm text-muted">Accesso all'account, sicurezza, preferenze che scegli tu (tema, parrocchia).</span>
                </span>
                <span className="mt-0.5 shrink-0 text-xs font-semibold uppercase text-success">Sempre attivi</span>
              </div>
              <div className="border-t border-line pt-3">
                <Toggle checked={stats} onChange={setStats} label="Statistiche anonime" description="Un identificativo casuale per contare i visitatori unici. Nessun dato personale, nessuna condivisione con terzi." />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            {details ? (
              <Button className="sm:flex-1" onClick={() => decide(stats)}>
                Salva le mie scelte
              </Button>
            ) : (
              <button onClick={() => setDetails(true)} className="order-last rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-soft sm:order-first sm:mr-auto">
                Personalizza
              </button>
            )}
            {/* Stessa evidenza grafica per "Rifiuta" e "Accetta" */}
            <Button variant="outline" className="sm:flex-1" onClick={() => decide(false)}>
              Rifiuta
            </Button>
            <Button variant="outline" className="sm:flex-1" onClick={() => decide(true)}>
              Accetta
            </Button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
