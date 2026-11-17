export type Parish = 'Oppeano' | "Ca' degli Oppi";
export type ParishScope = Parish | 'Unità Pastorale';

export const PARISHES: ParishScope[] = ['Unità Pastorale', 'Oppeano', "Ca' degli Oppi"];

export type NoticeCategory = 'Avviso' | 'Notizia' | 'Riflessione' | 'Urgente';
export const NOTICE_CATEGORIES: NoticeCategory[] = ['Avviso', 'Notizia', 'Riflessione', 'Urgente'];

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  parish: ParishScope;
  groupId: string;
  authorId: string;
  authorName?: string;
  date?: string; // legacy (stringa formattata)
  timestamp: number;
  imageUrl?: string;
  images?: string[];
  attachmentUrl?: string;
  pinned?: boolean;
}

export type MassType = 'Feriale' | 'Prefestiva' | 'Festiva';

/** day: 0=Dom … 6=Sab, 'weekdays' = Lun-Ven, 'date' = solo nella data indicata */
export type MassDay = number | 'weekdays' | 'date';

export interface MassTime {
  id: string;
  time: string; // HH:mm
  day?: MassDay;
  date?: string; // YYYY-MM-DD per celebrazioni straordinarie
  title?: string;
  description?: string;
  location: string;
  parish?: ParishScope;
  type: MassType;
  order?: number;
}

export interface ParishEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  endTime?: string;
  location: string;
  description?: string;
  group?: string;
  groupId?: string;
  parish: ParishScope;
  timestamp: number;
}

export interface Reading {
  reference: string;
  text: string;
}

export type LiturgicalColor = 'green' | 'red' | 'white' | 'purple' | 'rose';

export interface Liturgy {
  id: string;
  day?: string; // YYYY-MM-DD
  date: string; // titolo (es. "I Domenica di Avvento")
  liturgicalColor: LiturgicalColor;
  firstReading: Reading;
  psalm: Reading;
  secondReading?: Reading;
  gospel: Reading;
  comment?: string;
  timestamp: number;
}

export type FieldType = 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea' | 'select' | 'checkbox';

export interface FormField {
  id?: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export interface RegistrationForm {
  id: string;
  title: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  fields: FormField[];
  maxParticipants?: number;
  parish?: ParishScope;
  timestamp: number;
}

export interface FormSubmission {
  id: string;
  formId: string;
  userId: string;
  userEmail: string;
  data: Record<string, string | boolean>;
  timestamp: number;
}

export interface Group {
  id: string;
  name: string;
  parish: ParishScope;
  description?: string;
  contact?: string;
  meetingInfo?: string;
  leaders?: { name: string; imageUrl?: string; role?: string }[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  isVerified: boolean;
  timestamp?: number;
}

export interface CommunityMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  parish?: ParishScope;
  order?: number;
  timestamp?: number;
}

export type MessageStatus = 'nuova' | 'in_lavorazione' | 'completata';

export interface ServiceMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  status?: MessageStatus;
  timestamp: number;
}

export interface ServiceOption {
  id: string;
  label: string;
  value: string;
  description?: string;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  photoUrl?: string;
  isAdmin?: boolean;
  lastLogin?: string;
}

export interface UserSettings {
  emailNotifications: boolean;
  preferredParish: ParishScope;
  phone?: string;
  updatedAt?: number;
}

export interface OfficeHour {
  label: string;
  hours: string;
}

export interface DonationAccount {
  id: string;
  title: string;
  iban: string;
  holder?: string;
  reason: string;
  description: string;
}

export interface SiteConfig {
  phone: string;
  email: string;
  address: string;
  officeHours: OfficeHour[];
  donations: DonationAccount[];
  heroImageUrl?: string;
  welcomeMessage?: string;
}
