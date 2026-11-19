import type { ServiceOption, SiteConfig } from '../types';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  phone: '',
  email: '',
  address: "Oppeano (VR) · Ca' degli Oppi (VR)",
  officeHours: [
    { label: 'Lun – Mer', hours: '09:30 – 12:00' },
    { label: 'Giovedì', hours: '16:00 – 18:30' },
    { label: 'Ven – Sab', hours: 'Chiuso' },
  ],
  donations: [],
  welcomeMessage: 'Una comunità in cammino, insieme.',
};

export const DEFAULT_SERVICE_OPTIONS: Omit<ServiceOption, 'id' | 'timestamp'>[] = [
  { value: 'certificato_battesimo', label: 'Certificato di Battesimo' },
  { value: 'certificato_cresima', label: 'Certificato di Cresima' },
  { value: 'certificato_matrimonio', label: 'Certificato di Matrimonio' },
  { value: 'colloquio_parroco', label: 'Colloquio con il Parroco' },
  { value: 'benedizione_famiglia', label: 'Benedizione della famiglia' },
  { value: 'intenzione_messa', label: 'Intenzione per una S. Messa' },
  { value: 'altro', label: 'Altro / Informazioni' },
];

