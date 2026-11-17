import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Calendar as CalendarIcon, Clock, ArrowRight, Download, Bookmark } from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, limit, doc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function HomeView({ setCurrentView }: { setCurrentView?: (view: any) => void }) {
  const [user] = useAuthState(auth);
  const [noticesSnapshot] = useCollection(query(collection(db, 'notices'), orderBy('timestamp', 'desc'), limit(10)));
  const notices = noticesSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];

  const [favoritesSnapshot] = useCollection(user ? query(collection(db, 'user_favorites'), where('userId', '==', user.uid)) : null);
  const favoriteIds = new Set(favoritesSnapshot?.docs.map(d => d.data().noticeId) || []);

  const toggleFavorite = async (news: any) => {
    if (!user) {
      alert('Devi accedere per salvare i preferiti.');
      return;
    }
    const isFavorite = favoriteIds.has(news.id);
    const docRef = doc(db, 'user_favorites', `${user.uid}_${news.id}`);
    
    if (isFavorite) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, {
        userId: user.uid,
        noticeId: news.id,
        notice: news,
        timestamp: new Date().getTime()
      });
    }
  };

  return (
    <div className="pb-24 bg-white min-h-screen">
      {/* Hero Section */}
      <div className="px-4 pt-6 max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] shadow-xl mb-10 bg-church-900 border border-church-800"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-church-900 via-church-900/90 to-church-800/40 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1548625361-ec853713f063?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Interno chiesa" 
            className="absolute inset-0 w-full h-full object-cover object-center mix-blend-overlay opacity-60 grayscale-[30%]"
          />
          <div className="relative z-20 p-8 sm:p-12 flex flex-col justify-end min-h-[360px]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium mb-6 w-fit shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              Oggi, 18:00 &middot; S. Messa
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-3 text-white tracking-tight leading-tight">
              Unità Pastorale
            </h1>
            <p className="text-church-300 text-lg sm:text-xl font-medium max-w-lg mb-8 tracking-wide">
              Oppeano e Ca' degli Oppi
            </p>
            <div className="flex flex-wrap gap-4 mt-auto">
              <button 
                onClick={() => setCurrentView && setCurrentView('liturgy')}
                className="bg-white text-church-900 px-6 py-3 rounded-full font-bold text-sm hover:bg-church-50 transition-colors shadow-sm flex items-center gap-2"
              >
                <CalendarIcon size={18} /> Orari Messe
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="px-4 max-w-5xl mx-auto space-y-12">
        
        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <button 
            onClick={() => {
              document.getElementById('avvisi-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-church-200 flex flex-col items-center justify-center gap-4 hover:shadow-md hover:border-church-300 transition-all overflow-hidden"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-church-50 flex items-center justify-center text-church-900 group-hover:bg-church-900 group-hover:text-white transition-colors">
              <Bell size={24} />
            </div>
            <div className="text-center w-full px-1">
              <span className="font-bold text-church-900 block text-sm truncate">Avvisi</span>
              <span className="text-[10px] sm:text-[11px] text-church-500 uppercase tracking-wider font-semibold block truncate">Bacheca</span>
            </div>
          </button>
          
          <button 
            onClick={() => setCurrentView && setCurrentView('services')}
            className="group bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-church-200 flex flex-col items-center justify-center gap-4 hover:shadow-md hover:border-church-300 transition-all overflow-hidden"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-church-50 flex items-center justify-center text-church-900 group-hover:bg-church-900 group-hover:text-white transition-colors">
              <ArrowRight size={24} />
            </div>
            <div className="text-center w-full px-1">
              <span className="font-bold text-church-900 block text-sm truncate">Servizi</span>
              <span className="text-[10px] sm:text-[11px] text-church-500 uppercase tracking-wider font-semibold block truncate">Segreteria</span>
            </div>
          </button>
          
          <button 
            onClick={() => setCurrentView && setCurrentView('community')}
            className="group bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-church-200 flex flex-col items-center justify-center gap-4 hover:shadow-md hover:border-church-300 transition-all overflow-hidden"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-church-50 flex items-center justify-center text-church-900 group-hover:bg-church-900 group-hover:text-white transition-colors">
              <Clock size={24} />
            </div>
            <div className="text-center w-full px-1">
              <span className="font-bold text-church-900 block text-sm truncate">Comunità</span>
              <span className="text-[10px] sm:text-[11px] text-church-500 uppercase tracking-wider font-semibold block truncate">Gruppi attivi</span>
            </div>
          </button>

          <button 
            onClick={() => setCurrentView && setCurrentView('registrations')}
            className="group bg-church-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-church-800 flex flex-col items-center justify-center gap-4 hover:shadow-lg hover:shadow-church-900/20 transition-all relative overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
            <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-white/10 flex items-center justify-center text-white relative z-10 group-hover:scale-110 transition-transform shadow-inner">
              <ArrowRight size={24} />
            </div>
            <div className="text-center w-full px-1 relative z-10">
              <span className="font-bold text-white block text-sm truncate">Iscrizioni</span>
              <span className="text-[10px] sm:text-[11px] text-church-400 uppercase tracking-wider font-semibold block truncate">Moduli online</span>
            </div>
          </button>
        </motion.div>

        {/* Notizie ed Eventi */}
        <motion.div
          id="avvisi-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4 scroll-mt-24">
            <h2 className="text-2xl font-serif font-bold text-church-900">In Evidenza</h2>
          </div>
          
          <div className="space-y-4">
            {notices.map((news: any) => (
              <div key={news.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-church-200 flex flex-col sm:flex-row">
                {(news.images && news.images.length > 0) ? (
                  <div className="h-48 sm:h-auto sm:w-1/3 shrink-0 border-b sm:border-b-0 sm:border-r border-church-200 flex overflow-x-auto snap-x snap-mandatory">
                    {news.images.map((img: string, idx: number) => (
                      <img key={idx} src={img} alt={news.title} className="w-full h-full object-cover shrink-0 snap-center" />
                    ))}
                  </div>
                ) : news.imageUrl ? (
                  <div className="h-48 sm:h-auto sm:w-1/3 shrink-0 border-b sm:border-b-0 sm:border-r border-church-200">
                    <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" />
                  </div>
                ) : null}
                <div className="flex flex-col flex-1">
                  <div className="bg-church-100 border-b border-church-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-church-500 uppercase tracking-wide">
                        {news.category}
                      </span>
                      {news.parish && news.parish !== 'Unità Pastorale' && (
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                          news.parish === 'Oppeano' ? 'bg-blue-100 text-blue-800' :
                          news.parish === 'Ca\' degli Oppi' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {news.parish}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-church-400 font-medium whitespace-nowrap">{news.date}</span>
                      <button 
                        onClick={() => toggleFavorite(news)} 
                        className={`text-church-400 hover:text-church-600 transition-colors ${favoriteIds.has(news.id) ? 'fill-church-600 text-church-600' : ''}`}
                      >
                        <Bookmark size={18} className={favoriteIds.has(news.id) ? 'fill-church-600 text-church-600' : ''} />
                      </button>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-church-900 mb-2 leading-tight">
                        {news.title}
                      </h3>
                      <p className="text-church-700 text-sm whitespace-pre-line mb-4">
                        {news.content}
                      </p>
                    </div>
                    {news.attachmentUrl && (
                      <a 
                        href={news.attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-church-600 bg-church-50 px-4 py-2 rounded-lg border border-church-200 hover:bg-church-100 self-start transition-colors"
                      >
                        <Download size={16} />
                        Scarica Allegato
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {notices.length === 0 && (
              <div className="text-center p-8 bg-white rounded-lg border border-church-200">
                <p className="text-church-400 font-medium">Nessun avviso pubblicato di recente.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
