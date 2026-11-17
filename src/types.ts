export type ViewMode = 'home' | 'liturgy' | 'community' | 'services' | 'donations';

export type Parish = 'Oppeano' | 'Ca\' degli Oppi';

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  content: string;
  imageUrl?: string;
  category: 'Avviso' | 'Notizia' | 'Riflessione';
  parish?: Parish | 'Unità Pastorale';
}

export interface MassTime {
  id: string;
  day: string;
  time: string;
  type: 'Feriale' | 'Festiva' | 'Vigilia';
  location: string;
  parish: Parish;
}

export interface ParishEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  group: string;
  parish: Parish | 'Unità Pastorale';
}

export interface DailyReading {
  date: string;
  liturgicalColor: 'green' | 'red' | 'white' | 'purple' | 'rose';
  firstReading: { reference: string; text: string };
  psalm: { reference: string; text: string };
  secondReading?: { reference: string; text: string };
  gospel: { reference: string; text: string };
}
