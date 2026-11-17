import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, orderBy, setDoc } from 'firebase/firestore';
import { Users, AlertCircle, CheckCircle, Plus, Trash2, Shield, Calendar as CalendarIcon, BookOpen, ClipboardList, Bell, UserRound, Clock, Download, Bookmark, Settings as SettingsIcon, FileText, Search, BarChart } from 'lucide-react';
import { Parish } from '../types';

export default function AdminView() {
  const [user] = useAuthState(auth);
  const [userDoc] = useDocument(user ? doc(db, 'users', user.uid) : null);
  const [activeTab, setActiveTab] = useState<any>('hub');
  const isSuperAdmin = user?.email === 'dennisbottari@gmail.com';
  const isAdmin = isSuperAdmin || userDoc?.data()?.isAdmin === true;

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <p className="text-church-600">Devi accedere per vedere questa pagina.</p>
      </div>
    );
  }

  const sections = [
    { id: 'favorites', label: 'Preferiti', icon: <Bookmark size={24} />, requiresAdmin: false },
    { id: 'settings', label: 'Impostazioni', icon: <SettingsIcon size={24} />, requiresAdmin: false },
    { id: 'notices', label: 'Avvisi', icon: <AlertCircle size={24} />, requiresAdmin: false },
    { id: 'groups', label: 'Gruppi', icon: <Users size={24} />, requiresAdmin: false },
    { id: 'events', label: 'Eventi', icon: <CalendarIcon size={24} />, requiresAdmin: true },
    { id: 'liturgy', label: 'Liturgia', icon: <BookOpen size={24} />, requiresAdmin: true },
    { id: 'masses', label: 'Orari Messe', icon: <Clock size={24} />, requiresAdmin: true },
    { id: 'forms', label: 'Moduli', icon: <ClipboardList size={24} />, requiresAdmin: true },
    { id: 'community', label: 'Comunità', icon: <UserRound size={24} />, requiresAdmin: true },
    { id: 'members', label: 'Richieste', icon: <CheckCircle size={24} />, requiresAdmin: true },
    { id: 'notifications', label: 'Notifiche', icon: <Bell size={24} />, requiresAdmin: true },
    { id: 'service_options', label: 'Opzioni Servizi', icon: <FileText size={24} />, requiresAdmin: true },
    { id: 'users', label: 'Gestione Utenti', icon: <Shield size={24} />, requiresAdmin: true, requiresSuperAdmin: true },
    { id: 'stats', label: 'Statistiche', icon: <BarChart size={24} />, requiresAdmin: true, requiresSuperAdmin: true },
  ];

  const visibleSections = sections.filter(s => {
    if (s.requiresSuperAdmin && !isSuperAdmin) return false;
    if (s.requiresAdmin && !isAdmin) return false;
    return true;
  });

  return (
    <div className="pb-24 pt-8 px-4 max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-church-200 overflow-hidden">
        <div className="bg-church-900 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-serif font-bold text-yellow-400">{isAdmin ? 'Area Riservata' : 'Area Utente'}</h1>
            <p className="text-sm text-church-300">Gestione Avvisi e Gruppi Parrocchiali</p>
          </div>
          {isAdmin && (
            <span className="bg-yellow-500 text-church-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Shield size={14} /> Amministratore Principale
            </span>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'hub' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {visibleSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className="flex flex-col items-center justify-center p-3 sm:p-6 border-2 border-church-100 rounded-xl hover:border-church-600 hover:bg-church-50 transition-all text-church-700 hover:text-church-900 overflow-hidden"
                >
                  <div className="mb-2 sm:mb-3 text-church-600 shrink-0">{section.icon}</div>
                  <span className="font-bold text-xs sm:text-sm text-center truncate w-full px-1">{section.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button 
                onClick={() => setActiveTab('hub')}
                className="mb-6 flex items-center gap-2 text-sm font-bold text-church-500 hover:text-church-900"
              >
                &larr; Torna alla Hub
              </button>
              {activeTab === 'favorites' && <FavoritesManager user={user} />}
              {activeTab === 'settings' && <SettingsManager user={user} />}
              {activeTab === 'notices' && <NoticesManager user={user} isAdmin={isAdmin} />}
              {activeTab === 'groups' && <GroupsManager user={user} isAdmin={isAdmin} />}
              {activeTab === 'events' && isAdmin && <EventsManager />}
              {activeTab === 'liturgy' && isAdmin && <LiturgyManager />}
              {activeTab === 'masses' && isAdmin && <MassesManager />}
              {activeTab === 'forms' && isAdmin && <FormsManager />}
              {activeTab === 'community' && isAdmin && <CommunityManager />}
              {activeTab === 'members' && isAdmin && <MembersManager />}
              {activeTab === 'notifications' && isAdmin && <NotificationsManager />}
              {activeTab === 'service_options' && isAdmin && <ServiceOptionsManager />}
              {activeTab === 'users' && isSuperAdmin && <UsersManager />}
              {activeTab === 'stats' && isSuperAdmin && <StatsManager />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventsManager() {
  const [eventsSnapshot] = useCollection(query(collection(db, 'events'), orderBy('timestamp', 'asc')));
  const events = eventsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [group, setGroup] = useState('');
  const [parish, setParish] = useState('Unità Pastorale');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'events', editingId), {
          title,
          date,
          time,
          location,
          group,
          parish,
          timestamp: new Date(date).getTime()
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'events'), {
          title,
          date,
          time,
          location,
          group,
          parish,
          timestamp: new Date(date).getTime()
        });
      }
      setTitle(''); setDate(''); setTime(''); setLocation(''); setGroup(''); setParish('Unità Pastorale');
    } catch (error) {
      console.error(error);
      alert('Errore durante l\'aggiunta dell\'evento.');
    }
    setLoading(false);
  };

  const handleEdit = (event: any) => {
    setEditingId(event.id);
    setTitle(event.title);
    setDate(event.date);
    setTime(event.time);
    setLocation(event.location);
    setGroup(event.group || '');
    setParish(event.parish || 'Unità Pastorale');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'events', id));
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-church-200">
        <h3 className="text-lg font-bold text-church-900 mb-4 flex items-center gap-2">
          <Plus size={20} /> {editingId ? 'Modifica Evento' : 'Nuovo Evento'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Titolo Evento</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200" placeholder="Es. Incontro Giovani" />
            </div>
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Parrocchia</label>
              <select value={parish} onChange={e => setParish(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200">
                <option value="Unità Pastorale">Unità Pastorale</option>
                <option value="Oppeano">Oppeano</option>
                <option value="Ca' degli Oppi">Ca' degli Oppi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Data</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Orario</label>
              <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Luogo</label>
              <input required value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200" placeholder="Es. Oratorio Oppeano" />
            </div>
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Gruppo (opzionale)</label>
              <input value={group} onChange={e => setGroup(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200" placeholder="Es. Scout AGESCI" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-church-600 text-white font-bold py-2 rounded hover:bg-church-500 transition-colors disabled:opacity-50">
              {loading ? 'Salvataggio in corso...' : (editingId ? 'Aggiorna Evento' : 'Aggiungi Evento')}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setTitle(''); setDate(''); setTime(''); setLocation(''); setGroup(''); setParish('Unità Pastorale'); }}
                className="px-4 py-2 font-bold text-church-600 hover:bg-church-200 bg-church-100 rounded"
              >
                Annulla
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-church-900">Prossimi Eventi</h3>
        {events.map((event: any) => (
          <div key={event.id} className="bg-white p-4 rounded border border-church-200 flex justify-between items-center gap-4">
            <div>
              <p className="font-bold text-church-900">{event.title}</p>
              <p className="text-sm text-church-600">{new Date(event.date).toLocaleDateString('it-IT')} alle {event.time} - {event.location}</p>
              <p className="text-xs text-church-400 mt-1 uppercase tracking-wide">{event.parish}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => handleEdit(event)} className="text-church-500 hover:bg-church-50 p-2 rounded shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider underline">Modifica</span>
              </button>
              <button onClick={() => handleDelete(event.id)} className="text-red-500 hover:bg-red-50 p-2 rounded shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MassesManager() {
  const [massTimesSnapshot] = useCollection(query(collection(db, 'mass_times'), orderBy('order')));
  const massTimes = massTimesSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];

  const [massTime, setMassTime] = useState('');
  const [massDate, setMassDate] = useState('');
  const [massTitle, setMassTitle] = useState('');
  const [massDescription, setMassDescription] = useState('');
  const [massLocation, setMassLocation] = useState('Chiesa Parrocchiale di Oppeano');
  const [massType, setMassType] = useState('Festiva');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddMass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateDoc(doc(db, 'mass_times', editingId), {
        time: massTime,
        date: massDate,
        title: massTitle,
        description: massDescription,
        location: massLocation,
        type: massType
      });
      setEditingId(null);
    } else {
      await addDoc(collection(db, 'mass_times'), {
        time: massTime,
        date: massDate,
        title: massTitle,
        description: massDescription,
        location: massLocation,
        type: massType,
        order: massTimes.length
      });
    }
    setMassTime('');
    setMassDate('');
    setMassTitle('');
    setMassDescription('');
  };

  const handleEdit = (mass: any) => {
    setEditingId(mass.id);
    setMassTime(mass.time);
    setMassDate(mass.date || '');
    setMassTitle(mass.title || '');
    setMassDescription(mass.description || '');
    setMassLocation(mass.location);
    setMassType(mass.type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-church-900 border-b border-church-200 pb-2">
        {editingId ? 'Modifica Orario Messa' : 'Orari Messe'}
      </h3>
      <form onSubmit={handleAddMass} className="flex flex-col gap-3 bg-church-50 p-4 rounded border border-church-200">
        <div className="grid sm:grid-cols-2 gap-3">
          <input type="text" placeholder="Titolo (facoltativo)" value={massTitle} onChange={e => setMassTitle(e.target.value)} className="px-3 py-2 rounded border border-church-200" />
          <input type="date" value={massDate} onChange={e => setMassDate(e.target.value)} className="px-3 py-2 rounded border border-church-200" />
          <input required type="time" value={massTime} onChange={e => setMassTime(e.target.value)} className="px-3 py-2 rounded border border-church-200" />
          <select value={massLocation} onChange={e => setMassLocation(e.target.value)} className="px-3 py-2 rounded border border-church-200">
            <option value="Chiesa Parrocchiale di Oppeano">Chiesa Oppeano</option>
            <option value="Santuario del Carmine">Santuario Oppeano</option>
            <option value="Chiesa Parrocchiale di Ca' degli Oppi">Chiesa Ca' degli Oppi</option>
          </select>
          <select value={massType} onChange={e => setMassType(e.target.value)} className="px-3 py-2 rounded border border-church-200">
            <option value="Feriale">Feriale</option>
            <option value="Prefestiva">Prefestiva</option>
            <option value="Festiva">Festiva</option>
          </select>
          <input type="text" placeholder="Descrizione breve (facoltativa)" value={massDescription} onChange={e => setMassDescription(e.target.value)} className="px-3 py-2 rounded border border-church-200" />
        </div>
        <div className="flex gap-2 justify-end">
          {editingId && (
            <button 
              type="button" 
              onClick={() => { setEditingId(null); setMassTime(''); setMassDate(''); setMassTitle(''); setMassDescription(''); }}
              className="px-4 py-2 text-church-600 font-bold hover:bg-church-100 rounded"
            >
              Annulla
            </button>
          )}
          <button type="submit" className="bg-church-600 text-white font-bold px-4 py-2 rounded hover:bg-church-500">
            {editingId ? 'Aggiorna' : 'Aggiungi'}
          </button>
        </div>
      </form>
      <div className="grid sm:grid-cols-2 gap-2 mt-4">
        {massTimes.map((mass: any) => (
          <div key={mass.id} className="flex justify-between items-start bg-white p-3 rounded border border-church-200">
            <div>
              {mass.title && <p className="font-bold text-church-900 text-sm mb-1">{mass.title}</p>}
              <div className="flex items-center gap-2">
                <span className="font-bold text-church-900">{mass.time}</span>
                {mass.date && <span className="text-sm font-medium text-church-500">{new Date(mass.date).toLocaleDateString('it-IT')}</span>}
              </div>
              <span className="text-sm text-church-600 block">{mass.location}</span>
              {mass.description && <span className="text-xs text-church-500 block mt-1">{mass.description}</span>}
              <span className="text-[10px] uppercase text-church-400 block mt-1">{mass.type}</span>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => handleEdit(mass)} className="text-church-500 hover:bg-church-50 p-1.5 rounded text-xs underline font-bold tracking-wider uppercase">
                Modifica
              </button>
              <button onClick={() => deleteDoc(doc(db, 'mass_times', mass.id))} className="text-red-500 hover:bg-red-50 p-1.5 rounded flex justify-center">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiturgyManager() {
  const [liturgySnapshot] = useCollection(query(collection(db, 'liturgy'), orderBy('timestamp', 'desc')));
  const liturgy = liturgySnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];

  const [readingDate, setReadingDate] = useState('');
  const [liturgicalColor, setLiturgicalColor] = useState('green');
  const [firstRef, setFirstRef] = useState('');
  const [firstText, setFirstText] = useState('');
  const [psalmRef, setPsalmRef] = useState('');
  const [psalmText, setPsalmText] = useState('');
  const [gospelRef, setGospelRef] = useState('');
  const [gospelText, setGospelText] = useState('');
  const [loadingLiturgy, setLoadingLiturgy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLiturgy(true);
    if (editingId) {
      await updateDoc(doc(db, 'liturgy', editingId), {
        date: readingDate,
        liturgicalColor,
        firstReading: { reference: firstRef, text: firstText },
        psalm: { reference: psalmRef, text: psalmText },
        gospel: { reference: gospelRef, text: gospelText },
        timestamp: new Date().getTime()
      });
      setEditingId(null);
    } else {
      await addDoc(collection(db, 'liturgy'), {
        date: readingDate,
        liturgicalColor,
        firstReading: { reference: firstRef, text: firstText },
        psalm: { reference: psalmRef, text: psalmText },
        gospel: { reference: gospelRef, text: gospelText },
        timestamp: new Date().getTime()
      });
    }
    setReadingDate(''); setFirstRef(''); setFirstText(''); setPsalmRef(''); setPsalmText(''); setGospelRef(''); setGospelText('');
    setLoadingLiturgy(false);
  };

  const handleEdit = (l: any) => {
    setEditingId(l.id);
    setReadingDate(l.date || '');
    setLiturgicalColor(l.liturgicalColor || 'green');
    setFirstRef(l.firstReading?.reference || '');
    setFirstText(l.firstReading?.text || '');
    setPsalmRef(l.psalm?.reference || '');
    setPsalmText(l.psalm?.text || '');
    setGospelRef(l.gospel?.reference || '');
    setGospelText(l.gospel?.text || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-church-900 border-b border-church-200 pb-2">Letture del Giorno</h3>
      <form onSubmit={handleAddReading} className="bg-white p-6 rounded-lg shadow-sm border border-church-200 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Data (es. I DOMENICA DI AVVENTO)</label>
              <input required value={readingDate} onChange={e => setReadingDate(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Colore Liturgico</label>
              <select value={liturgicalColor} onChange={e => setLiturgicalColor(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200">
                <option value="green">Verde</option>
                <option value="red">Rosso</option>
                <option value="white">Bianco</option>
                <option value="purple">Viola</option>
                <option value="rose">Rosaceo</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-church-700 text-sm uppercase">Prima Lettura</h4>
            <input required value={firstRef} onChange={e => setFirstRef(e.target.value)} placeholder="Riferimento (es. Is 2,1-5)" className="w-full px-3 py-2 rounded border border-church-200" />
            <textarea required value={firstText} onChange={e => setFirstText(e.target.value)} placeholder="Testo della lettura" rows={3} className="w-full px-3 py-2 rounded border border-church-200 resize-none" />
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-church-700 text-sm uppercase">Salmo Responsoriale</h4>
            <input required value={psalmRef} onChange={e => setPsalmRef(e.target.value)} placeholder="Riferimento" className="w-full px-3 py-2 rounded border border-church-200" />
            <textarea required value={psalmText} onChange={e => setPsalmText(e.target.value)} placeholder="Testo del salmo" rows={2} className="w-full px-3 py-2 rounded border border-church-200 resize-none" />
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-church-700 text-sm uppercase">Vangelo</h4>
            <input required value={gospelRef} onChange={e => setGospelRef(e.target.value)} placeholder="Riferimento (es. Mt 24,37-44)" className="w-full px-3 py-2 rounded border border-church-200" />
            <textarea required value={gospelText} onChange={e => setGospelText(e.target.value)} placeholder="Testo del vangelo" rows={4} className="w-full px-3 py-2 rounded border border-church-200 resize-none" />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={loadingLiturgy} className="flex-1 bg-church-600 text-white font-bold py-2 rounded hover:bg-church-500 transition-colors disabled:opacity-50">
              {loadingLiturgy ? 'Salvataggio...' : (editingId ? 'Aggiorna Letture' : 'Salva Letture')}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setReadingDate(''); setFirstRef(''); setFirstText(''); setPsalmRef(''); setPsalmText(''); setGospelRef(''); setGospelText(''); }}
                className="px-4 py-2 font-bold text-church-600 hover:bg-church-200 bg-church-100 rounded"
              >
                Annulla
              </button>
            )}
          </div>
        </form>

        <div className="mt-4">
          <h4 className="font-bold text-church-900 text-sm uppercase mb-2">Letture Salvate (mostrata la più recente)</h4>
          {liturgy.slice(0, 3).map((l: any) => (
            <div key={l.id} className="bg-white p-3 rounded border border-church-200 mb-2 flex justify-between items-center">
              <div>
                <p className="font-bold text-church-900">{l.date}</p>
                <p className="text-xs text-church-500">Inserito il: {new Date(l.timestamp).toLocaleDateString('it-IT')}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleEdit(l)} className="text-church-500 hover:bg-church-50 p-2 rounded shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider underline">Modifica</span>
                </button>
                <button onClick={() => deleteDoc(doc(db, 'liturgy', l.id))} className="text-red-500 hover:bg-red-50 p-2 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}

function FormsManager() {
  const [formsSnapshot] = useCollection(query(collection(db, 'forms'), orderBy('timestamp', 'desc')));
  const forms = formsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];

  const [submissionsSnapshot] = useCollection(query(collection(db, 'form_submissions'), orderBy('timestamp', 'desc')));
  const submissions = submissionsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [fieldsText, setFieldsText] = useState('Nome e Cognome, Data di Nascita, Telefono, Email');
  const [loading, setLoading] = useState(false);
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const parsedFields = fieldsText.split(',').map(f => ({
        label: f.trim(),
        type: f.trim().toLowerCase() === 'email' ? 'email' : f.trim().toLowerCase().includes('data') ? 'date' : 'text',
        required: true
      }));

      if (editingId) {
        await updateDoc(doc(db, 'forms', editingId), {
          title,
          description,
          deadline,
          fields: parsedFields
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'forms'), {
          title,
          description,
          deadline,
          fields: parsedFields,
          timestamp: new Date().getTime()
        });
      }
      setTitle(''); setDescription(''); setDeadline(''); setFieldsText('Nome e Cognome, Data di Nascita, Telefono, Email');
    } catch (error) {
      console.error(error);
      alert('Errore durante il salvataggio del modulo.');
    }
    setLoading(false);
  };

  const handleEdit = (form: any) => {
    setEditingId(form.id);
    setTitle(form.title);
    setDescription(form.description);
    setDeadline(form.deadline);
    setFieldsText(form.fields.map((f: any) => f.label).join(', '));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'forms', id));
  };

  const exportToCSV = (form: any, formSubmissions: any[]) => {
    if (formSubmissions.length === 0) return;
    
    const headers = new Set<string>();
    formSubmissions.forEach(sub => {
      if (sub.data) Object.keys(sub.data).forEach(key => headers.add(key));
    });
    const headerArray = Array.from(headers);
    
    let csvContent = "Data Invio," + headerArray.join(",") + "\n";
    
    formSubmissions.forEach(sub => {
      const row = [new Date(sub.timestamp).toLocaleString('it-IT').replace(/,/g, '')];
      headerArray.forEach(header => {
        let value = sub.data?.[header] || '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        row.push(value);
      });
      csvContent += row.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `iscrizioni_${form.title.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-church-200">
        <h3 className="text-lg font-bold text-church-900 mb-4 flex items-center gap-2">
          <Plus size={20} /> {editingId ? 'Modifica Modulo' : 'Nuovo Modulo Iscrizione'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Titolo Modulo</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200" placeholder="Es. Grest Estivo" />
            </div>
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Scadenza</label>
              <input required type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-church-500 uppercase mb-1">Descrizione</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 rounded border border-church-200 resize-none" placeholder="Descrizione dell'attività..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-church-500 uppercase mb-1">Campi Richiesti (separati da virgola)</label>
            <input required value={fieldsText} onChange={e => setFieldsText(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200" />
            <p className="text-xs text-church-400 mt-1">Esempio: Nome, Cognome, Telefono, Allergie</p>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-church-600 text-white font-bold py-2 rounded hover:bg-church-500 transition-colors disabled:opacity-50">
              {loading ? 'Salvataggio...' : (editingId ? 'Aggiorna Modulo' : 'Crea Modulo')}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setTitle(''); setDescription(''); setDeadline(''); setFieldsText('Nome e Cognome, Data di Nascita, Telefono, Email'); }}
                className="px-4 py-2 font-bold text-church-600 hover:bg-church-200 bg-church-100 rounded"
              >
                Annulla
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-church-900">Moduli Attivi e Iscrizioni</h3>
        {forms.map((form: any) => {
          const formSubmissions = submissions.filter((s: any) => s.formId === form.id);
          const isExpanded = expandedFormId === form.id;
          
          return (
            <div key={form.id} className="bg-white p-4 rounded border border-church-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="font-bold text-church-900">{form.title}</p>
                  <p className="text-xs text-church-500">Scadenza: {new Date(form.deadline).toLocaleDateString('it-IT')} &middot; {formSubmissions.length} iscrizioni</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => setExpandedFormId(isExpanded ? null : form.id)} 
                    className="text-xs font-bold bg-church-100 text-church-700 px-3 py-1.5 rounded hover:bg-church-200"
                  >
                    {isExpanded ? 'Nascondi Iscrizioni' : 'Vedi Iscrizioni'}
                  </button>
                  {formSubmissions.length > 0 && (
                    <button 
                      onClick={() => exportToCSV(form, formSubmissions)}
                      className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200 flex items-center gap-1"
                    >
                      <Download size={14} /> CSV
                    </button>
                  )}
                  <button onClick={() => handleEdit(form)} className="text-church-500 hover:bg-church-50 p-1.5 rounded">
                    <span className="text-xs font-bold uppercase tracking-wider underline">Modifica</span>
                  </button>
                  <button onClick={() => handleDelete(form.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-church-100 overflow-x-auto">
                  {formSubmissions.length > 0 ? (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-church-50 text-church-700">
                          <th className="p-2 font-bold rounded-l">Data Invio</th>
                          {form.fields.map((f: any, i: number) => (
                            <th key={i} className={`p-2 font-bold ${i === form.fields.length - 1 ? 'rounded-r' : ''}`}>{f.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {formSubmissions.map((sub: any) => (
                          <tr key={sub.id} className="border-b border-church-50 last:border-0 hover:bg-church-50/50">
                            <td className="p-2 text-church-500 text-xs">
                              {new Date(sub.timestamp).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            {form.fields.map((f: any, i: number) => (
                              <td key={i} className="p-2 text-church-900">
                                {sub.data?.[f.label] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-church-500">Nessuna iscrizione ricevuta.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CommunityManager() {
  const [membersSnapshot] = useCollection(query(collection(db, 'community_members')));
  const members = membersSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [parish, setParish] = useState('Unità Pastorale');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let finalPhotoUrl = photoUrl;

    if (photoFile) {
      finalPhotoUrl = await resizeImage(photoFile);
    }

    if (editingId) {
      await updateDoc(doc(db, 'community_members', editingId), {
        name, role, photoUrl: finalPhotoUrl, parish
      });
      setEditingId(null);
    } else {
      await addDoc(collection(db, 'community_members'), {
        name, role, photoUrl: finalPhotoUrl, parish, timestamp: new Date().getTime()
      });
    }
    
    setName(''); setRole(''); setPhotoUrl(''); setPhotoFile(null); setParish('Unità Pastorale');
    setLoading(false);
  };

  const handleEdit = (member: any) => {
    setEditingId(member.id);
    setName(member.name);
    setRole(member.role);
    setPhotoUrl(member.photoUrl || '');
    setPhotoFile(null);
    setParish(member.parish || 'Unità Pastorale');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-church-200">
        <h3 className="text-lg font-bold text-church-900 mb-4 flex items-center gap-2">
          <UserRound size={20} /> {editingId ? 'Modifica Membro' : 'Aggiungi Membro Comunità'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Nome e Cognome</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200" placeholder="Don Mario..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Ruolo</label>
              <input required value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200" placeholder="Parroco..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Foto (Carica o URL)</label>
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setPhotoFile(e.target.files[0]);
                      setPhotoUrl('');
                    }
                  }} 
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-church-50 file:text-church-700 hover:file:bg-church-100"
                />
                <input value={photoUrl} onChange={e => { setPhotoUrl(e.target.value); setPhotoFile(null); }} className="w-full px-3 py-2 rounded border border-church-200 text-sm" placeholder="O inserisci URL (opzionale)" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Parrocchia</label>
              <select value={parish} onChange={e => setParish(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200">
                <option value="Unità Pastorale">Unità Pastorale</option>
                <option value="Oppeano">Oppeano</option>
                <option value="Ca' degli Oppi">Ca' degli Oppi</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-church-600 text-white font-bold py-2 rounded hover:bg-church-500 transition-colors disabled:opacity-50">
              {loading ? 'Salvataggio in corso...' : (editingId ? 'Aggiorna' : 'Aggiungi')}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setName(''); setRole(''); setPhotoUrl(''); setPhotoFile(null); setParish('Unità Pastorale'); }}
                className="px-4 bg-church-100 text-church-600 font-bold py-2 rounded hover:bg-church-200"
              >
                Annulla
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-4">
        {members.map((member: any) => (
          <div key={member.id} className="flex items-center justify-between bg-white p-4 rounded border border-church-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-church-100 overflow-hidden flex items-center justify-center shrink-0">
                {member.photoUrl ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" /> : <UserRound size={20} className="text-church-400" />}
              </div>
              <div>
                <p className="font-bold text-church-900 leading-tight">{member.name}</p>
                <p className="text-xs text-church-500">{member.role} • {member.parish}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => handleEdit(member)} className="text-church-500 hover:bg-church-50 p-2 rounded shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider underline">Modifica</span>
              </button>
              <button onClick={() => deleteDoc(doc(db, 'community_members', member.id))} className="text-red-500 hover:bg-red-50 p-2 rounded shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceOptionsManager() {
  const [optionsSnapshot] = useCollection(query(collection(db, 'service_options'), orderBy('timestamp', 'asc')));
  const options = optionsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'service_options'), {
        label: label.trim(),
        value: value.trim() || label.trim().toLowerCase().replace(/\s+/g, '_'),
        timestamp: new Date().getTime()
      });
      setLabel('');
      setValue('');
    } catch (error) {
      console.error(error);
      alert('Errore durante il salvataggio.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-church-900">Opzioni Servizi Segreteria</h3>
      
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm border border-church-200 flex gap-2">
        <input 
          required
          type="text" 
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Es. Certificato di Battesimo"
          className="flex-1 px-3 py-2 border border-church-200 rounded"
        />
        <button disabled={loading} type="submit" className="bg-church-600 text-white font-bold px-4 py-2 rounded">
          <Plus size={20} />
        </button>
      </form>

      <div className="space-y-2">
        {options.map((opt: any) => (
          <div key={opt.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-church-100">
            <span className="font-medium text-church-800">{opt.label}</span>
            <button 
              onClick={() => deleteDoc(doc(db, 'service_options', opt.id))}
              className="text-red-500 hover:bg-red-50 p-2 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {options.length === 0 && (
          <p className="text-church-500 text-sm">Nessuna opzione personalizzata. Verranno mostrate quelle di default.</p>
        )}
      </div>
    </div>
  );
}

function NotificationsManager() {
  const [messagesSnapshot] = useCollection(query(collection(db, 'messages'), orderBy('timestamp', 'desc')));
  const messages = messagesSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'messages', id));
  };

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-church-900">Messaggi dai Servizi</h3>
      <div className="space-y-4">
        {messages.map((msg: any) => (
          <div key={msg.id} className="bg-white p-4 rounded border border-church-200">
            <div className="flex justify-between items-start gap-4 mb-2">
              <div>
                <span className="text-[10px] font-bold bg-church-100 text-church-600 px-2 py-0.5 rounded uppercase">{msg.service}</span>
                <p className="font-bold text-church-900 mt-1">{msg.name}</p>
                <p className="text-xs text-church-500">{msg.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-church-400 mb-2">{new Date(msg.timestamp).toLocaleString('it-IT')}</p>
                <button onClick={() => handleDelete(msg.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="bg-church-50 p-3 rounded mt-2">
              <p className="text-sm text-church-700 whitespace-pre-line">{msg.message}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-church-400">Nessun messaggio ricevuto.</p>}
      </div>
    </div>
  );
}

function NoticesManager({ user, isAdmin }: { user: any, isAdmin: boolean }) {
  const [noticesSnapshot] = useCollection(collection(db, 'notices'));
  const [groupsSnapshot] = useCollection(collection(db, 'groups'));
  const [membersSnapshot] = useCollection(query(collection(db, 'group_members'), where('userId', '==', user.uid), where('isVerified', '==', true)));
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [groupId, setGroupId] = useState('');
  const [category, setCategory] = useState('Avviso');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const notices = noticesSnapshot?.docs.map(d => ({ id: d.id, ...d.data() }) as any) || [];
  const myGroups = isAdmin ? groupsSnapshot?.docs : groupsSnapshot?.docs.filter(g => membersSnapshot?.docs.some(m => m.data().groupId === g.id));
  const canPublish = isAdmin || (myGroups && myGroups.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !title || !content) return;
    setLoading(true);
    try {
      const groupDoc = groupsSnapshot?.docs.find(g => g.id === groupId);
      const parish = groupDoc?.data().parish || 'Unità Pastorale';
      
      let uploadedImages: string[] = [];
      if (imageUrl) uploadedImages.push(imageUrl);

      const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800;
              const MAX_HEIGHT = 800;
              let width = img.width;
              let height = img.height;
              
              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      };

      for (const file of imageFiles) {
        const base64 = await resizeImage(file);
        uploadedImages.push(base64);
      }
      
      if (editingId) {
        const updateData: any = {
          title,
          content,
          groupId,
          category,
          parish,
          attachmentUrl
        };
        // Only update images if new ones were provided
        if (uploadedImages.length > 0) {
          updateData.imageUrl = uploadedImages[0];
          updateData.images = uploadedImages;
        }
        await updateDoc(doc(db, 'notices', editingId), updateData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'notices'), {
          title,
          content,
          groupId,
          authorId: user.uid,
          date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
          timestamp: new Date().getTime(),
          category,
          parish,
          imageUrl: uploadedImages.length > 0 ? uploadedImages[0] : '', // backward compatibility
          images: uploadedImages,
          attachmentUrl
        });
      }
      
      setTitle('');
      setContent('');
      setGroupId('');
      setImageUrl('');
      setImageFiles([]);
      setAttachmentUrl('');
    } catch (error) {
      console.error(error);
      alert('Errore durante la pubblicazione.');
    }
    setLoading(false);
  };

  const handleEdit = (notice: any) => {
    setEditingId(notice.id);
    setTitle(notice.title);
    setContent(notice.content);
    setGroupId(notice.groupId);
    setCategory(notice.category);
    setAttachmentUrl(notice.attachmentUrl || '');
    setImageUrl('');
    setImageFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'notices', id));
  };

  return (
    <div className="space-y-8">
      {canPublish ? (
        <form onSubmit={handleSubmit} className="bg-church-50 p-6 rounded border border-church-200 space-y-4">
          <h3 className="font-bold text-church-900 mb-2">{editingId ? 'Modifica Avviso' : 'Pubblica Nuovo Avviso'}</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Titolo</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Gruppo</label>
              <select required value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200">
                <option value="">Seleziona gruppo...</option>
                {isAdmin && <option value="admin">Amministrazione Parrocchiale</option>}
                {myGroups?.map(g => (
                  <option key={g.id} value={g.id}>{g.data().name} ({g.data().parish})</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-church-500 uppercase mb-1">Categoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 rounded border border-church-200">
              <option value="Avviso">Avviso</option>
              <option value="Notizia">Notizia</option>
              <option value="Riflessione">Riflessione</option>
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">Carica Immagini (multiple opzionali)</label>
              <input type="file" multiple accept="image/*" onChange={e => {
                if (e.target.files) setImageFiles(Array.from(e.target.files));
              }} className="w-full px-3 py-1.5 rounded border border-church-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-church-500 uppercase mb-1">URL Allegato PDF/Altro (opzionale)</label>
              <input value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded border border-church-200" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-church-500 uppercase mb-1">Contenuto</label>
            <textarea required value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full px-3 py-2 rounded border border-church-200 resize-none" />
          </div>
          <div className="flex gap-2">
            <button disabled={loading} type="submit" className="bg-church-600 text-white font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-opacity-90">
              <Plus size={16} /> {editingId ? 'Aggiorna' : 'Pubblica'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setTitle(''); setContent(''); setGroupId(''); setCategory('Avviso'); setAttachmentUrl(''); setImageFiles([]); }}
                className="px-4 py-2 font-bold text-church-600 hover:bg-church-200 bg-church-100 rounded"
              >
                Annulla
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="bg-orange-50 text-orange-800 p-4 rounded border border-orange-200 text-sm">
          Non hai ancora i permessi per pubblicare avvisi. Richiedi l'accesso a un gruppo nella sezione "Gruppi".
        </div>
      )}

      <div>
        <h3 className="font-bold text-church-900 mb-4">I Miei Avvisi Pubblicati</h3>
        <div className="space-y-4">
          {notices.filter(n => isAdmin || n.authorId === user.uid).map((notice: any) => (
            <div key={notice.id} className="bg-white p-4 rounded border border-church-200 flex justify-between items-start gap-4">
              <div>
                <div className="flex gap-2 mb-1">
                  <span className="text-[10px] font-bold bg-church-100 text-church-600 px-2 py-0.5 rounded uppercase">{notice.category}</span>
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">{notice.date}</span>
                </div>
                <h4 className="font-bold text-church-900">{notice.title}</h4>
                <p className="text-sm text-church-500 mt-1 line-clamp-2">{notice.content}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleEdit(notice)} className="text-church-500 hover:bg-church-50 p-2 rounded shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider underline">Modifica</span>
                </button>
                <button onClick={() => handleDelete(notice.id)} className="text-red-500 hover:bg-red-50 p-2 rounded shrink-0">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {notices.filter(n => isAdmin || n.authorId === user.uid).length === 0 && (
            <p className="text-sm text-church-400">Nessun avviso pubblicato.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupsManager({ user, isAdmin }: { user: any, isAdmin: boolean }) {
  const [groupsSnapshot] = useCollection(collection(db, 'groups'));
  const [membersSnapshot] = useCollection(query(collection(db, 'group_members'), where('userId', '==', user.uid)));
  
  const [name, setName] = useState('');
  const [parish, setParish] = useState<Parish | 'Unità Pastorale'>('Unità Pastorale');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const groups = groupsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() }) as any) || [];
  const myMemberships = membersSnapshot?.docs.map(d => ({ id: d.id, ...d.data() }) as any) || [];

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !isAdmin) return;
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'groups', editingId), { name, parish });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'groups'), { name, parish });
      }
      setName('');
    } catch (error) {
      console.error(error);
      alert('Errore.');
    }
    setLoading(false);
  };

  const handleEdit = (group: any) => {
    setEditingId(group.id);
    setName(group.name);
    setParish(group.parish);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJoin = async (groupId: string) => {
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'group_members', `${groupId}_${user.uid}`), {
        groupId,
        userId: user.uid,
        userEmail: user.email,
        isVerified: false
      });
      alert('Richiesta inviata. Attendi la verifica dell\'amministratore.');
    } catch (e) {
      console.error(e);
      alert('Errore durante la richiesta.');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'groups', id));
  };

  return (
    <div className="space-y-8">
      {isAdmin && (
        <form onSubmit={handleCreateGroup} className="bg-church-50 p-6 rounded border border-church-200 space-y-4">
          <h3 className="font-bold text-church-900 mb-2">{editingId ? 'Modifica Gruppo' : 'Crea Nuovo Gruppo'}</h3>
          <div className="flex gap-4">
            <input required placeholder="Nome del gruppo" value={name} onChange={e => setName(e.target.value)} className="flex-1 px-3 py-2 rounded border border-church-200" />
            <select value={parish} onChange={e => setParish(e.target.value as any)} className="px-3 py-2 rounded border border-church-200">
              <option value="Unità Pastorale">Unità Pastorale</option>
              <option value="Oppeano">Oppeano</option>
              <option value="Ca' degli Oppi">Ca' degli Oppi</option>
            </select>
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setName(''); setParish('Unità Pastorale'); }}
                className="font-bold px-4 py-2 text-church-600 hover:bg-church-200 bg-church-100 rounded"
              >
                Annulla
              </button>
            )}
            <button disabled={loading} type="submit" className="bg-church-600 text-white font-bold px-4 py-2 rounded">
              {editingId ? 'Aggiorna' : 'Crea'}
            </button>
          </div>
        </form>
      )}

      <div>
        <h3 className="font-bold text-church-900 mb-4">Elenco Gruppi</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map((group: any) => {
            const membership = myMemberships.find(m => m.groupId === group.id);
            return (
              <div key={group.id} className="bg-white p-4 rounded border border-church-200 flex flex-col justify-between relative">
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => handleEdit(group)} className="text-church-500 hover:bg-church-50 p-1 rounded">
                      <span className="text-xs font-bold uppercase underline">Modifica</span>
                    </button>
                    <button onClick={() => handleDelete(group.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                <div className={isAdmin ? 'pr-20' : ''}>
                  <h4 className="font-bold text-church-900">{group.name}</h4>
                  <p className="text-xs text-church-500 mb-4">{group.parish}</p>
                </div>
                {isAdmin ? (
                  <span className="text-xs font-bold text-church-600 bg-church-50 px-2 py-1 rounded self-start">Sei Amministratore</span>
                ) : membership ? (
                  membership.isVerified ? (
                    <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded self-start flex items-center gap-1"><CheckCircle size={12}/> Verificato</span>
                  ) : (
                    <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded self-start">In attesa di verifica</span>
                  )
                ) : (
                  <button onClick={() => handleJoin(group.id)} className="text-xs font-bold bg-church-100 text-church-700 px-3 py-1.5 rounded hover:bg-church-200 self-start transition-colors">
                    Richiedi di pubblicare
                  </button>
                )}
              </div>
            );
          })}
          {groups.length === 0 && <p className="text-sm text-church-400">Nessun gruppo esistente.</p>}
        </div>
      </div>
    </div>
  );
}

function MembersManager() {
  const [membersSnapshot] = useCollection(collection(db, 'group_members'));
  const [groupsSnapshot] = useCollection(collection(db, 'groups'));
  
  const members = membersSnapshot?.docs.map(d => ({ id: d.id, ...d.data() }) as any) || [];
  const groups = groupsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() }) as any) || [];
  
  const pendingRequests = members.filter(m => !m.isVerified);
  const verifiedMembers = members.filter(m => m.isVerified);

  const handleVerify = async (id: string) => {
    await updateDoc(doc(db, 'group_members', id), { isVerified: true });
  };
  
  const handleReject = async (id: string) => {
    await deleteDoc(doc(db, 'group_members', id));
  };

  const getGroupName = (groupId: string) => groups.find(g => g.id === groupId)?.name || 'Gruppo Sconosciuto';

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-bold text-church-900 mb-4 flex items-center gap-2">Richieste in Attesa <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span></h3>
        <div className="space-y-3">
          {pendingRequests.map(req => (
            <div key={req.id} className="bg-white p-4 rounded border border-church-200 flex justify-between items-center gap-4">
              <div>
                <p className="font-bold text-sm text-church-900">{req.userEmail}</p>
                <p className="text-xs text-church-500">Richiede accesso a: <span className="font-semibold">{getGroupName(req.groupId)}</span></p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleVerify(req.id)} className="bg-green-600 text-white px-3 py-1.5 text-xs font-bold rounded hover:bg-green-700">Approva</button>
                <button onClick={() => handleReject(req.id)} className="bg-red-50 text-red-600 px-3 py-1.5 text-xs font-bold rounded hover:bg-red-100">Rifiuta</button>
              </div>
            </div>
          ))}
          {pendingRequests.length === 0 && <p className="text-sm text-church-400">Nessuna richiesta in attesa.</p>}
        </div>
      </div>
      
      <div>
        <h3 className="font-bold text-church-900 mb-4">Utenti Verificati</h3>
        <div className="space-y-3">
          {verifiedMembers.map(req => (
            <div key={req.id} className="bg-white p-3 rounded border border-church-100 flex justify-between items-center gap-4">
              <div>
                <p className="font-bold text-sm text-church-800">{req.userEmail}</p>
                <p className="text-xs text-church-400">Accesso a: {getGroupName(req.groupId)}</p>
              </div>
              <button onClick={() => handleReject(req.id)} className="text-xs text-red-500 hover:underline">Revoca accesso</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FavoritesManager({ user }: { user: any }) {
  const [favoritesSnapshot] = useCollection(query(collection(db, 'user_favorites'), where('userId', '==', user.uid)));
  const favorites = favoritesSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.timestamp - a.timestamp) || [];

  const handleRemove = async (id: string) => {
    await deleteDoc(doc(db, 'user_favorites', id));
  };

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-church-900 mb-4 flex items-center gap-2">
        <Bookmark size={20} className="text-church-600" /> I Miei Preferiti
      </h3>
      {favorites.length === 0 ? (
        <div className="bg-white p-8 text-center rounded border border-church-200">
          <p className="text-church-500">Non hai salvato ancora nessun avviso nei preferiti.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((fav: any) => {
            const news = fav.notice;
            return (
              <div key={fav.id} className="bg-white rounded overflow-hidden shadow-sm border border-church-200 flex flex-col sm:flex-row">
                {news.imageUrl ? (
                  <div className="h-32 sm:h-auto sm:w-1/4 shrink-0 border-b sm:border-b-0 sm:border-r border-church-200">
                    <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" />
                  </div>
                ) : null}
                <div className="flex flex-col flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-church-500 uppercase tracking-wide bg-church-100 px-2 py-0.5 rounded mb-2 inline-block">
                        {news.category}
                      </span>
                      <h4 className="font-bold text-church-900 text-sm leading-tight">{news.title}</h4>
                      <p className="text-xs text-church-400 mt-1">{news.date}</p>
                    </div>
                    <button 
                      onClick={() => handleRemove(fav.id)}
                      className="text-church-400 hover:text-church-600 p-1"
                    >
                      <Bookmark size={18} className="fill-church-600 text-church-600" />
                    </button>
                  </div>
                  <p className="text-church-600 text-xs line-clamp-2 mt-auto">{news.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettingsManager({ user }: { user: any }) {
  const [settingsDoc] = useDocument(doc(db, 'user_settings', user.uid));
  const currentSettings = settingsDoc?.data() || { emailNotifications: true, pushNotifications: false };
  
  const [emailNotif, setEmailNotif] = useState(currentSettings.emailNotifications);
  const [pushNotif, setPushNotif] = useState(currentSettings.pushNotifications);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settingsDoc?.data()) {
      const data = settingsDoc.data() as any;
      setEmailNotif(data.emailNotifications ?? true);
      setPushNotif(data.pushNotifications ?? false);
    }
  }, [settingsDoc]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await setDoc(doc(db, 'user_settings', user.uid), {
        emailNotifications: emailNotif,
        pushNotifications: pushNotif,
        updatedAt: new Date().getTime()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Errore nel salvataggio.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-church-900 mb-4 flex items-center gap-2">
        <SettingsIcon size={20} className="text-church-600" /> Impostazioni Profilo
      </h3>
      
      <div className="bg-white p-6 rounded border border-church-200">
        <div className="mb-6 pb-6 border-b border-church-100">
          <p className="text-sm font-bold text-church-900 mb-1">Account Collegato</p>
          <p className="text-sm text-church-500">{user.email}</p>
        </div>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h4 className="text-sm font-bold text-church-900 mb-3">Preferenze Notifiche</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={emailNotif}
                  onChange={e => setEmailNotif(e.target.checked)}
                  className="w-4 h-4 text-church-600 rounded border-church-300 focus:ring-church-600" 
                />
                <span className="text-sm text-church-700">Ricevi notifiche via Email (Newsletter settimanale)</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={pushNotif}
                  onChange={e => setPushNotif(e.target.checked)}
                  className="w-4 h-4 text-church-600 rounded border-church-300 focus:ring-church-600" 
                />
                <span className="text-sm text-church-700">Ricevi notifiche Push per avvisi urgenti</span>
              </label>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-church-600 text-white font-bold px-6 py-2 rounded hover:bg-church-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvataggio...' : 'Salva Impostazioni'}
            </button>
            {saved && <span className="text-sm font-bold text-green-600 flex items-center gap-1"><CheckCircle size={16} /> Salvato!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}

function UsersManager() {
  const [usersSnapshot] = useCollection(query(collection(db, 'users'), orderBy('lastLogin', 'desc')));
  const users = usersSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isAdmin: !currentStatus });
    } catch (error) {
      console.error("Error updating admin status:", error);
      alert("Errore durante l'aggiornamento. Riprova.");
    }
  };

  const filteredUsers = users.filter((u: any) => 
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-church-900 mb-4 flex items-center gap-2">
        <Shield size={20} /> Gestione Amministratori
      </h3>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-church-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-church-200 rounded-lg leading-5 bg-white placeholder-church-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 sm:text-sm"
          placeholder="Cerca per nome o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-church-200 divide-y divide-church-100">
        {filteredUsers.map((u: any) => (
          <div key={u.id} className="p-4 flex items-center justify-between hover:bg-church-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-church-100 overflow-hidden flex items-center justify-center shrink-0">
                {u.photoUrl ? <img src={u.photoUrl} alt={u.name} className="w-full h-full object-cover" /> : <UserRound size={20} className="text-church-400" />}
              </div>
              <div>
                <p className="font-bold text-church-900 leading-tight">{u.name || 'Utente Sconosciuto'}</p>
                <p className="text-xs text-church-500">{u.email}</p>
              </div>
            </div>
            {u.email !== 'dennisbottari@gmail.com' ? (
              <button
                onClick={() => handleToggleAdmin(u.id, !!u.isAdmin)}
                className={`px-3 py-1 text-xs font-bold rounded border ${
                  u.isAdmin 
                    ? 'border-red-200 text-red-600 hover:bg-red-50' 
                    : 'border-church-200 text-church-600 hover:bg-church-50'
                }`}
              >
                {u.isAdmin ? 'Revoca Admin' : 'Rendi Admin'}
              </button>
            ) : (
              <span className="text-xs font-bold text-church-400 bg-church-100 px-2 py-1 rounded">Super Admin</span>
            )}
          </div>
        ))}
        {users.length === 0 && <div className="p-8 text-center text-church-400 text-sm">Nessun utente registrato.</div>}
      </div>
    </div>
  );
}

function StatsManager() {
  const [visitorsSnapshot] = useCollection(query(collection(db, 'visitors')));
  const visitorsCount = visitorsSnapshot?.docs.length || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold text-church-900 mb-6">Statistiche</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-church-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-full mb-4">
            <Users size={24} />
          </div>
          <h3 className="text-church-500 text-sm font-bold uppercase tracking-wider mb-1">Visitatori Unici</h3>
          <p className="text-4xl font-serif font-bold text-church-900">{visitorsCount}</p>
        </div>
      </div>
    </div>
  );
}
