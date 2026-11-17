import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';

/**
 * La configurazione Firebase arriva (in ordine di priorità) da:
 *  1. variabile d'ambiente FIREBASE_APPLET_CONFIG (JSON) — usata in GitHub Actions tramite secret
 *  2. file locale firebase-applet-config.json (non versionato) — usato in AI Studio / sviluppo
 */
function loadFirebaseConfig(env: Record<string, string>) {
  const raw = process.env.FIREBASE_APPLET_CONFIG || env.FIREBASE_APPLET_CONFIG;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error('FIREBASE_APPLET_CONFIG non contiene un JSON valido.');
    }
  }
  const file = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  console.warn('\n⚠️  Configurazione Firebase mancante: imposta FIREBASE_APPLET_CONFIG o crea firebase-applet-config.json\n');
  return null;
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const firebaseConfig = loadFirebaseConfig(env);
  // Una build di produzione senza configurazione genererebbe un sito vuoto: meglio fallire subito
  if (command === 'build' && !firebaseConfig) {
    throw new Error('Build interrotta: imposta il secret FIREBASE_APPLET_CONFIG (vedi README).');
  }
  return {
    plugins: [react(), tailwindcss()],
    define: {
      __FIREBASE_CONFIG__: JSON.stringify(firebaseConfig),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            react: ['react', 'react-dom'],
            motion: ['motion/react'],
          },
        },
      },
    },
    server: {
      // HMR è disabilitato in AI Studio tramite DISABLE_HMR.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
