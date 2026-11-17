import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Clock, MapPin, Calendar } from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function LiturgyView() {
  const [massTimesSnapshot] = useCollection(query(collection(db, 'mass_times'), orderBy('order')));
  const [liturgySnapshot] = useCollection(query(collection(db, 'liturgy'), orderBy('timestamp', 'desc')));

  const massTimes = massTimesSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const liturgyDocs = liturgySnapshot?.docs.map(d => ({ id: d.id, ...d.data() }) as any) || [];
  const activeReading = liturgyDocs.length > 0 ? liturgyDocs[0] : null;

  return (
    <div className="pb-24 pt-8 px-4 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-serif font-bold text-church-900 mb-2">Liturgia</h1>
        <p className="text-church-500">Orari delle celebrazioni e letture del giorno.</p>
      </motion.div>

      {/* Letture del Giorno */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="text-church-600" size={24} />
          <h2 className="text-2xl font-serif font-bold text-church-900">Letture</h2>
        </div>
        
        {activeReading ? (
          <div className="bg-white rounded-lg p-0 shadow-sm border border-church-200 overflow-hidden">
            <div className="bg-church-100 flex items-center justify-between border-b border-church-200 px-6 py-4">
              <span className="font-bold text-church-500 uppercase tracking-wide text-xs">{activeReading.date}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-church-400 font-bold uppercase tracking-wide">Colore:</span>
                <div className={`w-3 h-3 rounded-full ${
                  activeReading.liturgicalColor === 'green' ? 'bg-green-600' :
                  activeReading.liturgicalColor === 'red' ? 'bg-red-600' :
                  activeReading.liturgicalColor === 'white' ? 'bg-gray-100 border' :
                  activeReading.liturgicalColor === 'purple' ? 'bg-purple-700' :
                  'bg-rose-400'
                }`} title={activeReading.liturgicalColor} />
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="border-b border-church-100 pb-6">
                <h3 className="text-xs font-bold text-church-500 uppercase tracking-widest mb-1">Prima Lettura</h3>
                <p className="text-sm text-church-400 mb-3 font-medium">{activeReading.firstReading?.reference}</p>
                <p className="text-church-800 leading-relaxed whitespace-pre-line">{activeReading.firstReading?.text}</p>
              </div>
              
              <div className="border-b border-church-100 pb-6">
                <h3 className="text-xs font-bold text-church-500 uppercase tracking-widest mb-1">Salmo Responsoriale</h3>
                <p className="text-sm text-church-400 mb-3 font-medium">{activeReading.psalm?.reference}</p>
                <p className="text-church-800 leading-relaxed whitespace-pre-line">{activeReading.psalm?.text}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-church-500 uppercase tracking-widest mb-1">Vangelo</h3>
                <p className="text-sm text-church-400 mb-3 font-medium">{activeReading.gospel?.reference}</p>
                <p className="text-church-800 leading-relaxed whitespace-pre-line">{activeReading.gospel?.text}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-church-200 text-center">
            <p className="text-church-400 font-medium">Nessuna lettura inserita per oggi.</p>
          </div>
        )}
      </motion.section>

      {/* Orari Messe */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4 mt-8">
          <Clock className="text-church-600" size={24} />
          <h2 className="text-2xl font-serif font-bold text-church-900">Orari Messe</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {massTimes.length > 0 ? massTimes.map((mass: any) => (
            <div key={mass.id} className="bg-white p-5 rounded-lg shadow-sm border border-church-200 flex items-center justify-between">
              <div>
                {mass.title && <p className="font-bold text-church-900 mb-1">{mass.title}</p>}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    mass.type === 'Festiva' ? 'bg-church-600 text-white' :
                    mass.type === 'Vigilia' || mass.type === 'Prefestiva' ? 'bg-orange-100 text-orange-800' : 'bg-church-100 text-church-500'
                  }`}>
                    {mass.type}
                  </span>
                  {mass.date && (
                    <span className="text-xs font-medium text-church-500 flex items-center gap-1">
                      <Calendar size={12} /> {new Date(mass.date).toLocaleDateString('it-IT')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-church-400 flex items-center gap-1 mt-1">
                  <MapPin size={14} /> {mass.location}
                </p>
                {mass.description && <p className="text-xs text-church-500 mt-2">{mass.description}</p>}
              </div>
              <div className="text-2xl font-serif font-bold text-church-900 ml-4 shrink-0">
                {mass.time}
              </div>
            </div>
          )) : (
            <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm border border-church-200 text-center">
              <p className="text-church-400 font-medium">Nessun orario inserito.</p>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
