import React from 'react';
import { motion } from 'motion/react';
import { Heart, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function DonationsView() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const donationMethods = [
    {
      id: 'oppeano',
      title: 'Parrocchia di Oppeano',
      iban: 'IT00A0000000000000000000000',
      reason: 'Erogazione liberale Parrocchia Oppeano - [Tuo Nome]',
      description: 'Sostieni le attività pastorali e la manutenzione della chiesa di Oppeano.'
    },
    {
      id: 'cadeglioppi',
      title: 'Parrocchia di Ca\' degli Oppi',
      iban: 'IT00B0000000000000000000000',
      reason: 'Erogazione liberale Parrocchia Ca\' degli Oppi - [Tuo Nome]',
      description: 'Contribuisci alle iniziative della comunità e alla cura delle strutture di Ca\' degli Oppi.'
    }
  ];

  return (
    <div className="pb-24 pt-8 px-4 max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mx-auto bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Heart size={32} />
        </div>
        <h1 className="text-3xl font-serif font-bold text-church-900 mb-4">Donazioni</h1>
        <p className="text-church-600 max-w-xl mx-auto">
          Il tuo contributo è prezioso per sostenere le opere di carità, le attività pastorali e la manutenzione delle nostre chiese. 
          Puoi effettuare una donazione tramite bonifico bancario utilizzando le coordinate qui sotto.
        </p>
      </motion.div>

      <div className="space-y-6 mt-8">
        {donationMethods.map((method, index) => (
          <motion.div 
            key={method.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-church-100"
          >
            <h2 className="text-xl font-serif font-bold text-church-900 mb-2">{method.title}</h2>
            <p className="text-church-500 text-sm mb-6">{method.description}</p>
            
            <div className="space-y-4">
              <div className="bg-church-50 p-4 rounded-xl">
                <div className="text-xs font-bold text-church-400 uppercase tracking-wider mb-1">IBAN</div>
                <div className="flex items-center justify-between gap-4">
                  <code className="text-sm md:text-base font-mono text-church-900 font-medium break-all">
                    {method.iban}
                  </code>
                  <button 
                    onClick={() => handleCopy(method.iban, `${method.id}-iban`)}
                    className="p-2 text-church-500 hover:text-church-900 hover:bg-church-100 rounded-lg transition-colors shrink-0"
                    title="Copia IBAN"
                  >
                    {copiedId === `${method.id}-iban` ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              <div className="bg-church-50 p-4 rounded-xl">
                <div className="text-xs font-bold text-church-400 uppercase tracking-wider mb-1">Causale consigliata</div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-church-800 font-medium">
                    {method.reason}
                  </span>
                  <button 
                    onClick={() => handleCopy(method.reason, `${method.id}-reason`)}
                    className="p-2 text-church-500 hover:text-church-900 hover:bg-church-100 rounded-lg transition-colors shrink-0"
                    title="Copia causale"
                  >
                    {copiedId === `${method.id}-reason` ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="text-center mt-12 bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
        <h3 className="font-bold text-yellow-800 mb-2">Agevolazioni Fiscali</h3>
        <p className="text-sm text-yellow-700">
          Ti ricordiamo che le erogazioni liberali effettuate con mezzi di pagamento tracciabili 
          (come il bonifico bancario) sono detraibili o deducibili ai sensi di legge. 
          Conserva la ricevuta del bonifico.
        </p>
      </div>
    </div>
  );
}
