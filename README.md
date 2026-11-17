# Mia Chiesa · Unità Pastorale Oppeano e Ca' degli Oppi

Web app della comunità parrocchiale: avvisi, letture del giorno, orari delle Messe, calendario eventi, gruppi, iscrizioni online, richieste alla segreteria e donazioni. Ha anche un'area riservata per gestire tutti i contenuti.

**Stack:** React 19 · Vite 6 · Tailwind CSS 4 · Firebase (Auth Google + Firestore) · Motion.

## Funzionalità

| Sezione | Cosa offre |
| --- | --- |
| **Home** | Prossima S. Messa calcolata in tempo reale, avvisi filtrabili per parrocchia (fissati e urgenti in cima), Vangelo del giorno, prossimi eventi |
| **Liturgia** | Letture divise in schede (prima lettura, salmo, seconda lettura, Vangelo) e archivio dei giorni precedenti; orari delle Messe giorno per giorno, filtrabili per parrocchia, con le celebrazioni straordinarie |
| **Comunità** | "Chi siamo", calendario eventi raggruppato per mese con il pulsante *Aggiungi al calendario* (.ics), pagina di ogni gruppo |
| **Iscrizioni** | Moduli con campi personalizzati (testo, data, scelta, casella…), scadenza, segnalazione "già iscritto" |
| **Segreteria** | Modulo di richiesta con contatti e orari configurabili |
| **Donazioni** | IBAN e causali configurabili, con copia in un tocco |
| **Area personale** | Preferiti, le mie iscrizioni, profilo, tema chiaro/scuro e richiesta di abilitazione a pubblicare per un gruppo |
| **Amministrazione** | Avvisi (con immagini e avvisi fissati), eventi, letture, orari delle Messe, moduli con esportazione CSV per Excel, abilitazioni, "Chi siamo", tipi di richiesta, richieste alla segreteria con stato, impostazioni del sito, utenti e amministratori, export della newsletter, statistiche |

Inoltre:
- ricerca globale (`Ctrl/⌘ K`);
- modalità scura;
- navigazione con URL condivisibili (`#/liturgia`, `#/avvisi/<id>`…);
- installabile sul telefono come app (PWA);
- cache offline.

## Configurazione

La configurazione Firebase **non è nel repository**. Viene letta, in questo ordine, da:

1. la variabile d'ambiente `FIREBASE_APPLET_CONFIG`, che contiene il JSON del file di configurazione (è il metodo usato in GitHub Actions);
2. il file locale `firebase-applet-config.json` nella root del progetto, già ignorato da git (è il metodo usato in AI Studio e in sviluppo).

### Secret di GitHub

In **Settings → Secrets and variables → Actions** crea il secret `FIREBASE_APPLET_CONFIG` e incollaci l'intero contenuto di `firebase-applet-config.json`. Non servono altri secret.

> La `apiKey` Firebase per il web non è un vero segreto, perché finisce comunque nel codice scaricato dal browser. La protezione reale sono le **regole Firestore** (`firestore.rules`). In aggiunta, conviene limitare la chiave ai propri domini dalla Console Google Cloud (API e servizi → Credenziali).

## Sviluppo

```bash
npm install
npm run dev            # usa il database reale (serve firebase-applet-config.json)
```

### Con l'emulatore (consigliato: non tocca i dati reali)

Serve Java 11 o superiore.

```bash
npm run emulators      # terminale 1: emulatori Firestore + Auth
npm run seed:emulator  # terminale 2: carica i dati di esempio
npm run dev:emulator   # terminale 2: avvia l'app collegata all'emulatore
```

### Controlli

```bash
npm run lint           # controllo dei tipi TypeScript
npm run build          # build di produzione in dist/
npm run test:rules     # 24 test automatici sulle regole di sicurezza (emulatore)
```

## Deploy

Il sito è pubblicato su **GitHub Pages** (https://bottaridennis.github.io/miachiesa/). Il workflow `.github/workflows/deploy.yml` lo ricompila e lo pubblica ad ogni push su `main`; `ci.yml` esegue type-check, build e test delle regole su ogni pull request.

Configurazione da fare una sola volta:
1. **Settings → Pages → Build and deployment → Source:** scegli *GitHub Actions*.
2. **Console Firebase → Authentication → Settings → Authorized domains:** aggiungi `bottaridennis.github.io`. Senza questo passo l'accesso con Google fallisce (`auth/unauthorized-domain`).

Le **regole Firestore** non fanno parte del deploy automatico: dopo averle modificate, pubblicale a mano con

```bash
npx firebase login
npx firebase deploy --only firestore:rules
```

Il file `firebase.json` punta solo al database `ai-studio-miachiesa-…`, quindi gli altri database del progetto non vengono toccati.

## Struttura

```
src/
  App.tsx              layout: sidebar, tab bar mobile, router
  nav.ts               voci di navigazione
  views/               pagine pubbliche e area personale
  admin/               sezioni di gestione (area riservata)
  components/          componenti di dominio (NoticeCard, EventCard, ricerca…)
  components/ui/       design system: Button, Card, Field, Modal, Toast, Badge…
  lib/                 firebase, sessione, router, hook dati, formattazione date
firestore.rules        regole di sicurezza
tests/                 test delle regole
scripts/               seed dell'emulatore
```

## Amministratori

Il super amministratore è l'account il cui indirizzo email è indicato in `firestore.rules` (funzione `isSuperAdmin`) e in `VITE_SUPER_ADMIN_EMAIL`, oppure, se quella variabile manca, nel default dentro `src/lib/firebase.ts`. Dalla sezione **Utenti** può nominare altri amministratori.

Gli animatori dei gruppi possono chiedere di essere abilitati a pubblicare avvisi per il proprio gruppo; le richieste si approvano dalla sezione **Abilitazioni**.
