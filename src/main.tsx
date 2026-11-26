import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initTheme } from './lib/theme';
// Font ospitati sul sito stesso: nessuna richiesta a Google Fonts (e nessun IP inviato a terzi)
import '@fontsource-variable/manrope';
import '@fontsource-variable/fraunces/opsz.css';
import './index.css';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
