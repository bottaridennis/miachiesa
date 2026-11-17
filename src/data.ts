import { NewsItem, MassTime, ParishEvent, DailyReading } from './types';

export const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Festa Patronale 2026: Il Programma Completo',
    date: '24 Giu 2026',
    category: 'Notizia',
    parish: 'Unità Pastorale',
    content: 'Carissimi parrocchiani, con grande gioia vi annunciamo il programma della nostra festa patronale. Saranno giorni di grazia, preghiera e condivisione fraterna.',
    imageUrl: 'https://images.unsplash.com/photo-1548625361-ecbcc44d2d6f?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    title: 'Ritiro Spirituale per i Giovani',
    date: '20 Giu 2026',
    category: 'Avviso',
    parish: 'Oppeano',
    content: 'Il gruppo giovani organizza un ritiro spirituale di due giorni in montagna. Le iscrizioni sono aperte fino al prossimo fine settimana in segreteria.',
    imageUrl: 'https://images.unsplash.com/photo-1519818458925-502a51fcaee3?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '3',
    title: 'Il Vangelo della Domenica: Un pensiero del Parroco',
    date: '18 Giu 2026',
    category: 'Riflessione',
    parish: 'Ca\' degli Oppi',
    content: 'Nel Vangelo di questa domenica il Signore ci invita a non temere. La tempesta sedata è l\'immagine della nostra vita affidata alle Sue mani...'
  }
];

export const mockMassTimes: MassTime[] = [
  { id: '1', day: 'Lunedì - Venerdì', time: '08:30', type: 'Feriale', location: 'Chiesa San Giovanni Battista', parish: 'Oppeano' },
  { id: '2', day: 'Lunedì - Venerdì', time: '18:00', type: 'Feriale', location: 'Chiesa Girolamo e Vitale', parish: 'Ca\' degli Oppi' },
  { id: '3', day: 'Sabato', time: '18:30', type: 'Vigilia', location: 'Chiesa San Giovanni Battista', parish: 'Oppeano' },
  { id: '4', day: 'Domenica', time: '09:00', type: 'Festiva', location: 'Chiesa Girolamo e Vitale', parish: 'Ca\' degli Oppi' },
  { id: '5', day: 'Domenica', time: '10:30', type: 'Festiva', location: 'Chiesa San Giovanni Battista (Messa dei fanciulli)', parish: 'Oppeano' },
  { id: '6', day: 'Domenica', time: '18:30', type: 'Festiva', location: 'Chiesa San Giovanni Battista', parish: 'Oppeano' },
];

export const mockEvents: ParishEvent[] = [
  { id: '1', title: 'Incontro Gruppo Famiglie', date: 'Venerdì 26 Giu', time: '21:00', location: 'Salone Parrocchiale Oppeano', group: 'Pastorale Familiare', parish: 'Oppeano' },
  { id: '2', title: 'Adorazione Eucaristica', date: 'Giovedì 25 Giu', time: '19:00', location: 'Cappella Ca\' degli Oppi', group: 'Tutta la comunità', parish: 'Ca\' degli Oppi' },
  { id: '3', title: 'Riunione Catechisti', date: 'Lunedì 29 Giu', time: '18:45', location: 'Aule Catechismo', group: 'Iniziazione Cristiana', parish: 'Unità Pastorale' },
  { id: '4', title: 'Caritas: Raccolta Alimentare', date: 'Sabato 04 Lug', time: '09:00 - 13:00', location: 'Piazzale Chiesa Oppeano', group: 'Caritas', parish: 'Oppeano' }
];

export const mockReading: DailyReading = {
  date: '26 Giugno 2026',
  liturgicalColor: 'green',
  firstReading: {
    reference: 'Genesi 17, 1.9-10.15-22',
    text: 'In quei giorni, quando Abram ebbe novantanove anni, il Signore gli apparve e gli disse: "Io sono Dio onnipotente: cammina davanti a me e sii integro..."'
  },
  psalm: {
    reference: 'Sal 127',
    text: 'R.: Sarà benedetto chi teme il Signore.\nBeato chi teme il Signore e cammina nelle sue vie. Della fatica delle tue mani ti nutrirai, sarai felice e avrai ogni bene. R.'
  },
  gospel: {
    reference: 'Matteo 8, 1-4',
    text: 'In quel tempo, quando Gesù scese dal monte, molta folla lo seguì. Ed ecco, si avvicinò un lebbroso, si prostrò davanti a lui e disse: "Signore, se vuoi, puoi purificarmi". Ed egli stese la mano e lo toccò dicendo: "Lo voglio, sii purificato!". E subito la sua lebbra fu guarita.'
  }
};
