// Popola l'emulatore Firestore con dati di esempio (NON tocca il database di produzione).
// Uso: npm run emulators   (in un terminale)   poi   npm run seed:emulator
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';

const iso = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const env = await initializeTestEnvironment({ projectId: 'demo-miachiesa', firestore: { host: '127.0.0.1', port: 8080 } });
await env.clearFirestore();
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  const now = Date.now();
  await setDoc(doc(db, 'site_config/main'), {
    phone: '045 713 0000', email: 'segreteria@parrocchia.example', address: 'Piazza della Chiesa 1, Oppeano (VR)',
    welcomeMessage: 'Una comunità in cammino, insieme.',
    officeHours: [{ label: 'Lun – Mer', hours: '09:30 – 12:00' }, { label: 'Giovedì', hours: '16:00 – 18:30' }, { label: 'Ven – Sab', hours: 'Chiuso' }],
    donations: [
      { id: 'a', title: 'Parrocchia di Oppeano', iban: 'IT60X0542811101000000123456', holder: 'Parrocchia S. Giovanni Battista', reason: 'Erogazione liberale Parrocchia Oppeano', description: 'Attività pastorali e cura della chiesa.' },
      { id: 'b', title: "Parrocchia di Ca' degli Oppi", iban: 'IT02L1234512345123456789012', holder: "Parrocchia di Ca' degli Oppi", reason: "Erogazione liberale Parrocchia Ca' degli Oppi", description: 'Iniziative della comunità e cura delle strutture.' },
    ],
  });
  const g1 = await addDoc(collection(db, 'groups'), { name: 'Gruppo Giovani', parish: 'Oppeano', description: 'Ragazzi dai 14 ai 19 anni.', meetingInfo: 'Ogni venerdì alle 21:00', leaders: [{ name: 'Marco B.', role: 'Animatore' }] });
  await addDoc(collection(db, 'groups'), { name: 'Caritas', parish: 'Unità Pastorale', description: 'Servizio ai più bisognosi.' });
  await addDoc(collection(db, 'groups'), { name: 'Coro parrocchiale', parish: "Ca' degli Oppi" });
  await addDoc(collection(db, 'notices'), { title: 'Festa patronale: il programma completo', content: 'Carissimi parrocchiani,\ncon gioia vi annunciamo il programma della festa patronale. Saranno giorni di preghiera e condivisione fraterna.\n\nSabato: S. Messa solenne alle 18:30, a seguire cena comunitaria.', category: 'Notizia', parish: 'Unità Pastorale', groupId: 'admin', authorId: 'seed', authorName: 'Don Mario', timestamp: now - 3600e3, pinned: true, images: [], imageUrl: '' });
  await addDoc(collection(db, 'notices'), { title: 'Ritiro spirituale per i giovani', content: 'Il gruppo giovani organizza un ritiro di due giorni in montagna. Iscrizioni aperte in segreteria.', category: 'Avviso', parish: 'Oppeano', groupId: g1.id, authorId: 'seed', timestamp: now - 86400e3 * 2, images: [] });
  await addDoc(collection(db, 'notices'), { title: 'Sospensione Messa feriale di giovedì', content: 'Giovedì la Messa delle 18:00 a Ca\' degli Oppi è sospesa.', category: 'Urgente', parish: "Ca' degli Oppi", groupId: 'admin', authorId: 'seed', timestamp: now - 86400e3 * 4, images: [] });
  await addDoc(collection(db, 'notices'), { title: 'Il Vangelo della domenica: un pensiero', content: 'Nel Vangelo di questa domenica il Signore ci invita a non temere…', category: 'Riflessione', parish: 'Unità Pastorale', groupId: 'admin', authorId: 'seed', timestamp: now - 86400e3 * 6, images: [] });
  const masses = [
    { time: '08:30', day: 'weekdays', type: 'Feriale', location: 'Chiesa parrocchiale di Oppeano', parish: 'Oppeano' },
    { time: '18:00', day: 'weekdays', type: 'Feriale', location: "Chiesa parrocchiale di Ca' degli Oppi", parish: "Ca' degli Oppi" },
    { time: '18:30', day: 6, type: 'Prefestiva', location: 'Chiesa parrocchiale di Oppeano', parish: 'Oppeano' },
    { time: '09:00', day: 0, type: 'Festiva', location: "Chiesa parrocchiale di Ca' degli Oppi", parish: "Ca' degli Oppi" },
    { time: '10:30', day: 0, type: 'Festiva', location: 'Chiesa parrocchiale di Oppeano', parish: 'Oppeano', title: 'Messa dei fanciulli' },
    { time: '20:30', date: iso(10), day: 'date', type: 'Festiva', location: 'Santuario della Madonna del Carmine', parish: 'Oppeano', title: 'Veglia dell\'Immacolata' },
  ];
  for (const m of masses) await addDoc(collection(db, 'mass_times'), m);
  await addDoc(collection(db, 'events'), { title: 'Incontro gruppo famiglie', date: iso(2), time: '21:00', location: 'Salone parrocchiale Oppeano', group: 'Pastorale familiare', parish: 'Oppeano', description: 'Serata di confronto per coppie e famiglie.', timestamp: now });
  await addDoc(collection(db, 'events'), { title: 'Adorazione eucaristica', date: iso(0), time: '19:00', location: "Cappella di Ca' degli Oppi", parish: "Ca' degli Oppi", timestamp: now });
  await addDoc(collection(db, 'events'), { title: 'Serata giovani', date: iso(5), time: '21:00', location: 'Oratorio', groupId: g1.id, group: 'Gruppo Giovani', parish: 'Oppeano', timestamp: now });
  await addDoc(collection(db, 'events'), { title: 'Raccolta alimentare Caritas', date: iso(25), time: '09:00', endTime: '13:00', location: 'Piazzale della chiesa', parish: 'Unità Pastorale', timestamp: now });
  await addDoc(collection(db, 'liturgy'), {
    day: iso(0), date: 'Martedì della XXXIII settimana del Tempo Ordinario', liturgicalColor: 'green', timestamp: now,
    firstReading: { reference: '2 Mac 6,18-31', text: 'In quei giorni, un tale Eleàzaro, uno degli scribi più stimati, uomo già avanti negli anni e molto dignitoso nell’aspetto della persona…' },
    psalm: { reference: 'Sal 3', text: 'R. Il Signore mi sostiene.\nSignore, quanti sono i miei avversari! Molti contro di me insorgono.' },
    gospel: { reference: 'Lc 19,1-10', text: 'In quel tempo, Gesù entrò nella città di Gèrico e la stava attraversando, quand’ecco un uomo, di nome Zacchèo, capo dei pubblicani e ricco, cercava di vedere chi era Gesù…' },
    comment: 'Oggi la salvezza è entrata in questa casa: anche noi, come Zaccheo, siamo cercati dal Signore.',
  });
  await addDoc(collection(db, 'forms'), { title: 'Campo scuola estivo', description: 'Una settimana in montagna per i ragazzi delle medie.', deadline: iso(2), timestamp: now, parish: 'Unità Pastorale', fields: [
    { label: 'Nome e cognome', type: 'text', required: true }, { label: 'Data di nascita', type: 'date', required: true }, { label: 'Taglia maglietta', type: 'select', required: true, options: ['S', 'M', 'L', 'XL'] }, { label: 'Email', type: 'email', required: true }, { label: 'Acconsento al trattamento dei dati personali', type: 'checkbox', required: true },
  ] });
  await addDoc(collection(db, 'forms'), { title: 'Catechismo 2026/27', description: 'Iscrizioni al percorso di iniziazione cristiana.', deadline: iso(30), timestamp: now - 1, fields: [{ label: 'Nome e cognome', type: 'text', required: true }] });
  await addDoc(collection(db, 'community_members'), { name: 'Don Mario Rossi', role: 'Parroco', parish: 'Unità Pastorale', order: 0 });
  await addDoc(collection(db, 'community_members'), { name: 'Don Luca Bianchi', role: 'Vicario parrocchiale', parish: 'Unità Pastorale', order: 1 });
  await addDoc(collection(db, 'community_members'), { name: 'Suor Anna', role: 'Catechesi', parish: 'Oppeano', order: 2 });
});
await env.cleanup();
console.log('✓ Dati di esempio caricati nell’emulatore');
