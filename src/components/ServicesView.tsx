import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Send, HelpCircle } from 'lucide-react';
import { collection, addDoc, query, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase';

export default function ServicesView() {
  const [optionsSnapshot] = useCollection(query(collection(db, 'service_options'), orderBy('timestamp', 'asc')));
  const dynamicOptions = optionsSnapshot?.docs.map(d => {
    const data = d.data();
    return { id: d.id, value: data.value, label: data.label };
  }) || [];

  const defaultOptions = [
    { value: 'certificato_battesimo', label: 'Certificato di Battesimo' },
    { value: 'certificato_cresima', label: 'Certificato di Cresima' },
    { value: 'certificato_matrimonio', label: 'Certificato di Matrimonio' },
    { value: 'colloquio_parroco', label: 'Colloquio con il Parroco' },
    { value: 'benedizione_famiglia', label: 'Richiesta Benedizione Famiglia' },
    { value: 'altro', label: 'Altro / Informazioni' }
  ];

  const options = dynamicOptions.length > 0 ? dynamicOptions : defaultOptions;

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    service: options[0]?.value || 'altro',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'messages'), {
        ...formState,
        timestamp: new Date().getTime()
      });
      alert("Richiesta inviata con successo. La segreteria ti contatterà al più presto.");
      setFormState({ name: '', email: '', service: 'certificato_battesimo', message: '' });
    } catch (error) {
      console.error(error);
      alert("Si è verificato un errore durante l'invio. Riprova più tardi.");
    }
    setSubmitting(false);
  };

  return (
    <div className="pb-24 pt-8 px-4 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-serif font-bold text-church-900 mb-2">Segreteria</h1>
        <p className="text-church-500">Richiedi certificati o prenota un colloquio con il Parroco.</p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-6">
        
        {/* Info Segreteria */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="sm:col-span-1 space-y-4"
        >
          <div className="bg-white p-6 rounded-lg shadow-sm border border-church-200">
            <h3 className="font-serif font-bold text-lg mb-4 text-church-900">Orari Segreteria</h3>
            <ul className="space-y-3 text-sm text-church-700">
              <li className="flex justify-between border-b border-church-100 pb-2"><span>Lun - Mer</span> <span className="font-medium">09:30 - 12:00</span></li>
              <li className="flex justify-between border-b border-church-100 pb-2"><span>Giovedì</span> <span className="font-medium">16:00 - 18:30</span></li>
              <li className="flex justify-between pb-2"><span>Ven - Sab</span> <span className="font-medium">Chiuso</span></li>
            </ul>
            <div className="mt-6 pt-4 border-t border-church-100">
              <p className="text-sm text-church-500 mb-1">Telefono</p>
              <p className="font-semibold text-church-900">02 1234 5678</p>
            </div>
          </div>
          
          <div className="bg-[#FFFDF5] border border-[#FDE68A] p-6 rounded-lg text-church-800">
            <HelpCircle className="text-church-600 mb-3" size={28} />
            <h3 className="font-bold mb-2 text-[#92400E]">Hai bisogno di aiuto?</h3>
            <p className="text-sm text-[#78350F]">
              Se non trovi quello che cerchi nel modulo, puoi chiamarci durante gli orari di apertura.
            </p>
          </div>
        </motion.div>

        {/* Modulo Richieste */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="sm:col-span-2 bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-church-200"
        >
          <div className="flex items-center gap-2 mb-6">
            <FileText className="text-church-600" size={24} />
            <h2 className="text-2xl font-serif font-bold text-church-900">Nuova Richiesta</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-church-700 mb-1.5">Nome e Cognome *</label>
                <input 
                  required
                  type="text" 
                  value={formState.name}
                  onChange={e => setFormState({...formState, name: e.target.value})}
                  className="w-full px-4 py-3 rounded border border-church-200 focus:ring-2 focus:ring-church-600 focus:border-church-600 outline-none transition-all bg-church-50"
                  placeholder="Mario Rossi"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-church-700 mb-1.5">Email *</label>
                <input 
                  required
                  type="email" 
                  value={formState.email}
                  onChange={e => setFormState({...formState, email: e.target.value})}
                  className="w-full px-4 py-3 rounded border border-church-200 focus:ring-2 focus:ring-church-600 focus:border-church-600 outline-none transition-all bg-church-50"
                  placeholder="mario@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-church-700 mb-1.5">Tipo di Servizio *</label>
              <select 
                value={formState.service}
                onChange={e => setFormState({...formState, service: e.target.value})}
                className="w-full px-4 py-3 rounded border border-church-200 focus:ring-2 focus:ring-church-600 focus:border-church-600 outline-none transition-all bg-church-50"
              >
                {options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-church-700 mb-1.5">Dettagli Aggiuntivi</label>
              <textarea 
                rows={4}
                value={formState.message}
                onChange={e => setFormState({...formState, message: e.target.value})}
                className="w-full px-4 py-3 rounded border border-church-200 focus:ring-2 focus:ring-church-600 focus:border-church-600 outline-none transition-all resize-none bg-church-50"
                placeholder="Specifica anno di nascita, necessità particolari, ecc."
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className={`w-full text-white font-bold text-base sm:text-lg py-3 sm:py-4 rounded flex justify-center items-center gap-2 transition-colors shadow-md overflow-hidden px-2 ${
                submitting ? 'bg-church-400 cursor-not-allowed' : 'bg-church-600 hover:bg-opacity-90'
              }`}
            >
              <Send size={20} className="shrink-0" />
              <span className="truncate">{submitting ? 'Invio in corso...' : 'Invia Richiesta'}</span>
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
