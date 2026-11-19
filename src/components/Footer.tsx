import { useSiteConfig } from '../lib/siteConfig';
import { openConsentPanel } from '../lib/consent';
import { privacyOf } from '../lib/legal';
import { routes } from '../lib/router';

export function Footer() {
  const { config } = useSiteConfig();
  const p = privacyOf(config);
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 text-xs text-muted sm:px-6 md:pb-8">
      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {p.controllerName}
          {p.controllerTaxCode && <> · C.F. {p.controllerTaxCode}</>}
        </p>
        <nav aria-label="Informazioni legali" className="flex flex-wrap gap-x-4 gap-y-1 font-semibold">
          <a href={`#${routes.privacy}`} className="hover:text-ink">
            Privacy
          </a>
          <a href={`#${routes.cookies}`} className="hover:text-ink">
            Cookie policy
          </a>
          <button onClick={openConsentPanel} className="font-semibold hover:text-ink">
            Preferenze cookie
          </button>
          {p.controllerEmail && (
            <a href={`mailto:${p.controllerEmail}`} className="hover:text-ink">
              Contatti
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}

/** Nota sotto i pulsanti di accesso: chi accede prende visione dell'informativa */
export function LoginPrivacyNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-snug text-muted ${className}`}>
      Accedendo dichiari di avere almeno 14 anni e di aver letto l'
      <a href={`#${routes.privacy}`} className="font-semibold text-primary hover:underline">
        informativa privacy
      </a>
      .
    </p>
  );
}
