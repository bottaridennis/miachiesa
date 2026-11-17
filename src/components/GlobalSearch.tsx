import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Users, FileText } from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection } from 'firebase/firestore';
import { db } from '../firebase';
import { ViewMode } from '../types';

export default function GlobalSearch({ setCurrentView }: { setCurrentView: (view: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [servicesSnap] = useCollection(collection(db, 'service_options'));
  const [groupsSnap] = useCollection(collection(db, 'groups'));
  const [liturgySnap] = useCollection(collection(db, 'liturgy'));
  const [massesSnap] = useCollection(collection(db, 'mass_times'));
  const [eventsSnap] = useCollection(collection(db, 'events'));
  const [noticesSnap] = useCollection(collection(db, 'notices'));
  const [formsSnap] = useCollection(collection(db, 'forms'));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results: any[] = [];

  if (query.trim().length > 1) {
    const q = query.toLowerCase();
    
    servicesSnap?.docs.forEach(doc => {
      const data = doc.data();
      if (data.title?.toLowerCase().includes(q) || data.description?.toLowerCase().includes(q)) {
        results.push({ id: doc.id, type: 'services', label: data.title, icon: FileText });
      }
    });

    groupsSnap?.docs.forEach(doc => {
      const data = doc.data();
      if (data.name?.toLowerCase().includes(q) || data.description?.toLowerCase().includes(q)) {
        results.push({ id: doc.id, type: 'community', label: data.name, icon: Users });
      }
    });

    liturgySnap?.docs.forEach(doc => {
      const data = doc.data();
      if (data.date?.toLowerCase().includes(q)) {
        results.push({ id: doc.id, type: 'liturgy', label: `Letture: ${data.date}`, icon: BookOpen });
      }
    });
    
    massesSnap?.docs.forEach(doc => {
      const data = doc.data();
      if (data.day?.toLowerCase().includes(q) || data.location?.toLowerCase().includes(q) || data.time?.toLowerCase().includes(q) || data.title?.toLowerCase().includes(q)) {
        results.push({ id: doc.id, type: 'liturgy', label: `S. Messa ${data.day} ${data.time}`, icon: BookOpen });
      }
    });

    eventsSnap?.docs.forEach(doc => {
      const data = doc.data();
      if (data.title?.toLowerCase().includes(q) || data.location?.toLowerCase().includes(q)) {
        results.push({ id: doc.id, type: 'community', label: `Evento: ${data.title}`, icon: Users });
      }
    });

    noticesSnap?.docs.forEach(doc => {
      const data = doc.data();
      if (data.title?.toLowerCase().includes(q) || data.content?.toLowerCase().includes(q)) {
        results.push({ id: doc.id, type: 'home', label: `Avviso: ${data.title}`, icon: FileText });
      }
    });

    formsSnap?.docs.forEach(doc => {
      const data = doc.data();
      if (data.title?.toLowerCase().includes(q) || data.description?.toLowerCase().includes(q)) {
        results.push({ id: doc.id, type: 'registrations', label: `Modulo: ${data.title}`, icon: FileText });
      }
    });
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50 p-4" ref={wrapperRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-church-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-14 pr-14 py-3 border border-church-200 rounded-full leading-5 bg-white placeholder-church-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 sm:text-sm shadow-sm transition-all"
          placeholder="Cerca servizi, liturgia, gruppi..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute inset-y-0 right-0 pr-5 flex items-center text-church-400 hover:text-church-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isOpen && query.trim().length > 1 && (
        <div className="absolute mt-2 left-4 right-4 bg-white rounded-xl shadow-lg border border-church-100 overflow-hidden max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="divide-y divide-church-50">
              {results.map((res, i) => (
                <li key={`${res.id}-${i}`}>
                  <button
                    onClick={() => {
                      setCurrentView(res.type);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-church-50 flex items-center gap-3 transition-colors"
                  >
                    <res.icon className="text-church-400 shrink-0" size={18} />
                    <span className="font-medium text-church-800 text-sm truncate px-1">{res.label}</span>
                    <span className="ml-auto text-[10px] uppercase font-bold text-church-400 bg-church-100 px-2 py-1 rounded-full shrink-0">
                      {res.type === 'community' ? 'Comunità' : res.type === 'services' ? 'Servizi' : res.type === 'home' ? 'Avvisi' : res.type === 'registrations' ? 'Iscrizioni' : 'Liturgia'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-church-500 text-sm">
              Nessun risultato trovato per "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
