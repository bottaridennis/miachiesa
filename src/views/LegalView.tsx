import type { ReactNode } from 'react';
import { Cookie, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useSiteConfig } from '../lib/siteConfig';
import { useSession } from '../lib/session';
import { openConsentPanel } from '../lib/consent';
import { privacyIncomplete, privacyOf, PRIVACY_VERSION } from '../lib/legal';
import { formatDate } from '../lib/format';
import { routes } from '../lib/router';
import { Page, PageHeader } from '../components/ui/Page';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Feedback';

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-7 first:border-t-0 first:pt-0">
      <h2 className="mb-3 flex items-baseline gap-3 text-xl font-semibold">
        <span className="font-sans text-sm font-bold text-gold">{String(n).padStart(2, '0')}</span>
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-ink-2 [&_a]:font-semibold [&_a]:text-primary [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
            {head.map((h) => (
              <th key={h} className="px-2 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line align-top">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={`px-2 py-2.5 ${j === 0 ? 'font-semibold text-ink' : ''}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Missing = () => <em className="text-warning">[da completare]</em>;

function useController() {
  const { config } = useSiteConfig();
  const { isAdmin } = useSession();
  const p = privacyOf(config);
  const warning =
    isAdmin && privacyIncomplete(p) ? (
      <div className="mb-6">
        <Notice tone="warning" icon={<TriangleAlert size={18} />}>
          Mancano alcuni dati del titolare del trattamento (indirizzo o email). Completali in{' '}
          <a href={`#${routes.accountSection('sito')}`} className="underline">
            Area riservata → Impostazioni sito → Privacy
          </a>
          . Questo avviso è visibile solo agli amministratori.
        </Notice>
      </div>
    ) : null;
  return { p, warning };
}

const updated = formatDate(PRIVACY_VERSION, { day: 'numeric', month: 'long', year: 'numeric' });

export function PrivacyView() {
  const { p, warning } = useController();
  const contact = p.controllerEmail ? <a href={`mailto:${p.controllerEmail}`}>{p.controllerEmail}</a> : <Missing />;

  return (
    <Page>
      <PageHeader eyebrow="Privacy" title="Informativa sul trattamento dei dati personali" description={`Ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 ("GDPR"). Ultimo aggiornamento: ${updated}.`} icon={<ShieldCheck size={26} />} />
      {warning}
      <Card className="p-6 sm:p-10">
        <Section n={1} title="Titolare del trattamento">
          <p>
            <strong>{p.controllerName}</strong>
            <br />
            {p.controllerAddress || <Missing />}
            {p.controllerTaxCode && (
              <>
                <br />
                C.F. {p.controllerTaxCode}
              </>
            )}
            <br />
            Email: {contact}
          </p>
          {p.dpoContact && (
            <p>
              Referente per la protezione dei dati: <strong>{p.dpoContact}</strong>
            </p>
          )}
          <p>
            Il trattamento avviene nel rispetto del GDPR, del D.Lgs. 196/2003 ("Codice privacy") e, in quanto ente ecclesiastico, del Decreto generale della CEI "Disposizioni per la tutela del diritto alla buona fama e alla riservatezza" del 24 maggio 2018 (art. 91 GDPR).
          </p>
        </Section>

        <Section n={2} title="Quali dati trattiamo, perché e su quale base">
          <Table
            head={['Attività', 'Dati', 'Finalità', 'Base giuridica']}
            rows={[
              ['Navigazione', 'Dati tecnici di connessione (indirizzo IP, tipo di browser) registrati dal fornitore di hosting', 'Erogare il sito e garantirne la sicurezza', 'Legittimo interesse (art. 6.1.f)'],
              ['Accesso con Google', 'Nome, email, foto del profilo Google, data dell’ultimo accesso', 'Area personale: preferiti, iscrizioni, preferenze', 'Servizio richiesto dall’utente (art. 6.1.b)'],
              ['Richieste alla segreteria', 'Nome, email, telefono (facoltativo), testo della richiesta', 'Rispondere alla richiesta (certificati, colloqui, informazioni)', 'Richiesta dell’interessato (art. 6.1.b); per i dati che rivelano convinzioni religiose, art. 9.2.d'],
              ['Iscrizioni alle attività', 'Dati richiesti dal modulo, anche relativi a minori e forniti da chi ne esercita la responsabilità genitoriale', 'Organizzare l’attività (catechesi, campi, grest…)', 'Richiesta dell’interessato (art. 6.1.b) e attività di ente religioso verso i partecipanti (art. 9.2.d)'],
              ['Foto e video durante le attività', 'Immagini dei partecipanti', 'Documentare e comunicare la vita della comunità', 'Consenso facoltativo e revocabile (art. 6.1.a)'],
              ['Newsletter', 'Nome, email, parrocchia di riferimento', 'Inviare le comunicazioni della parrocchia', 'Consenso facoltativo e revocabile (art. 6.1.a)'],
              ['Pubblicazione di avvisi', 'Nome dell’autore', 'Indicare chi ha pubblicato l’avviso per conto di un gruppo', 'Richiesta dell’animatore (art. 6.1.b)'],
              ['Statistiche', 'Identificativo casuale, data della prima visita', 'Contare i visitatori unici', 'Consenso (art. 6.1.a, art. 122 Codice privacy)'],
            ]}
          />
          <p>
            I dati non sono usati per profilazione, pubblicità o decisioni automatizzate. I dati che possono rivelare convinzioni religiose non sono comunicati all’esterno senza il consenso dell’interessato.
          </p>
        </Section>

        <Section n={3} title="Obbligatorietà del conferimento">
          <p>
            I campi contrassegnati da asterisco sono necessari per gestire la richiesta o l’iscrizione: senza di essi non potremo darvi seguito. I consensi a newsletter, foto/video e statistiche sono facoltativi e il loro rifiuto non ha conseguenze sull’uso del sito.
          </p>
        </Section>

        <Section n={4} title="Chi può accedere ai dati">
          <ul>
            <li>Il parroco, la segreteria e gli amministratori del sito, autorizzati e istruiti al trattamento;</li>
            <li>
              <strong>Google Ireland Ltd / Google LLC</strong> (servizi Firebase: autenticazione e database), nominata responsabile del trattamento;
            </li>
            <li>
              <strong>GitHub, Inc.</strong> (pubblicazione del sito web), che tratta i dati tecnici di navigazione.
            </li>
          </ul>
          <p>
            Gli avvisi, gli eventi e le informazioni nella sezione “Chi siamo” sono pubblici per loro natura. Gli altri dati non sono diffusi.
          </p>
        </Section>

        <Section n={5} title="Trasferimenti fuori dall’Unione europea">
          <p>
            Il database è ospitato a Londra (Regno Unito), Paese che beneficia di una decisione di adeguatezza della Commissione europea. Google LLC e GitHub, Inc. aderiscono all’EU-U.S. Data Privacy Framework (decisione di adeguatezza del 10 luglio 2023); i trasferimenti sono inoltre coperti dalle clausole contrattuali standard.
          </p>
        </Section>

        <Section n={6} title="Per quanto tempo conserviamo i dati">
          <ul>
            <li>
              <strong>Account e preferenze:</strong> fino alla cancellazione dell’account, che puoi fare in autonomia dall’area personale;
            </li>
            <li>
              <strong>Richieste alla segreteria:</strong> il tempo necessario a evaderle e comunque non oltre 24 mesi;
            </li>
            <li>
              <strong>Iscrizioni:</strong> per la durata dell’attività e non oltre 24 mesi dalla sua conclusione, salvo obblighi di legge;
            </li>
            <li>
              <strong>Newsletter, foto/video e statistiche:</strong> fino alla revoca del consenso.
            </li>
          </ul>
        </Section>

        <Section n={7} title="Minori">
          <p>
            L’accesso con account Google è riservato a chi ha almeno 14 anni (art. 2-quinquies Codice privacy). Le iscrizioni di minori alle attività sono effettuate da chi esercita la responsabilità genitoriale, che lo dichiara nel modulo.
          </p>
        </Section>

        <Section n={8} title="I tuoi diritti">
          <p>In ogni momento puoi chiedere al titolare:</p>
          <ul>
            <li>l’accesso ai tuoi dati e una copia degli stessi (artt. 15 e 20);</li>
            <li>la rettifica o la cancellazione (artt. 16 e 17);</li>
            <li>la limitazione del trattamento o l’opposizione (artt. 18 e 21);</li>
            <li>la revoca dei consensi dati, senza pregiudizio per i trattamenti già effettuati (art. 7.3).</li>
          </ul>
          <p>
            Dall’<a href={`#${routes.accountSection('profilo')}`}>area personale</a> puoi scaricare i tuoi dati ed eliminare l’account in autonomia. Per tutto il resto scrivi a {contact}. Hai inoltre diritto di proporre reclamo al{' '}
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
              Garante per la protezione dei dati personali
            </a>
            .
          </p>
        </Section>

        <Section n={9} title="Cookie e strumenti analoghi">
          <p>
            Le informazioni sui cookie e sugli strumenti di memorizzazione usati dal sito sono nella <a href={`#${routes.cookies}`}>cookie policy</a>.
          </p>
        </Section>
      </Card>
    </Page>
  );
}

export function CookieView() {
  const { p, warning } = useController();
  return (
    <Page>
      <PageHeader eyebrow="Privacy" title="Cookie policy" description={`Quali informazioni il sito memorizza sul tuo dispositivo e perché. Ultimo aggiornamento: ${updated}.`} icon={<Cookie size={26} />} action={<Button variant="secondary" onClick={openConsentPanel}>Modifica le tue preferenze</Button>} />
      {warning}
      <Card className="p-6 sm:p-10">
        <Section n={1} title="In breve">
          <p>
            Il sito <strong>non usa cookie di profilazione né cookie pubblicitari</strong> e non incorpora contenuti di terze parti che ti tracciano: i caratteri tipografici e le immagini sono ospitati sul sito stesso. Usiamo solo strumenti tecnici necessari e, se acconsenti, un contatore anonimo delle visite.
          </p>
          <p>
            Tecnicamente il sito non usa “cookie” veri e propri, ma strumenti analoghi del browser (localStorage e IndexedDB), ai quali si applicano le stesse regole (art. 122 Codice privacy; Linee guida del Garante del 10 giugno 2021).
          </p>
        </Section>
        <Section n={2} title="Cosa memorizziamo">
          <Table
            head={['Nome', 'Tipo', 'Scopo', 'Durata']}
            rows={[
              ['miachiesa_consent', 'Necessario', 'Ricorda le tue scelte su questo banner', '6 mesi, poi te lo richiediamo'],
              ['firebase:authUser…', 'Necessario', 'Mantiene l’accesso all’area personale (solo se accedi)', 'Fino all’uscita dall’account'],
              ['firestore… (IndexedDB)', 'Necessario', 'Copia locale dei contenuti pubblici, per caricare più in fretta e funzionare offline', 'Finché non svuoti i dati del sito'],
              ['theme, home_filter', 'Necessario (funzionale)', 'Ricorda il tema chiaro/scuro e il filtro parrocchia che hai scelto', 'Finché non svuoti i dati del sito'],
              ['visitor_id', 'Statistico', 'Identificativo casuale per contare i visitatori unici; non contiene dati personali', 'Fino alla revoca del consenso'],
            ]}
          />
          <p>Gli strumenti necessari non richiedono consenso. Quello statistico è attivo solo se lo accetti, e revocando il consenso viene cancellato subito.</p>
        </Section>
        <Section n={3} title="Accesso con Google">
          <p>
            Se scegli di accedere, si apre una finestra di Google: in quella pagina Google usa i propri cookie secondo la sua{' '}
            <a href="https://policies.google.com/privacy?hl=it" target="_blank" rel="noopener noreferrer">
              informativa privacy
            </a>
            . Se non accedi, il sito non contatta i servizi di autenticazione di Google.
          </p>
        </Section>
        <Section n={4} title="Come gestire le preferenze">
          <p>
            Puoi cambiare idea in qualsiasi momento con il pulsante “Modifica le tue preferenze” o con il link “Preferenze cookie” in fondo a ogni pagina. Puoi anche cancellare i dati del sito dalle impostazioni del browser.
          </p>
          <Button variant="outline" onClick={openConsentPanel}>
            Preferenze cookie
          </Button>
        </Section>
        <Section n={5} title="Titolare">
          <p>
            {p.controllerName} — per informazioni: {p.controllerEmail ? <a href={`mailto:${p.controllerEmail}`}>{p.controllerEmail}</a> : <Missing />}. Maggiori dettagli nell’<a href={`#${routes.privacy}`}>informativa privacy</a>.
          </p>
        </Section>
      </Card>
    </Page>
  );
}
