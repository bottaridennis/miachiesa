import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Calendar, MapPin, Clock, UserRound, ArrowLeft, BookOpen } from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function CommunityView() {
  const [eventsSnapshot] = useCollection(query(collection(db, 'events'), orderBy('timestamp', 'asc')));
  const [groupsSnapshot] = useCollection(collection(db, 'groups'));
  const [communitySnapshot] = useCollection(collection(db, 'community_members'));
  const [noticesSnapshot] = useCollection(query(collection(db, 'notices'), orderBy('timestamp', 'desc')));
  
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const events = eventsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const groups = groupsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const members = communitySnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const notices = noticesSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];

  if (selectedGroup) {
    const groupEvents = events.filter((e: any) => e.groupId === selectedGroup.id || e.group === selectedGroup.name);
    const groupNotices = notices.filter((n: any) => n.groupId === selectedGroup.id);

    return (
      <div className="pb-24 pt-8 px-4 max-w-4xl mx-auto space-y-8">
        <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-2 text-church-500 hover:text-church-800 font-medium">
          <ArrowLeft size={20} /> Torna ai gruppi
        </button>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-church-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-church-50 text-church-600 rounded-full flex items-center justify-center shrink-0">
              <Users size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-church-900">{selectedGroup.name}</h1>
              <span className="text-sm font-bold uppercase tracking-wide text-church-500">{selectedGroup.parish}</span>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-church-900 mb-4 flex items-center gap-2 border-b border-church-100 pb-2"><Calendar size={20} /> Eventi del Gruppo</h2>
            <div className="space-y-4">
              {groupEvents.map((event: any) => (
                <div key={event.id} className="bg-white p-4 rounded border border-church-200">
                  <h3 className="font-bold text-church-900">{event.title}</h3>
                  <div className="flex flex-col gap-1 mt-2 text-sm text-church-600">
                    <span className="flex items-center gap-2"><Calendar size={14} /> {event.date}</span>
                    <span className="flex items-center gap-2"><Clock size={14} /> {event.time}</span>
                    <span className="flex items-center gap-2"><MapPin size={14} /> {event.location}</span>
                  </div>
                </div>
              ))}
              {groupEvents.length === 0 && <p className="text-church-400">Nessun evento in programma.</p>}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-church-900 mb-4 flex items-center gap-2 border-b border-church-100 pb-2"><BookOpen size={20} /> Avvisi del Gruppo</h2>
            <div className="space-y-4">
              {groupNotices.map((notice: any) => (
                <div key={notice.id} className="bg-white p-4 rounded border border-church-200">
                  <span className="text-[10px] font-bold bg-church-100 text-church-600 px-2 py-0.5 rounded uppercase mb-2 inline-block">{notice.category}</span>
                  <h3 className="font-bold text-church-900">{notice.title}</h3>
                  <p className="text-sm text-church-600 mt-2 whitespace-pre-wrap">{notice.content}</p>
                  
                  {(notice.images && notice.images.length > 0) ? (
                    <div className="mt-4 flex overflow-x-auto snap-x snap-mandatory gap-2 pb-2">
                      {notice.images.map((img: string, idx: number) => (
                        <img key={idx} src={img} alt="allegato" className="h-32 rounded object-cover shrink-0 snap-center" />
                      ))}
                    </div>
                  ) : notice.imageUrl && (
                    <img src={notice.imageUrl} alt="allegato" className="mt-4 max-h-48 w-full object-cover rounded" />
                  )}
                  
                  {notice.attachmentUrl && (
                    <a href={notice.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm font-medium text-church-600 hover:underline">
                      Visualizza Allegato &rarr;
                    </a>
                  )}
                  <div className="mt-3 text-xs text-church-400 border-t border-church-100 pt-2">{notice.date}</div>
                </div>
              ))}
              {groupNotices.length === 0 && <p className="text-church-400">Nessun avviso pubblicato.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 px-4 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-serif font-bold text-church-900 mb-2">Comunità</h1>
        <p className="text-church-500">Eventi, gruppi e la nostra famiglia parrocchiale.</p>
      </motion.div>

      {/* Prossimi Eventi */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-church-600" size={24} />
          <h2 className="text-2xl font-serif font-bold text-church-900">Prossimi Eventi</h2>
        </div>

        <div className="space-y-4">
          {events.map((event: any) => (
            <div key={event.id} className="bg-white p-0 rounded-lg shadow-sm border border-church-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
              <div className={`p-5 flex-1 border-l-4 ${
                event.parish === 'Oppeano' ? 'border-l-blue-500' :
                event.parish === 'Ca\' degli Oppi' ? 'border-l-amber-500' :
                'border-l-church-600'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-church-500">{event.group || 'Evento'}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    event.parish === 'Oppeano' ? 'bg-blue-100 text-blue-800' : 
                    event.parish === 'Ca\' degli Oppi' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {event.parish || 'Unità Pastorale'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-church-900 mb-3">{event.title}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-church-700">
                  <span className="flex items-center gap-1.5"><Calendar size={16} className="text-church-400" /> {event.date}</span>
                  <span className="flex items-center gap-1.5"><Clock size={16} className="text-church-400" /> {event.time}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={16} className="text-church-400" /> {event.location}</span>
                </div>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-church-400">Nessun evento in programma.</p>}
        </div>
      </motion.section>

      {/* La Nostra Comunità */}
      {members.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <UserRound className="text-church-600" size={24} />
            <h2 className="text-2xl font-serif font-bold text-church-900">La Nostra Comunità</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {members.map((member: any) => (
              <div key={member.id} className="bg-white p-4 rounded-lg shadow-sm border border-church-200 text-center hover:border-church-600 transition-colors flex flex-col items-center">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-church-100 mb-3 border-2 border-church-50 flex items-center justify-center">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserRound size={32} className="text-church-300" />
                  )}
                </div>
                <h3 className="font-bold text-church-900 text-sm mb-1">{member.name}</h3>
                <p className="text-xs text-church-500">{member.role}</p>
                {member.parish && <p className="text-[10px] text-church-400 mt-1 uppercase tracking-widest">{member.parish}</p>}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Gruppi Parrocchiali */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-church-600" size={24} />
          <h2 className="text-2xl font-serif font-bold text-church-900">I Nostri Gruppi</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((group: any, idx: number) => (
            <div key={idx} onClick={() => setSelectedGroup(group)} className="cursor-pointer bg-white p-5 rounded-lg shadow-sm border border-church-200 hover:border-church-600 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-church-50 text-church-600 rounded-full flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-church-900">{group.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded inline-block mt-1 ${
                    group.parish === 'Oppeano' ? 'bg-blue-100 text-blue-800' :
                    group.parish === 'Ca\' degli Oppi' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {group.parish || 'Unità Pastorale'}
                  </span>
                </div>
              </div>
              
              {group.leaders && group.leaders.length > 0 && (
                <div className="mt-4 pt-4 border-t border-church-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-church-400 mb-2">Responsabili</p>
                  <div className="flex flex-wrap gap-3">
                    {group.leaders.map((leader: any, lidx: number) => (
                      <div key={lidx} className="flex items-center gap-2">
                        {leader.imageUrl ? (
                          <img src={leader.imageUrl} alt={leader.name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-church-100 flex items-center justify-center text-church-400">
                            <UserRound size={12} />
                          </div>
                        )}
                        <span className="text-sm font-medium text-church-700">{leader.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
